import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LRUCache } from 'lru-cache';
import { CacheConfig, CacheStats, CacheStrategy, FetchlessClient, FetchlessOptions, AutoFixContext, AutoFixFunction, FetchIntelligence } from './types';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  strategy?: CacheStrategy;
  autoFix?: AutoFixFunction;
  at?: string;
}

/**
 * Implementation of intelligence for request analysis
 */
class FetchlessIntelligence implements FetchIntelligence {
  private requestLog: Array<{url: string, timestamp: number, component?: string}> = [];
  
  constructor() {
    this.requestLog = [];
  }
  
  /**
   * Records a request in the history
   */
  logRequest(url: string, component?: string): void {
    this.requestLog.push({
      url,
      timestamp: Date.now(),
      component
    });
  }
  
  /**
   * Detects repeated requests
   */
  detectDuplicates(): Array<{url: string, count: number, components: string[]}> {
    const urlCounts = new Map<string, {count: number, components: Set<string>}>();
    
    this.requestLog.forEach(log => {
      const current = urlCounts.get(log.url) || { count: 0, components: new Set<string>() };
      current.count++;
      if (log.component) {
        current.components.add(log.component);
      }
      urlCounts.set(log.url, current);
    });
    
    return Array.from(urlCounts.entries())
      .filter(([_, stats]) => stats.count > 3)
      .map(([url, stats]) => ({
        url,
        count: stats.count,
        components: Array.from(stats.components)
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Suggests optimizations for requests
   */
  suggestOptimizations(): Array<{suggestion: string, urls: string[]}> {
    const suggestions: Array<{suggestion: string, urls: string[]}> = [];
    const duplicates = this.detectDuplicates();
    
    // Suggest grouping similar requests
    const urlsBySimilarity = new Map<string, string[]>();
    duplicates.forEach(dup => {
      // Analyze URL to find the base pattern (without query params)
      const urlBase = dup.url.split('?')[0];
      const current = urlsBySimilarity.get(urlBase) || [];
      current.push(dup.url);
      urlsBySimilarity.set(urlBase, current);
    });
    
    urlsBySimilarity.forEach((urls, urlBase) => {
      if (urls.length > 1) {
        suggestions.push({
          suggestion: `You can group ${urls.length} requests to ${urlBase}`,
          urls
        });
      }
    });
    
    // Suggest caching for frequent requests
    duplicates.forEach(dup => {
      if (dup.count > 10) {
        suggestions.push({
          suggestion: `This URL is called ${dup.count} times, consider increasing its cache duration`,
          urls: [dup.url]
        });
      }
    });
    
    return suggestions;
  }
  
  /**
   * Retrieves the request history
   */
  getRequestHistory(): Array<{url: string, timestamp: number, component?: string}> {
    return [...this.requestLog];
  }
  
  /**
   * Cleans up old entries from the log
   */
  cleanupOldEntries(maxAgeMs: number): void {
    const now = Date.now();
    this.requestLog = this.requestLog.filter(entry => (now - entry.timestamp) < maxAgeMs);
  }
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
  
  // Historical storage for Time Travel
  private historyCache: Map<string, Array<{timestamp: number, response: AxiosResponse}>> = new Map();
  
  // URLs in freeze mode
  private frozenUrls: Set<string> = new Set();
  
  // Last successful response per URL for Auto-Fixer
  private lastSuccessfulResponses: Map<string, AxiosResponse> = new Map();
  
  // Request intelligence
  private intelligence: FetchlessIntelligence = new FetchlessIntelligence();

  // Cache for frozen data
  private freezeCache: Map<string, any> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      strategy: config?.strategy || 'cache-first',
      maxAge: config?.maxAge || 5 * 60 * 1000, // Default 5 minutes
      maxSize: config?.maxSize || 100,
      enableTimeTravel: config?.enableTimeTravel || false,
      historyRetention: config?.historyRetention || 7 * 24 * 60 * 60 * 1000, // Default 7 days
      enableIntelligencePanel: config?.enableIntelligencePanel || false
    };

    this.axiosInstance = axios.create();
    const cacheConfig = {
      max: this.config.maxSize || 100,
      ttl: this.config.maxAge || 5 * 60 * 1000,
      ttlAutopurge: true
    };
    
    this.cache = new LRUCache<string, any>(cacheConfig);
    
    // Reset statistics
    this.stats = {
      hits: 0,
      misses: 0,
      ratio: 0,
      size: 0
    };
    
    // Schedule history cleanup if time travel is enabled
    if (this.config.enableTimeTravel) {
      // Cleanup every 24h
      setInterval(() => {
        this.cleanupHistory();
      }, 24 * 60 * 60 * 1000);
    }
    
    // Schedule intelligence logs cleanup
    if (this.config.enableIntelligencePanel) {
      setInterval(() => {
        this.intelligence.cleanupOldEntries(30 * 24 * 60 * 60 * 1000); // 30 days retention
      }, 24 * 60 * 60 * 1000);
    }
  }

  public static createClient(config?: Partial<CacheConfig>): Fetchless {
    if (!Fetchless.instance) {
      Fetchless.instance = new Fetchless(config);
    }
    return Fetchless.instance;
  }

  /**
   * Performs a GET request with cache management
   */
  async get<T = any>(url: string, config?: ExtendedAxiosRequestConfig & FetchlessOptions): Promise<AxiosResponse<T>> {
    // If URL is frozen, serve from cache without refreshing
    if (this.frozenUrls.has(url)) {
      const cacheKey = this.generateCacheKey(url, config);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.stats.hits++;
        return cached.response as AxiosResponse<T>;
      }
    }
    
    // Time Travel: if a date is specified, look in history
    if (config?.at && this.config.enableTimeTravel) {
      return this.getHistoricalData<T>(url, config.at, config);
    }
    
    // Record the request for intelligence
    if (this.config.enableIntelligencePanel) {
      // Try to detect where the request is coming from (React component)
      const stackTrace = new Error().stack || '';
      const componentMatch = stackTrace.match(/at\s+([A-Z][a-zA-Z0-9]+)\s+\(/);
      const component = componentMatch ? componentMatch[1] : undefined;
      
      this.intelligence.logRequest(url, component);
    }
    
    return this.handleRequest<T>(url, config);
  }

  /**
   * Performs a POST request (not cached)
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  /**
   * Performs a PUT request (not cached)
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  /**
   * Performs a DELETE request (not cached)
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  /**
   * Returns cache usage statistics
   */
  getStats(): CacheStats {
    // Update statistics
    this.stats.size = this.cache.size;
    const total = this.stats.hits + this.stats.misses;
    this.stats.ratio = total > 0 ? this.stats.hits / total : 0;
    
    return { ...this.stats };
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.stats.size = 0;
  }
  
  /**
   * Freeze data for a specific URL
   * @param url The URL to freeze
   */
  public freeze(url: string): void {
    // Check if we already have data in cache for this URL
    const cachedData = this.cache.get(url);
    if (cachedData) {
      // Save current data in freezeCache
      this.freezeCache.set(url, cachedData);
      console.log(`Data frozen for ${url}`);
    } else {
      console.warn(`No cached data for ${url}, cannot freeze`);
    }
  }
  
  /**
   * Unfreeze data for a specific URL
   * @param url The URL to unfreeze
   */
  public unfreeze(url: string): void {
    // Remove data from freezeCache
    if (this.freezeCache.has(url)) {
      this.freezeCache.delete(url);
      console.log(`Data unfrozen for ${url}`);
    }
  }
  
  /**
   * Access fetch request intelligence
   */
  getIntelligence(): FetchIntelligence {
    return this.intelligence;
  }

  /**
   * "Cache First" strategy: tries to serve from cache first
   */
  private async cacheFirstStrategy<T>(cacheKey: string, url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Check if the resource is in cache and not expired
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isExpired(cached)) {
      // Cache hit
      this.stats.hits++;
      // Return the response property of the cache entry, not the entire entry
      return cached.response as AxiosResponse<T>;
    }
    
    // Cache miss, make the network request
    this.stats.misses++;
    
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      
      // Cache the response
      this.cacheResponse(cacheKey, response);
      
      // Store as last successful response for Auto-Fixer
      this.lastSuccessfulResponses.set(url, response);
      
      // Store in history if Time Travel is enabled
      if (this.config.enableTimeTravel) {
        this.storeInHistory(url, response);
      }
      
      return response;
    } catch (error) {
      // If Auto-Fixer is configured, try to repair the error
      if (config?.autoFix) {
        const fixedResponse = this.tryAutoFix<T>(error, url, config.autoFix);
        if (fixedResponse) {
          return fixedResponse;
        }
      }
      
      // No possible repair, propagate the error
      throw error;
    }
  }

