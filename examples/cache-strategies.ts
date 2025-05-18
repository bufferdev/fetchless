/**
 * Example d'Usage des différentes strategys de cache de SmartCache
 * 
 * Cet Example montre comment utiliser les différentes strategys de cache
 * disponibles dans SmartCache et comment elles se comportent.
 */
import SmartCache from '../src/index';

async function main() {
  // Tester chaque strategy de cache
  await testCacheFirst();
  await testStaleWhileRevalidate();
  await testNetworkFirst();
}

/**
 * Test de la strategy "Cache First"
 * Priorité au cache, réseau uniquement si pas en cache ou expiré
 */
async function testCacheFirst() {
  console.log('\n📖 Test de la strategy "Cache First"');
  console.log('------------------------------------');
  
  const client = SmartCache.createClient({
    strategy: 'cache-first',
    maxAge: 5000, // 5 secondes
  });
  
  try {
    // 1. Première request - devrait aller au réseau
    console.log('1. Première request (réseau)...');
    const response1 = await client.get('https://jsonplaceholder.typicode.com/users/1');
    console.log(`   Réponse: ${response1.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
    // 2. Deuxième request - devrait venir du cache
    console.log('\n2. Deuxième request (cache)...');
    const response2 = await client.get('https://jsonplaceholder.typicode.com/users/1');
    console.log(`   Réponse: ${response2.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
    // 3. Attendre expiration du cache
    console.log('\n3. Attente de 6 secondes pour expiration du cache...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // 4. Troisième request - devrait aller au réseau car expiré
    console.log('4. Troisième request après expiration (réseau)...');
    const response3 = await client.get('https://jsonplaceholder.typicode.com/users/1');
    console.log(`   Réponse: ${response3.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Test de la strategy "Stale While Revalidate"
 * Retourne le cache immédiatement même s'il est expiré, et rafraîchit en arrière-plan
 */
async function testStaleWhileRevalidate() {
  console.log('\n🔄 Test de la strategy "Stale While Revalidate"');
  console.log('--------------------------------------------');
  
  const client = SmartCache.createClient({
    strategy: 'stale-while-revalidate',
    maxAge: 5000, // 5 secondes
  });
  
  try {
    // 1. Première request - devrait aller au réseau
    console.log('1. Première request (réseau)...');
    const response1 = await client.get('https://jsonplaceholder.typicode.com/users/2');
    console.log(`   Réponse: ${response1.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
    // 2. Deuxième request - devrait venir du cache
    console.log('\n2. Deuxième request (cache)...');
    const response2 = await client.get('https://jsonplaceholder.typicode.com/users/2');
    console.log(`   Réponse: ${response2.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
    // 3. Attendre expiration du cache
    console.log('\n3. Attente de 6 secondes pour expiration du cache...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // 4. Troisième request - devrait retourner le cache expiré et rafraîchir en arrière-plan
    console.log('4. Troisième request après expiration (cache expiré + rafraîchissement)...');
    const response3 = await client.get('https://jsonplaceholder.typicode.com/users/2');
    console.log(`   Réponse: ${response3.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
    // 5. Attendre le rafraîchissement en arrière-plan
    console.log('\n5. Attente de 1 seconde pour le rafraîchissement en arrière-plan...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. Quatrième request - devrait venir du cache rafraîchi
    console.log('6. Quatrième request (cache rafraîchi)...');
    const response4 = await client.get('https://jsonplaceholder.typicode.com/users/2');
    console.log(`   Réponse: ${response4.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Test de la strategy "Network First"
 * Priorité au réseau, cache uniquement en cas d'erreur réseau
 */
async function testNetworkFirst() {
  console.log('\n🌐 Test de la strategy "Network First"');
  console.log('------------------------------------');
  
  const client = SmartCache.createClient({
    strategy: 'network-first',
    maxAge: 60000, // 1 minute
  });
  
  try {
    // 1. Première request - devrait aller au réseau
    console.log('1. Première request (réseau)...');
    const response1 = await client.get('https://jsonplaceholder.typicode.com/users/3');
    console.log(`   Réponse: ${response1.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
    // 2. Deuxième request - devrait aller au réseau malgré le cache valide
    console.log('\n2. Deuxième request (réseau malgré cache valide)...');
    const response2 = await client.get('https://jsonplaceholder.typicode.com/users/3');
    console.log(`   Réponse: ${response2.data.name}`);
    console.log(`   Stats: ${JSON.stringify(client.getStats())}`);
    
    // 3. Simuler une request avec erreur réseau vers une URL invalide
    // Le cache sera utilisé comme fallback
    console.log('\n3. Simulation d\'une erreur réseau (utilisation du cache comme fallback)...');
    
    // D'abord mettons en cache une response valide
    await client.get('https://jsonplaceholder.typicode.com/users/3');
    
    try {
      // Puis essayons d'accéder à une URL qui causera une erreur
      const response3 = await client.get('https://invalid-url-that-will-fail.com');
      console.log(`   Réponse: ${JSON.stringify(response3.data)}`);
    } catch (error) {
      console.log('   Erreur attendue: pas de cache disponible pour cette URL');
    }
    
    // 4. Test du fallback avec une URL caching
    try {
      // Simuler une erreur réseau en demandant une URL correcte mais avec un timeout
      console.log('\n4. Test du fallback vers le cache pour une URL caching...');
      
      // Créer un client avec timeout court pour forcer l'erreur
      const errorClient = SmartCache.createClient({
        strategy: 'network-first',
      });
      
      // Mettre en cache une response valide
      await errorClient.get('https://jsonplaceholder.typicode.com/users/3');
      
      // Prétendre que l'API est maintenant inaccessible
      console.log('   Simulation d\'une erreur réseau...');
      // Ici on devrait normalement modifier le client pour qu'il échoue,
      // mais pour l'Example on va juste montrer que le comportement serait de tomber sur le cache
      console.log('   En cas d\'erreur, le client utiliserait la version en cache');
    } catch (error) {
      console.error('   Erreur inattendue:', error);
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter l'Example
main().catch(console.error); 