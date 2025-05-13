import { Fetchless } from './Fetchless';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CacheConfig } from './types';

// Types pour les fonctionnalités avancées
export interface RequestInterceptor {
  (url: string, config?: AxiosRequestConfig): [string, AxiosRequestConfig?] | void;
}

export interface ResponseInterceptor {
  (response: AxiosResponse): AxiosResponse | void;
}

export interface RetryOptions {
  maxRetries?: number;
  backoffFactor?: number;
  retryStatusCodes?: number[];
}

export interface PrefetchOptions {
  ttl?: number;
  priority?: 'high' | 'low' | 'normal';
}

export interface AdvancedOptions {
  persistCache?: boolean;
  localStorage?: Storage;
  dedupeRequests?: boolean;
  enableLogs?: boolean;
  retryOptions?: RetryOptions;
  maxAge?: number;
}

// Déclaration du type pour l'entrée de cache persistant
interface PersistentCacheEntry {
  data: any;
  status: number;
  headers: any;
  timestamp: number;
}

// Types pour React hooks
export interface ReactHookResult<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export class AdvancedFetchless extends Fetchless {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private persistentCache: Storage | null = null;
  private logs: Array<{ url: string, info: string, timestamp: Date }> = [];
  private dedupeRequests: boolean = true;
  private enableLogs: boolean = false;
  private maxAge: number = 5 * 60 * 1000; // 5 minutes par défaut
  private retryOptions: RetryOptions = {
    maxRetries: 3,
    backoffFactor: 300,
    retryStatusCodes: [408, 429, 500, 502, 503, 504]
  };

  constructor(advancedOptions?: AdvancedOptions) {
    super();
    
    if (advancedOptions) {
      // Configuration du cache persistant
      if (advancedOptions.persistCache && advancedOptions.localStorage) {
        this.persistentCache = advancedOptions.localStorage;
        this.loadCacheFromStorage();
      }
      
      // Configuration de la déduplication
      this.dedupeRequests = advancedOptions.dedupeRequests ?? true;
      
      // Configuration des logs
      this.enableLogs = advancedOptions.enableLogs ?? false;
      
      // Configuration du maxAge
      if (advancedOptions.maxAge) {
        this.maxAge = advancedOptions.maxAge;
      }
      
      // Configuration des options de retry
      if (advancedOptions.retryOptions) {
        this.retryOptions = {
          ...this.retryOptions,
          ...advancedOptions.retryOptions
        };
      }
    }
  }

  /**
   * Ajoute un intercepteur de requête
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter(i => i !== interceptor);
    };
  }

  /**
   * Ajoute un intercepteur de réponse
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter(i => i !== interceptor);
    };
  }

  /**
   * Précharge une URL en arrière-plan
   */
  prefetch(url: string, options?: PrefetchOptions): void {
    this.logRequest(url, 'Préchargement démarré');
    
    // On lance la requête en arrière-plan sans attendre la réponse
    this.get(url)
      .then(() => this.logRequest(url, 'Préchargement terminé'))
      .catch(err => this.logRequest(url, `Erreur de préchargement: ${err.message}`));
  }

