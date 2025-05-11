/**
 * Exemple d'intégration de SmartCache dans une application web
 * 
 * Cet exemple montre comment intégrer SmartCache dans une application web
 * pour optimiser les appels API.
 */

// Note: Ce code est conçu pour être exécuté dans un navigateur

// Import de SmartCache (via un bundler comme webpack)
// Dans une vraie application, ce serait:
// import SmartCache from 'smartcache';

// Service d'API pour une application web
class ApiService {
  constructor() {
    // Créer un client SmartCache avec une stratégie appropriée pour les applications web
    this.client = SmartCache.createClient({
      strategy: 'stale-while-revalidate',
      maxAge: 2 * 60 * 1000, // 2 minutes
      maxSize: 50
    });
    
    // Initialiser les compteurs pour l'UI
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.requests = 0;
  }
  
  // Récupérer la liste des utilisateurs
  async getUsers() {
    this.requests++;
    
    try {
      const response = await this.client.get('https://jsonplaceholder.typicode.com/users');
      
      // Mettre à jour les compteurs
      const stats = this.client.getStats();
      this.cacheHits = stats.hits;
      this.cacheMisses = stats.misses;
      
      // Mettre à jour l'UI avec les statistiques
      this.updateStatsUI();
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }
  
  // Récupérer les détails d'un utilisateur
  async getUserDetails(userId) {
    this.requests++;
    
    try {
      const response = await this.client.get(`https://jsonplaceholder.typicode.com/users/${userId}`);
      
      // Mettre à jour les compteurs
      const stats = this.client.getStats();
      this.cacheHits = stats.hits;
      this.cacheMisses = stats.misses;
      
      // Mettre à jour l'UI avec les statistiques
      this.updateStatsUI();
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
  
  // Récupérer les posts d'un utilisateur
  async getUserPosts(userId) {
    this.requests++;
    
    try {
      const response = await this.client.get(`https://jsonplaceholder.typicode.com/users/${userId}/posts`);
      
      // Mettre à jour les compteurs
      const stats = this.client.getStats();
      this.cacheHits = stats.hits;
      this.cacheMisses = stats.misses;
      
      // Mettre à jour l'UI avec les statistiques
      this.updateStatsUI();
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des posts de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
  
  // Vider le cache
  clearCache() {
    this.client.clearCache();
    this.updateStatsUI();
  }
  
  // Mettre à jour l'interface utilisateur avec les statistiques
  updateStatsUI() {
    // Dans une vraie application, on mettrait à jour des éléments DOM
    const stats = this.client.getStats();
    
    console.log('Statistiques du cache:');
    console.log(`- Requêtes totales: ${this.requests}`);
    console.log(`- Cache hits: ${stats.hits}`);
    console.log(`- Cache misses: ${stats.misses}`);
    console.log(`- Ratio de hit: ${(stats.ratio * 100).toFixed(1)}%`);
    console.log(`- Taille du cache: ${stats.size} entrées`);
    
    // Si on avait une interface utilisateur:
    // document.getElementById('total-requests').textContent = this.requests;
    // document.getElementById('cache-hits').textContent = stats.hits;
    // document.getElementById('cache-misses').textContent = stats.misses;
    // document.getElementById('hit-ratio').textContent = `${(stats.ratio * 100).toFixed(1)}%`;
    // document.getElementById('cache-size').textContent = stats.size;
  }
}

/**
 * Exemple d'utilisation dans une application web
 */
async function simulateWebApp() {
  // Créer le service d'API
  const api = new ApiService();
  
  console.log('Application web avec SmartCache');
  console.log('-------------------------------');
  
  // Simuler des interactions utilisateur
  
  // 1. Chargement initial de la page - récupérer tous les utilisateurs
  console.log('\n1. Chargement initial - récupération des utilisateurs:');
  const users = await api.getUsers();
  console.log(`   ${users.length} utilisateurs récupérés`);
  
  // 2. L'utilisateur clique sur un utilisateur - récupérer les détails
  console.log('\n2. Clic sur l\'utilisateur 1 - récupération des détails:');
  const user1 = await api.getUserDetails(1);
  console.log(`   Détails de ${user1.name} récupérés`);
  
  // 3. L'utilisateur clique sur "Voir les posts"
  console.log('\n3. Clic sur "Voir les posts" - récupération des posts:');
  const user1Posts = await api.getUserPosts(1);
  console.log(`   ${user1Posts.length} posts récupérés`);
  
  // 4. L'utilisateur revient à la liste et clique sur un autre utilisateur
  console.log('\n4. Retour à la liste et clic sur l\'utilisateur 2:');
  const user2 = await api.getUserDetails(2);
  console.log(`   Détails de ${user2.name} récupérés`);
  
  // 5. L'utilisateur revient à la liste principale - données servies depuis le cache
  console.log('\n5. Retour à la liste principale - devrait venir du cache:');
  await api.getUsers();
  console.log('   Liste des utilisateurs récupérée depuis le cache');
  
  // 6. L'utilisateur retourne voir le premier utilisateur - données servies depuis le cache
  console.log('\n6. Retour au profil de l\'utilisateur 1 - devrait venir du cache:');
  await api.getUserDetails(1);
  console.log('   Détails utilisateur récupérés depuis le cache');
  
  // 7. L'utilisateur clique sur "Actualiser" - force un rechargement des données
  console.log('\n7. Clic sur "Actualiser" - simulation en vidant le cache:');
  api.clearCache();
  console.log('   Cache vidé');
  
  // 8. Les données sont rechargées depuis le réseau
  console.log('\n8. Données rechargées depuis le réseau:');
  await api.getUsers();
  console.log('   Liste des utilisateurs rechargée');
  
  // Afficher les statistiques finales
  console.log('\nStatistiques finales:');
  const finalStats = api.client.getStats();
  console.log(`- Requêtes totales: ${api.requests}`);
  console.log(`- Cache hits: ${finalStats.hits}`);
  console.log(`- Cache misses: ${finalStats.misses}`);
  console.log(`- Ratio de hit: ${(finalStats.ratio * 100).toFixed(1)}%`);
}

// Dans un environnement navigateur, ce code serait exécuté après que le DOM soit chargé
// document.addEventListener('DOMContentLoaded', () => {
//   simulateWebApp().catch(console.error);
// });

// Pour l'exemple, considérez que cette fonction est appelée manuellement
// simulateWebApp().catch(console.error); 