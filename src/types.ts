import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Stratégies de cache disponibles
 */
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate';

/**
 * Options de configuration pour Fetchless
 */
export interface CacheConfig {
  /**
   * Stratégie de cache à utiliser
   * @default 'stale-while-revalidate'
   */
  strategy?: CacheStrategy;
  
  /**
   * Durée de vie du cache en millisecondes
   * @default 5 * 60 * 1000 (5 minutes)
   */
  maxAge?: number;
  
  /**
   * Nombre maximum d'entrées dans le cache
   * @default 100
   */
  maxSize?: number;
}

/**
 * Statistiques du cache
 */
export interface CacheStats {
  /**
   * Nombre de fois où une requête a été servie depuis le cache
   */
  hits: number;
  
  /**
   * Nombre de fois où une requête n'était pas dans le cache
   */
  misses: number;
  
  /**
   * Ratio de hits par rapport au total des requêtes
   */
  ratio: number;
  
  /**
   * Nombre d'entrées actuellement dans le cache
   */
  size: number;
}

/**
 * Interface pour une entrée de cache
 */
export interface CacheEntry {
  /**
   * Données de la réponse
   */
  response: AxiosResponse;
  
  /**
   * Timestamp à laquelle l'entrée a été mise en cache
   */
  timestamp: number;
  
  /**
   * Clé utilisée pour identifier cette entrée
   */
  key: string;
}

/**
 * Interface pour un client HTTP avec cache
 */
export interface FetchlessClient {
  /**
   * Effectue une requête GET avec mise en cache automatique
   */
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  /**
   * Effectue une requête POST
   */
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  /**
   * Effectue une requête PUT
   */
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  /**
   * Effectue une requête DELETE
   */
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  /**
   * Renvoie des statistiques sur l'utilisation du cache
   */
  getStats(): CacheStats;
  
  /**
   * Vide le cache
   */
  clearCache(): void;
} 