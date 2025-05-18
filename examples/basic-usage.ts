/**
 * Example d'Usage basique de SmartCache
 * 
 * Cet Example montre comment créer un client avec SmartCache
 * et effectuer des requests HTTP qui seront automaticment mises en cache.
 */
import SmartCache from '../src/index';

async function main() {
  // Créer un client avec les options par défaut
  const defaultClient = SmartCache.createClient();
  
  console.log('Example 1: Client avec configuration par défaut (stale-while-revalidate)');
  console.log('----------------------------------------------------------------');
  
  try {
    // Première request - sera caching
    console.log('Première request...');
    const response1 = await defaultClient.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log(`Réponse reçue: ${JSON.stringify(response1.data)}`);
    
    // Deuxième request - devrait provenir du cache
    console.log('\nDeuxième request (devrait provenir du cache)...');
    const response2 = await defaultClient.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log(`Réponse reçue: ${JSON.stringify(response2.data)}`);
    
    // display les statistics
    console.log('\nStatistiques du cache:');
    console.log(defaultClient.getStats());
  } catch (error) {
    console.error('Erreur:', error);
  }
  
  // Example avec un client configuré
  console.log('\n\nExemple 2: Client avec configuration personnalisée');
  console.log('----------------------------------------------------------------');
  
  const customClient = SmartCache.createClient({
    strategy: 'cache-first',
    maxAge: 10 * 1000, // 10 secondes
    maxSize: 50
  });
  
  try {
    // Première request avec client personnalisé
    console.log('Première request...');
    const response = await customClient.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log(`Réponse reçue: ${JSON.stringify(response.data)}`);
    
    // display les statistics initiales
    console.log('\nStatistiques initiales:');
    console.log(customClient.getStats());
    
    // Attendre 2 secondes et refaire la même request
    console.log('\nAttente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Deuxième request (devrait provenir du cache)...');
    await customClient.get('https://jsonplaceholder.typicode.com/posts/1');
    
    // display les statistics mises à jour
    console.log('\nStatistiques après la deuxième request:');
    console.log(customClient.getStats());
    
    // Attendre que le cache expire puis refaire la request
    console.log('\nAttente de 10 secondes pour que le cache expire...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('Troisième request (après expiration du cache)...');
    await customClient.get('https://jsonplaceholder.typicode.com/posts/1');
    
    // display les statistics finales
    console.log('\nStatistiques finales:');
    console.log(customClient.getStats());
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter l'Example
main().catch(console.error); 