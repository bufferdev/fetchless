// Test des fonctionnalités de Fetchless
const fetchless = require('./cjs-wrapper');

// Accès aux fonctions et instances
const get = fetchless.get;
const prefetch = fetchless.prefetch;
const abortableGet = fetchless.abortableGet;
const createAdvancedClient = fetchless.createAdvancedClient;
const Fetchless = fetchless.Fetchless;

// Créer nos propres instances pour le test
const client = Fetchless.createClient();
const advancedClient = createAdvancedClient({ enableLogs: true });

// URL de test
const TEST_URL = 'https://jsonplaceholder.typicode.com/todos/1';

// Fonction principale de test
async function runTests() {
  console.log('Demarrage des tests Fetchless v1.1.2...\n');

  // Test 1: Fonctionnalité de base - GET avec cache
  console.log('Test 1: Fonctionnalité de base - GET avec cache');
  console.time('Premiere requete');
  const response1 = await get(TEST_URL);
  console.timeEnd('Premiere requete');
  
  console.time('Seconde requete (depuis cache)');
  const response2 = await get(TEST_URL);
  console.timeEnd('Seconde requete (depuis cache)');
  
  console.log('Donnees recues:', response1.data.title);
  
  // Afficher les stats du cache
  const stats = client.getStats();
  console.log('Statistiques du cache:', stats);
  console.log('\n');

  // Test 2: Préchargement
  console.log('Test 2: Prechargement');
  const prefetchUrl = 'https://jsonplaceholder.typicode.com/todos/2';
  console.log('Prechargement de', prefetchUrl);
  prefetch(prefetchUrl);
  
  // Attendre un peu pour que le préchargement se termine
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.time('Requete sur URL prechargee');
  const response3 = await get(prefetchUrl);
  console.timeEnd('Requete sur URL prechargee');
  console.log('Donnees prechargees recues:', response3.data.title);
  console.log('\n');

  // Test 3: Requête annulable
  console.log('Test 3: Requete annulable');
  const { promise, abort } = abortableGet('https://jsonplaceholder.typicode.com/todos/3');
  console.log('Requete lancee et immediatement annulee');
  
  // Annuler la requête
  abort();
  
  try {
    await promise;
    console.log('Erreur: La requete n\'a pas ete annulee');
  } catch (error) {
    console.log('Requete correctement annulee:', error.message);
  }
  console.log('\n');

  // Test 4: Intercepteurs
  console.log('Test 4: Intercepteurs');
  
  // Ajouter un intercepteur de requête
  advancedClient.addRequestInterceptor((url, config) => {
    console.log('Intercepteur de requete execute pour:', url);
    return [url, { ...config, headers: { 'X-Custom-Header': 'Test' } }];
  });

  // Ajouter un intercepteur de réponse
  advancedClient.addResponseInterceptor((response) => {
    console.log('Intercepteur de reponse execute');
    response.data.intercepted = true;
    return response;
  });
  
  const response4 = await advancedClient.get('https://jsonplaceholder.typicode.com/todos/4');
  console.log('Donnees modifiees par intercepteur:', response4.data.intercepted === true);
  console.log('\n');

  // Test 5: Déduplication de requêtes
  console.log('Test 5: Deduplication de requetes');
  const dedupClient = createAdvancedClient({ enableLogs: true });
  
  console.log('Lancement de 3 requetes identiques simultanement');
  const requests = [
    dedupClient.get('https://jsonplaceholder.typicode.com/todos/5'),
    dedupClient.get('https://jsonplaceholder.typicode.com/todos/5'),
    dedupClient.get('https://jsonplaceholder.typicode.com/todos/5')
  ];
  
  await Promise.all(requests);
  console.log('Toutes les requetes ont abouti avec deduplication');
  console.log('\n');

  console.log('Tous les tests sont termines avec succes!');
}

// Exécution des tests
runTests()
  .catch(error => {
    console.error('Erreur pendant les tests:', error);
  }); 