  /**
   * "Network First" strategy: tries network request first, uses cache on failure
   */
  private async networkFirstStrategy<T>(cacheKey: string, url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      // Try network request first (always)
      const response = await this.axiosInstance.get<T>(url, config);
      
      // Cache the response
      this.cacheResponse(cacheKey, response);
      
      // Store as last successful response for Auto-Fixer
      this.lastSuccessfulResponses.set(url, response);
      
      // Store in history if Time Travel is enabled
      if (this.config.enableTimeTravel) {
        this.storeInHistory(url, response);
      }
      
      return response;
    } catch (error) {
      // If Auto-Fixer is configured, try to repair the error
      if (config?.autoFix) {
        const fixedResponse = this.tryAutoFix<T>(error, url, config.autoFix);
        if (fixedResponse) {
          return fixedResponse;
        }
      }
      
      // On network error, try the cache
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        // Cache hit (even if expired, use it as fallback)
        this.stats.hits++;
        return cached.response as AxiosResponse<T>;
      }
      
      // No data in cache, propagate the error
      this.stats.misses++;
      throw error;
    }
  }

  /**
   * "Stale While Revalidate" strategy: serves cached data while refreshing in the background
   */
  private async staleWhileRevalidateStrategy<T>(cacheKey: string, url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    const cached = this.cache.get(cacheKey);
    
    // If we have cached data, even stale
    if (cached) {
      this.stats.hits++;
      
      // If the cache is expired, refresh in the background
      if (this.isExpired(cached)) {
        // Refresh in the background without waiting for response
        this.refreshCache<T>(cacheKey, url, config);
      }
      
      // Return cached data immediately
      return cached.response as AxiosResponse<T>;
    }
    
    // Cache miss, make the network request
    this.stats.misses++;
    
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      
      // Cache the response
      this.cacheResponse(cacheKey, response);
      
      // Store as last successful response for Auto-Fixer
      this.lastSuccessfulResponses.set(url, response);
      
      // Store in history if Time Travel is enabled
      if (this.config.enableTimeTravel) {
        this.storeInHistory(url, response);
      }
      
      return response;
    } catch (error) {
      // If Auto-Fixer is configured, try to repair the error
      if (config?.autoFix) {
        const fixedResponse = this.tryAutoFix<T>(error, url, config.autoFix);
        if (fixedResponse) {
          return fixedResponse;
        }
      }
      
      // No possible repair, propagate the error
      throw error;
    }
  }

  /**
   * Refreshes a cache entry in the background
   */
  private async refreshCache<T>(cacheKey: string, url: string, config?: ExtendedAxiosRequestConfig): Promise<void> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      this.cacheResponse(cacheKey, response);
      
      // Store as last successful response for Auto-Fixer
      this.lastSuccessfulResponses.set(url, response);
      
      // Store in history if Time Travel is enabled
      if (this.config.enableTimeTravel) {
        this.storeInHistory(url, response);
      }
    } catch (error) {
      // Ignore errors during background refresh
      console.warn(`Fetchless: Background refresh failed for ${cacheKey}`, error);
    }
  }

  /**
   * Caches a response
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
   * Checks if a cache entry is expired
   */
  private isExpired(entry: any): boolean {
    const now = Date.now();
    const maxAge = this.config.maxAge || 5 * 60 * 1000;
    return (now - entry.timestamp) > maxAge;
  }

  /**
   * Generates a cache key based on URL and configuration
   */
  private generateCacheKey(url: string, config?: ExtendedAxiosRequestConfig): string {
    if (!config) {
      return url;
    }
    
    // Generate a key that includes request parameters
    let key = url;
    
    // Include query parameters in the key
    if (config.params) {
      const params = new URLSearchParams();
      
      // Sort parameters by key to ensure consistency
      const sortedKeys = Object.keys(config.params).sort();
      
      for (const key of sortedKeys) {
        params.append(key, String(config.params[key]));
      }
      
      const paramsString = params.toString();
      if (paramsString) {
        key += `?${paramsString}`;
      }
    }
    
    // Include authentication headers if they exist
    if (config.headers?.Authorization) {
      key += `|auth=${config.headers.Authorization}`;
    }
    
    return key;
  }

  /**
   * Handles the request according to the chosen strategy
   */
  private async handleRequest<T>(url: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    const strategy = config?.strategy || this.config.strategy;
    const cacheKey = this.generateCacheKey(url, config);
    
    switch (strategy) {
      case 'network-first':
        return this.networkFirstStrategy<T>(cacheKey, url, config);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy<T>(cacheKey, url, config);
      case 'cache-first':
      default:
        return this.cacheFirstStrategy<T>(cacheKey, url, config);
    }
  }
  
  /**
   * Stores a response in history for Time Travel
   */
  private storeInHistory(url: string, response: AxiosResponse): void {
    if (!this.config.enableTimeTravel) return;
    
    const history = this.historyCache.get(url) || [];
    history.push({
      timestamp: Date.now(),
      response: { ...response }
    });
    
    this.historyCache.set(url, history);
  }
  
  /**
   * Cleans up history entries older than retention period
   */
  private cleanupHistory(): void {
    if (!this.config.enableTimeTravel) return;
    
    const now = Date.now();
    const retention = this.config.historyRetention || 7 * 24 * 60 * 60 * 1000;
    
    this.historyCache.forEach((entries, url) => {
      // Filter and keep only recent entries
      const filteredEntries = entries.filter(entry => (now - entry.timestamp) < retention);
      
      if (filteredEntries.length === 0) {
        this.historyCache.delete(url);
      } else {
        this.historyCache.set(url, filteredEntries);
      }
    });
  }
  
  /**
   * Retrieves historical data for Time Travel
   */
  private getHistoricalData<T>(url: string, isoDateString: string, config?: ExtendedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (!this.config.enableTimeTravel) {
      throw new Error("Time Travel Fetch is not enabled. Enable it with enableTimeTravel: true");
    }
    
    const targetDate = new Date(isoDateString).getTime();
    if (isNaN(targetDate)) {
      throw new Error("Invalid date format. Use ISO 8601 (ex: '2023-05-15T09:00:00')");
    }
    
    const history = this.historyCache.get(url) || [];
    
    if (history.length === 0) {
      throw new Error(`No historical data available for ${url}`);
    }
    
    // Find the historical entry closest to the target date
    let closestEntry = history[0];
    let minTimeDiff = Math.abs(targetDate - closestEntry.timestamp);
    
    for (let i = 1; i < history.length; i++) {
      const entry = history[i];
      const timeDiff = Math.abs(targetDate - entry.timestamp);
      
      if (timeDiff < minTimeDiff) {
        closestEntry = entry;
        minTimeDiff = timeDiff;
      }
    }
    
    return Promise.resolve(closestEntry.response as AxiosResponse<T>);
  }
  
  /**
   * Tries to repair an error using the auto-fixer
   * @param error The error to handle
   * @param url The request URL
   * @param options Fetchless options
   * @returns A repaired response or null if repair is not possible
   */
  private tryAutoFix<T>(error: any, url: string, autoFixFunction: AutoFixFunction): AxiosResponse<T> | null {
    try {
      // Create context for AutoFix
      const context: AutoFixContext = {
        lastSuccessfulResponse: this.lastSuccessfulResponses.get(url) as AxiosResponse,
        responseHistory: (this.historyCache.get(url) || []).map(entry => entry.response),
        url
      };
      
      // Call the repair function
      const fixedData = autoFixFunction(error, context);
      
      // If the function returned something, create a synthetic response
      if (fixedData !== null && fixedData !== undefined) {
        const fixedResponse: AxiosResponse<T> = {
          data: fixedData,
          status: 200,
          statusText: 'OK (Auto-Fixed)',
          headers: {},
          config: error.config || {},
          request: error.request
        };
        
        return fixedResponse;
      }
      
      return null;
    } catch (fixerError) {
      console.error('Error in Auto-Fixer:', fixerError);
      return null;
    }
  }
} 