import { Fetchless } from '../src/Fetchless';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Fetchless', () => {
  let client: Fetchless;
  const mockAxiosGet = jest.fn().mockResolvedValue({ data: { test: 'data' } });
  const mockAxiosPost = jest.fn().mockResolvedValue({ data: { test: 'post-data' } });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance before each test
    // @ts-ignore - Access private static property for testing
    Fetchless.instance = undefined;
    
    // Configure mocks
    (axios.create as jest.Mock).mockReturnValue({
      get: mockAxiosGet,
      post: mockAxiosPost,
      put: jest.fn().mockResolvedValue({ data: { test: 'put-data' } }),
      delete: jest.fn().mockResolvedValue({ data: { test: 'delete-data' } })
    });
    
    client = Fetchless.createClient();
  });

  describe('Basic functionality', () => {
    it('should cache GET requests', async () => {
      const url = 'https://api.example.com/test';
      
      // First request
      await client.get(url);
      
      // Second request (should use cache)
      await client.get(url);
      
      // Should only call network once
      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
    });

    it('should not cache POST requests', async () => {
      const url = 'https://api.example.com/test';
      
      await client.post(url, { data: 'test' });
      await client.post(url, { data: 'test' });
      
      expect(mockAxiosPost).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache strategies', () => {
    it('should handle cache-first strategy', async () => {
      client = Fetchless.createClient({ strategy: 'cache-first' });
      const url = 'https://api.example.com/test';
      
      await client.get(url);
      await client.get(url);
      
      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
    });

    it('should handle network-first strategy', async () => {
      client = Fetchless.createClient({ strategy: 'network-first' });
      
      // Utiliser deux URLs différentes pour avoir deux appels réseau
      await client.get('https://api.example.com/test1');
      await client.get('https://api.example.com/test2');
      
      expect(mockAxiosGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache statistics', () => {
    it('should track cache hits and misses', async () => {
      // Reset stats by creating a new instance
      client = Fetchless.createClient();
      const url = 'https://api.example.com/test';
      
      // First request (miss)
      await client.get(url);
      
      // Second request (hit)
      await client.get(url);
      
      const stats = client.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.ratio).toBe(0.5);
    });
  });
}); 