import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { AutoFixContext, AutoFixFunction } from '../types';

/**
 * Options for the Auto-Fixer functionality
 */
export interface AutoFixOptions {
  /**
   * Function to fix errors automatically
   */
  autoFix: AutoFixFunction;
}

/**
 * Implementation of the Auto-Fixer functionality
 * Allows automatic repair of common API errors
 */
export class AutoFixer {
  private lastSuccessfulResponses: Map<string, AxiosResponse> = new Map();
  
  /**
   * Register a successful response for future reference
   */
  registerSuccess(url: string, response: AxiosResponse): void {
    this.lastSuccessfulResponses.set(url, response);
  }
  
  /**
   * Get the last successful response for a URL
   */
  getLastSuccessful(url: string): AxiosResponse | null {
    return this.lastSuccessfulResponses.get(url) || null;
  }
  
  /**
   * Clear all stored successful responses
   */
  clearHistory(): void {
    this.lastSuccessfulResponses.clear();
  }
  
  /**
   * Try to fix an error using the provided fix function
   */
  tryFix(error: AxiosError, url: string, options: AutoFixOptions): AxiosResponse | null {
    if (!options.autoFix) {
      return null;
    }
    
    try {
      // Create context object
      const context: AutoFixContext = {
        url,
        lastSuccessfulResponse: this.getLastSuccessful(url),
        responseHistory: []
      };
      
      // Try to fix the error
      const fixedData = options.autoFix(error, context);
      
      // If data was returned, create a synthetic response
      if (fixedData !== null && fixedData !== undefined) {
        const defaultConfig: InternalAxiosRequestConfig = {
          headers: new AxiosHeaders(),
          method: 'get',
          url: url,
          data: undefined
        };
        
        return {
          data: fixedData,
          status: 200,
          statusText: 'OK (Auto-Fixed)',
          headers: {},
          config: error.config || defaultConfig,
        };
      }
      
      return null;
    } catch (fixerError) {
      console.error('Error in Auto-Fixer:', fixerError);
      return null;
    }
  }
} 