// Exporter les fonctionnalités de base
export * from './Fetchless';
export * from './types';

// Exporter les fonctionnalités avancées
export * from './advanced';

// Créer une instance par défaut
import { Fetchless } from './Fetchless';
import { createAdvancedClient } from './advanced';
import { AxiosRequestConfig } from 'axios';

// Instance par défaut de Fetchless (standard)
const defaultClient = Fetchless.createClient({
  enableTimeTravel: true,
  enableIntelligencePanel: true
});

// Instance par défaut de AdvancedFetchless
const defaultAdvancedClient = createAdvancedClient();

// Exporter les méthodes de l'instance par défaut pour utilisation directe
// Utilisation de type générique pour éviter les références à des types privés
export const get = (url: string, config?: AxiosRequestConfig) => defaultClient.get(url, config);
export const post = (url: string, data?: any, config?: AxiosRequestConfig) => defaultClient.post(url, data, config);
export const put = (url: string, data?: any, config?: AxiosRequestConfig) => defaultClient.put(url, data, config);
export const deleteReq = (url: string, config?: AxiosRequestConfig) => defaultClient.delete(url, config);

// Exporter les méthodes avancées de l'instance par défaut
export const prefetch = defaultAdvancedClient.prefetch.bind(defaultAdvancedClient);
export const abortableGet = defaultAdvancedClient.abortableGet.bind(defaultAdvancedClient);

// Exporter les nouvelles fonctionnalités
export const freeze = defaultClient.freeze.bind(defaultClient);
export const unfreeze = defaultClient.unfreeze.bind(defaultClient);
export const getIntelligence = defaultClient.getIntelligence.bind(defaultClient);

// Export des hooks
const hooks = {
  useFetchless: null
};

// Exporter hooks React si React est installé
try {
  // Si React est disponible, exporter les hooks
  const { createFetchlessHooks } = require('./advanced');
  Object.assign(hooks, createFetchlessHooks(defaultAdvancedClient));
} catch (e) {
  // React n'est pas disponible, ne pas exporter les hooks
}

export const { useFetchless } = hooks;

// Exporter les instances par défaut
export { defaultClient, defaultAdvancedClient }; 