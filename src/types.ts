import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Available cache strategies
 */
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate';

/**
 * Configuration options for Fetchless
 */
export interface CacheConfig {
  /**
   * Cache strategy to use
   * @default 'stale-while-revalidate'
   */
  strategy?: CacheStrategy;
  
  /**
   * Cache lifetime in milliseconds
   * @default 5 * 60 * 1000 (5 minutes)
   */
  maxAge?: number;
  
  /**
   * Maximum number of entries in the cache
   * @default 100
   */
  maxSize?: number;

  /**
   * Enables history mode for Time Travel Fetch
   * @default false
   */
  enableTimeTravel?: boolean;

  /**
   * Duration for which to keep history in milliseconds
   * @default 7 * 24 * 60 * 60 * 1000 (7 days)
   */
  historyRetention?: number;

  /**
   * Enables Fetch Intelligence Panel mode
   * @default false
   */
  enableIntelligencePanel?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /**
   * Number of times a request was served from the cache
   */
  hits: number;
  
  /**
   * Number of times a request was not in the cache
   */
  misses: number;
  
  /**
   * Ratio of hits to the total number of requests
   */
  ratio: number;
  
  /**
   * Number of entries currently in the cache
   */
  size: number;
}

/**
 * Interface for a cache entry
 */
export interface CacheEntry {
  /**
   * Response data
   */
  response: AxiosResponse;
  
  /**
   * Timestamp when the entry was cached
   */
  timestamp: number;
  
  /**
   * Key used to identify this entry
   */
  key: string;
}

/**
 * Temporal options for Time Travel Fetch
 */
export interface TimeTravelOptions {
  /**
   * ISO date at which to retrieve the state of the data
   * Format: 'YYYY-MM-DDTHH:mm:ss'
   */
  at: string;
}

/**
 * Context for the Auto-Fixer functionality
 * Contains information that can be used to repair API errors
 */
export interface AutoFixContext {
  /**
   * The URL of the original request
   */
  url: string;
  
  /**
   * The last successful response for this URL (if available)
   */
  lastSuccessfulResponse: AxiosResponse | null;
  
  /**
   * History of previous responses for this URL
   */
  responseHistory: AxiosResponse[];
}

/**
 * Auto-Fixer function type
 * This function is called when a request fails and can return fallback data
 * @param error The error that occurred
 * @param context Context information for repairing the error
 * @returns Alternative data to use or null if repair is not possible
 */
export type AutoFixFunction = (error: any, context: AutoFixContext) => any | null;

/**
 * Options for Fetch Auto-Fixer
 */
export interface AutoFixOptions {
  /**
   * Automatic repair function
   */
  autoFix: AutoFixFunction;
}

/**
 * Fetch Intelligence interface
 * Provides analytics and insights about fetch patterns
 */
export interface FetchIntelligence {
  /**
   * Get the complete request history
   * @returns List of recorded requests with timestamps
   */
  getRequestHistory(): Array<{url: string, timestamp: number, component?: string}>;
  
  /**
   * Detect duplicate requests that might indicate inefficient fetching
   * @returns Information about duplicate requests
   */
  detectDuplicates(): Array<{url: string, count: number, components: string[]}>;
  
  /**
   * Get optimization suggestions based on request patterns
   * @returns List of suggestions to optimize API usage
   */
  suggestOptimizations(): Array<{suggestion: string, urls: string[]}>;
}

/**
 * Fetchless options
 * Configuration for individual requests
 */
export interface FetchlessOptions {
  /**
   * Cache strategy to use for this request
   */
  strategy?: CacheStrategy;
  
  /**
   * Auto-Fixer function to handle errors for this request
   */
  autoFix?: AutoFixFunction;
  
  /**
   * ISO timestamp for time travel requests
   * Use this to retrieve data as it was at a specific point in time
   */
  at?: string;
}

/**
 * Interface for an HTTP client with cache
 */
export interface FetchlessClient {
  /**
   * Performs a GET request with automatic caching
   */
  get<T = any>(url: string, config?: AxiosRequestConfig & FetchlessOptions): Promise<AxiosResponse<T>>;
  
  /**
   * Performs a POST request
   */
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  /**
   * Performs a PUT request
   */
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  /**
   * Performs a DELETE request
   */
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  /**
   * Returns statistics on cache usage
   */
  getStats(): CacheStats;
  
  /**
   * Clears the cache
   */
  clearCache(): void;

  /**
   * Activates "freeze" mode for a specific URL
   */
  freeze(url: string): void;

  /**
   * Deactivates "freeze" mode for a specific URL
   */
  unfreeze(url: string): void;

  /**
   * Accesses fetch request intelligence
   */
  getIntelligence(): FetchIntelligence;
} 