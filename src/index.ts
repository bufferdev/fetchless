import { Fetchless } from './Fetchless';
import { CacheConfig } from './types';

// Créer une instance par défaut
const defaultClient = Fetchless.createClient();

// Fonction d'accès simplifiée
export function get(url: string, config?: any) {
  return defaultClient.get(url, config);
}

export function post(url: string, data?: any, config?: any) {
  return defaultClient.post(url, data, config);
}

export function put(url: string, data?: any, config?: any) {
  return defaultClient.put(url, data, config);
}

export function del(url: string, config?: any) {
  return defaultClient.delete(url, config);
}

export function clearCache() {
  return defaultClient.clearCache();
}

export function getStats() {
  return defaultClient.getStats();
}

// Créer un client personnalisé
export function createClient(config?: Partial<CacheConfig>) {
  return Fetchless.createClient(config);
}

// Également exporter la classe
export { Fetchless }; 