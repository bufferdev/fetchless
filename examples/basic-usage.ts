/**
 * Exemple d'utilisation basique de SmartCache
 * 
 * Cet exemple montre comment créer un client avec SmartCache
 * et effectuer des requêtes HTTP qui seront automatiquement mises en cache.
 */
import SmartCache from '../src/index';

async function main() {
  // Créer un client avec les options par défaut
  const defaultClient = SmartCache.createClient();
  
  console.log('Exemple 1: Client avec configuration par défaut (stale-while-revalidate)');
  console.log('----------------------------------------------------------------');
  
  try {
    // Première requête - sera mise en cache
    console.log('Première requête...');
    const response1 = await defaultClient.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log(`Réponse reçue: ${JSON.stringify(response1.data)}`);
    
    // Deuxième requête - devrait provenir du cache
    console.log('\nDeuxième requête (devrait provenir du cache)...');
    const response2 = await defaultClient.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log(`Réponse reçue: ${JSON.stringify(response2.data)}`);
    
    // Afficher les statistiques
    console.log('\nStatistiques du cache:');
    console.log(defaultClient.getStats());
  } catch (error) {
    console.error('Erreur:', error);
  }
  
  // Exemple avec un client configuré
  console.log('\n\nExemple 2: Client avec configuration personnalisée');
  console.log('----------------------------------------------------------------');
  
  const customClient = SmartCache.createClient({
    strategy: 'cache-first',
    maxAge: 10 * 1000, // 10 secondes
    maxSize: 50
  });
  
  try {
    // Première requête avec client personnalisé
    console.log('Première requête...');
    const response = await customClient.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log(`Réponse reçue: ${JSON.stringify(response.data)}`);
    
    // Afficher les statistiques initiales
    console.log('\nStatistiques initiales:');
    console.log(customClient.getStats());
    
    // Attendre 2 secondes et refaire la même requête
    console.log('\nAttente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Deuxième requête (devrait provenir du cache)...');
    await customClient.get('https://jsonplaceholder.typicode.com/posts/1');
    
    // Afficher les statistiques mises à jour
    console.log('\nStatistiques après la deuxième requête:');
    console.log(customClient.getStats());
    
    // Attendre que le cache expire puis refaire la requête
    console.log('\nAttente de 10 secondes pour que le cache expire...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('Troisième requête (après expiration du cache)...');
    await customClient.get('https://jsonplaceholder.typicode.com/posts/1');
    
    // Afficher les statistiques finales
    console.log('\nStatistiques finales:');
    console.log(customClient.getStats());
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter l'exemple
main().catch(console.error); 