  /**
   * Surcharge de la méthode get pour ajouter les fonctionnalités avancées
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Appliquer les intercepteurs de requête
    let modifiedUrl = url;
    let modifiedConfig = config || {};
    
    for (const interceptor of this.requestInterceptors) {
      const result = interceptor(modifiedUrl, modifiedConfig);
      if (result) {
        [modifiedUrl, modifiedConfig] = result as [string, AxiosRequestConfig];
      }
    }

    // Gestion de la déduplication
    if (this.dedupeRequests) {
      const cacheKey = this.generateDedupeCacheKey(modifiedUrl, modifiedConfig);
      
      if (this.pendingRequests.has(cacheKey)) {
        this.logRequest(modifiedUrl, 'Requête dédupliquée');
        return this.pendingRequests.get(cacheKey) as Promise<AxiosResponse<T>>;
      }
      
      const requestPromise = this.executeGetWithRetry<T>(modifiedUrl, modifiedConfig);
      this.pendingRequests.set(cacheKey, requestPromise);
      
      try {
        const response = await requestPromise;
        return response;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    }
    
    return this.executeGetWithRetry<T>(modifiedUrl, modifiedConfig);
  }

  /**
   * Exécute une requête GET avec gestion des retry
   */
  private async executeGetWithRetry<T>(url: string, config?: AxiosRequestConfig, attempt = 0): Promise<AxiosResponse<T>> {
    try {
      // Exécuter la requête normale avec super.get
      this.logRequest(url, `Tentative ${attempt + 1}`);
      let response = await super.get<T>(url, config);
      
      // Appliquer les intercepteurs de réponse
      for (const interceptor of this.responseInterceptors) {
        const modifiedResponse = interceptor(response);
        if (modifiedResponse) {
          response = modifiedResponse;
        }
      }
      
      // Si nous avons un cache persistant, stocker la réponse
      if (this.persistentCache) {
        this.saveToPersistentCache(url, response);
      }
      
      this.logRequest(url, 'Requête réussie');
      return response;
    } catch (error: any) {
      this.logRequest(url, `Erreur: ${error.message}`);
      
      // Logique de retry
      if (
        attempt < (this.retryOptions.maxRetries || 3) && 
        (
          !error.response || 
          (this.retryOptions.retryStatusCodes && 
           this.retryOptions.retryStatusCodes.includes(error.response.status))
        )
      ) {
        const delay = (this.retryOptions.backoffFactor || 300) * Math.pow(2, attempt);
        this.logRequest(url, `Nouvelle tentative dans ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeGetWithRetry<T>(url, config, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Génère une clé pour la déduplication des requêtes
   */
  private generateDedupeCacheKey(url: string, config?: AxiosRequestConfig): string {
    let key = url;
    
    if (config?.params) {
      key += JSON.stringify(config.params);
    }
    
    return `dedupe:${key}`;
  }

  /**
   * Sauvegarde une réponse dans le cache persistant
   */
  private saveToPersistentCache(url: string, response: AxiosResponse): void {
    if (!this.persistentCache) return;
    
    try {
      const cacheKey = `fetchless:${url}`;
      const cacheEntry: PersistentCacheEntry = {
        data: response.data,
        status: response.status,
        headers: response.headers,
        timestamp: Date.now()
      };
      
      this.persistentCache.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn(`Échec de la sauvegarde dans le cache persistant: ${error}`);
    }
  }

  /**
   * Charge le cache depuis le stockage persistant
   */
  private loadCacheFromStorage(): void {
    if (!this.persistentCache) return;
    
    try {
      for (let i = 0; i < this.persistentCache.length; i++) {
        const key = this.persistentCache.key(i);
        if (key && key.startsWith('fetchless:')) {
          const url = key.replace('fetchless:', '');
          const storedValue = this.persistentCache.getItem(key);
          
          if (storedValue) {
            const cacheEntry = JSON.parse(storedValue) as PersistentCacheEntry;
            
            // Seulement si pas expiré
            const now = Date.now();
            if (now - cacheEntry.timestamp < this.maxAge) {
              // Recréer une réponse similaire et l'ajouter au cache en mémoire
              const response = {
                data: cacheEntry.data,
                status: cacheEntry.status,
                headers: cacheEntry.headers,
                config: {},
                statusText: ''
              };
              
              // Utiliser super.get pour ajouter au cache
              super.get(url).catch(() => {});
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Échec du chargement depuis le cache persistant: ${error}`);
    }
  }

  /**
   * Enregistre une entrée de log
   */
  private logRequest(url: string, info: string): void {
    if (!this.enableLogs) return;
    
    const logEntry = { url, info, timestamp: new Date() };
    this.logs.push(logEntry);
    console.log(`[Fetchless] ${url}: ${info}`);
  }

  /**
   * Récupère les logs de requêtes
   */
  getLogs(): Array<{ url: string, info: string, timestamp: Date }> {
    return [...this.logs];
  }

  /**
   * Efface les logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Crée une requête annulable avec AbortController
   */
  abortableGet<T = any>(url: string, config?: AxiosRequestConfig): { 
    promise: Promise<AxiosResponse<T>>, 
    abort: () => void 
  } {
    const controller = new AbortController();
    const { signal } = controller;
    
    const promise = this.get<T>(url, { 
      ...config, 
      signal 
    });
    
    return {
      promise,
      abort: () => controller.abort()
    };
  }
}

// Définition type pour le hook React (pour la documentation)
export type UseFetchless = <T = any>(url: string, options?: any) => ReactHookResult<T>;

// Export React hooks - implémentation simplifiée pour éviter les erreurs de typage
export const createFetchlessHooks = (fetchlessInstance: AdvancedFetchless): { useFetchless: any } => {
  return {
    useFetchless: (url: string, options: any = {}) => {
      try {
        // Tenter d'importer React dynamiquement
        // @ts-ignore - L'import de React est géré dynamiquement
        const React = require('react');
        
        // Utilisation non typée de useState et useEffect
        const [data, setData] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [error, setError] = React.useState(null);
        
        React.useEffect(() => {
          let isMounted = true;
          setLoading(true);
          
          const { promise, abort } = fetchlessInstance.abortableGet(url, options);
          
          promise
            .then((response: any) => {
              if (isMounted) {
                setData(response.data);
                setLoading(false);
              }
            })
            .catch((err: any) => {
              if (isMounted) {
                setError(err);
                setLoading(false);
              }
            });
          
          return () => {
            isMounted = false;
            abort();
          };
        }, [url, JSON.stringify(options)]);
        
        return { data, loading, error };
      } catch (error) {
        console.error('React is required for useFetchless hook', error);
        throw new Error('React is required for useFetchless hook');
      }
    }
  };
};

// Fonction d'export principale
export function createAdvancedClient(options?: AdvancedOptions): AdvancedFetchless {
  return new AdvancedFetchless(options);
} 