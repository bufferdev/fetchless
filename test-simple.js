// Test simple des fonctionnalités de base et avancées
const { Fetchless } = require('./dist/Fetchless');
const { AdvancedFetchless, createAdvancedClient } = require('./dist/advanced');

// === Test des fonctionnalités de base ===
console.log('=== Test des fonctionnalités de base ===');

// Créer une instance
const client = Fetchless.createClient();
console.log('Instance Fetchless créée:', client !== null);

// Tester une requête
async function testBasicFeatures() {
  try {
    console.log('Tentative de requête GET...');
    const response = await client.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log('Requête réussie!');
    console.log('Titre:', response.data.title);
    console.log('Cache Stats:', client.getStats());
    
    console.log('\nSeconde requête (depuis le cache)...');
    const response2 = await client.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log('Seconde requête réussie!');
    console.log('Cache Stats:', client.getStats());
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la requête de base:', error.message);
    return false;
  }
}

// === Test des fonctionnalités avancées ===
async function testAdvancedFeatures() {
  console.log('\n=== Test des fonctionnalités avancées ===');
  
  try {
    // Créer une instance avancée
    const advancedClient = createAdvancedClient({ enableLogs: true });
    console.log('Instance AdvancedFetchless créée:', advancedClient !== null);
    
    // Test des intercepteurs
    console.log('\nTest des intercepteurs:');
    advancedClient.addRequestInterceptor((url, config) => {
      console.log('  Intercepteur de requête exécuté pour:', url);
      return [url, { ...config, headers: { 'X-Custom-Header': 'Test' } }];
    });
    
    advancedClient.addResponseInterceptor((response) => {
      console.log('  Intercepteur de réponse exécuté');
      response.data.intercepted = true;
      return response;
    });
    
    const response = await advancedClient.get('https://jsonplaceholder.typicode.com/todos/2');
    console.log('  Requête avec intercepteurs réussie!');
    console.log('  Donnée modifiée par intercepteur:', response.data.intercepted === true);
    
    // Test de la requête annulable
    console.log('\nTest des requêtes annulables:');
    const { promise, abort } = advancedClient.abortableGet('https://jsonplaceholder.typicode.com/todos/3');
    console.log('  Requête lancée et immédiatement annulée');
    abort();
    
    try {
      await promise;
      console.log('  ÉCHEC: La requête n\'a pas été annulée');
    } catch (error) {
      console.log('  SUCCÈS: Requête correctement annulée:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du test avancé:', error.message);
    return false;
  }
}

// Exécuter les tests
async function runAllTests() {
  const basicSuccess = await testBasicFeatures();
  const advancedSuccess = await testAdvancedFeatures();
  
  console.log('\n=== Résultats des tests ===');
  console.log('Fonctionnalités de base:', basicSuccess ? 'SUCCÈS' : 'ÉCHEC');
  console.log('Fonctionnalités avancées:', advancedSuccess ? 'SUCCÈS' : 'ÉCHEC');
  
  return basicSuccess && advancedSuccess;
}

runAllTests()
  .then(success => {
    console.log('\nTous les tests:', success ? 'SUCCÈS' : 'ÉCHEC');
  })
  .catch(error => {
    console.error('Erreur inattendue:', error);
  }); 