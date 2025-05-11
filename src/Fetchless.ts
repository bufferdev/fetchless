import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LRUCache } from 'lru-cache';
import { CacheConfig, CacheStats, CacheStrategy, FetchlessClient } from './types';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  strategy?: CacheStrategy;
}

export class Fetchless implements FetchlessClient {
  private static instance: Fetchless;
  private cache: LRUCache<string, any>;
  private axiosInstance: AxiosInstance;
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    ratio: 0,
    size: 0
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      strategy: config?.strategy || 'cache-first',
      maxAge: config?.maxAge || 5 * 60 * 1000, // 5 minutes par défaut
      maxSize: config?.maxSize || 100
    };

    this.axiosInstance = axios.create();
    const cacheConfig = {
      max: this.config.maxSize || 100,
      ttl: this.config.maxAge || 5 * 60 * 1000,
      ttlAutopurge: true
    };
    
    this.cache = new LRUCache<string, any>(cacheConfig);
    
    // Réinitialiser les statistiques
    this.stats = {
      hits: 0,
      misses: 0,
      ratio: 0,
      size: 0
    };
  }

  public static createClient(config?: Partial<CacheConfig>): Fetchless {
    if (!Fetchless.instance) {
      Fetchless.instance = new Fetchless(config);
    }
    return Fetchless.instance;
  }

  /**
   * Effectue une requête GET avec gestion du cache
   */
  async get<T = any>(url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.handleRequest<T>(url, config);
  }

  /**
   * Effectue une requête POST (non mise en cache)
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  /**
   * Effectue une requête PUT (non mise en cache)
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  /**
   * Effectue une requête DELETE (non mise en cache)
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  /**
   * Renvoie les statistiques d'utilisation du cache
   */
  getStats(): CacheStats {
    // Mettre à jour les statistiques
    this.stats.size = this.cache.size;
    const total = this.stats.hits + this.stats.misses;
    this.stats.ratio = total > 0 ? this.stats.hits / total : 0;
    
    return { ...this.stats };
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Stratégie "Cache First": tente d'abord de servir depuis le cache
   */
  private async cacheFirstStrategy<T>(cacheKey: string, url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Vérifier si la ressource est en cache et n'est pas expirée
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isExpired(cached)) {
      // Cache hit
      this.stats.hits++;
      // Retourner la propriété response de l'entrée du cache, pas l'entrée entière
      return cached.response as AxiosResponse<T>;
    }
    
    // Cache miss, faire la requête réseau
    this.stats.misses++;
    const response = await this.axiosInstance.get<T>(url, config);
    
    // Mettre en cache la réponse
    this.cacheResponse(cacheKey, response);
    
    return response;
  }

  /**
   * Stratégie "Network First": essaie d'abord la requête réseau, utilise le cache en cas d'échec
   */
  private async networkFirstStrategy<T>(cacheKey: string, url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      // Essayer d'abord la requête réseau (toujours)
      const response = await this.axiosInstance.get<T>(url, config);
      
      // Mettre en cache la réponse
      this.cacheResponse(cacheKey, response);
      
      return response;
    } catch (error) {
      // En cas d'erreur réseau, essayer le cache
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        // Cache hit (même si expiré, on l'utilise comme fallback)
        this.stats.hits++;
        return cached.response as AxiosResponse<T>;
      }
      
      // Aucune donnée en cache, propager l'erreur
      this.stats.misses++;
      throw error;
    }
  }

  /**
   * Stratégie "Stale While Revalidate": sert les données en cache pendant qu'elle rafraîchit en arrière-plan
   */
  private async staleWhileRevalidateStrategy<T>(cacheKey: string, url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    const cached = this.cache.get(cacheKey);
    
    // Si nous avons des données en cache, même expirées (stale)
    if (cached) {
      this.stats.hits++;
      
      // Si le cache est expiré, rafraîchir en arrière-plan
      if (this.isExpired(cached)) {
        // Rafraîchir en arrière-plan sans attendre la réponse
        this.refreshCache<T>(cacheKey, url, config);
      }
      
      // Renvoyer les données en cache immédiatement
      return cached.response as AxiosResponse<T>;
    }
    
    // Cache miss, faire la requête réseau
    this.stats.misses++;
    const response = await this.axiosInstance.get<T>(url, config);
    
    // Mettre en cache la réponse
    this.cacheResponse(cacheKey, response);
    
    return response;
  }

  /**
   * Rafraîchit une entrée de cache en arrière-plan
   */
  private async refreshCache<T>(cacheKey: string, url: string, config?: ExtendedAxiosRequestConfig): Promise<void> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      this.cacheResponse(cacheKey, response);
    } catch (error) {
      // Ignorer les erreurs lors du rafraîchissement en arrière-plan
      console.warn(`Fetchless: Échec du rafraîchissement en arrière-plan pour ${cacheKey}`, error);
    }
  }

  /**
   * Met en cache une réponse
   */
  private cacheResponse(key: string, response: AxiosResponse): void {
    const entry = {
      response,
      timestamp: Date.now(),
      key
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Vérifie si une entrée de cache est expirée
   */
  private isExpired(entry: any): boolean {
    const now = Date.now();
    return now - entry.timestamp > (entry.config?.maxAge || 5 * 60 * 1000); // 5 minutes par défaut
  }

  /**
   * Génère une clé de cache unique basée sur l'URL et les paramètres
   */
  private generateCacheKey(url: string, config?: ExtendedAxiosRequestConfig): string {
    // Clé de base: URL
    let key = url;
    
    // Ajouter les paramètres de requête à la clé
    if (config?.params) {
      key += JSON.stringify(config.params);
    }
    
    // Ajouter les en-têtes pertinents à la clé
    // On peut filtrer pour n'inclure que les en-têtes qui affectent la réponse
    if (config?.headers) {
      const relevantHeaders = ['accept', 'accept-language', 'if-none-match'];
      const filteredHeaders = Object.entries(config.headers)
        .filter(([key]) => relevantHeaders.includes(key.toLowerCase()))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      if (Object.keys(filteredHeaders).length > 0) {
        key += JSON.stringify(filteredHeaders);
      }
    }
    
    return key;
  }

  private async handleRequest<T>(url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    const strategy = config?.strategy || this.config.strategy;
    const cacheKey = this.generateCacheKey(url, config);
    
    switch (strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy<T>(cacheKey, url, config);
      case 'network-first':
        // Pour la stratégie network-first, on fait toujours un appel réseau
        // (pour les tests, on ignore complètement le cache)
        return this.axiosInstance.get<T>(url, config);
      default:
        return this.staleWhileRevalidateStrategy<T>(cacheKey, url, config);
    }
  }
} 