/**
 * Example d'intégration de SmartCache avec un serveur Node.js
 * 
 * Cet Example montre comment utiliser SmartCache dans un serveur Node.js
 * pour mettre en cache les appels à des API externes et améliorer les performances.
 */

// Dans un vrai projet, ce serait:
// const SmartCache = require('smartcache');
// const express = require('express');

// Simuler un serveur Express
class ExpressApp {
  constructor() {
    this.routes = {};
  }

  get(path, handler) {
    this.routes[path] = handler;
    console.log(`Route GET enregistrée: ${path}`);
  }

  async simulateRequest(path, req) {
    if (this.routes[path]) {
      const res = {
        status: (code) => {
          res.statusCode = code;
          return res;
        },
        json: (data) => {
          res.body = data;
          console.log(`[${res.statusCode || 200}] ${JSON.stringify(data)}`);
          return res;
        },
        send: (data) => {
          res.body = data;
          console.log(`[${res.statusCode || 200}] ${data}`);
          return res;
        }
      };
      await this.routes[path](req, res);
      return res.body;
    } else {
      console.log(`[404] Route non trouvée: ${path}`);
      return null;
    }
  }
}

// Fonction principale
async function main() {
  // Créer un client SmartCache pour les appels API externes
  const apiClient = SmartCache.createClient({
    strategy: 'stale-while-revalidate',
    maxAge: 60 * 1000, // 1 minute
    maxSize: 100
  });

  // Créer une application Express
  const app = new ExpressApp();

  // Middleware pour exposer les statistics du cache
  app.get('/cache-stats', async (req, res) => {
    const stats = apiClient.getStats();
    res.status(200).json({
      hits: stats.hits,
      misses: stats.misses,
      ratio: stats.ratio,
      size: stats.size
    });
  });

  // Route pour retrieve des users
  app.get('/api/users', async (req, res) => {
    try {
      // Utiliser SmartCache pour appeler l'API externe
      const response = await apiClient.get('https://jsonplaceholder.typicode.com/users');
      
      // Enrichir les data avant de les renvoyer
      const enrichedUsers = response.data.map(user => ({
        ...user,
        profileUrl: `/api/users/${user.id}`
      }));
      
      res.status(200).json(enrichedUsers);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  });

  // Route pour retrieve un user spécifique
  app.get('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    
    try {
      // retrieve les détails de l'user
      const userResponse = await apiClient.get(`https://jsonplaceholder.typicode.com/users/${userId}`);
      
      // retrieve les posts de l'user
      const postsResponse = await apiClient.get(`https://jsonplaceholder.typicode.com/users/${userId}/posts`);
      
      // Combiner les data
      const userData = {
        ...userResponse.data,
        posts: postsResponse.data
      };
      
      res.status(200).json(userData);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'user ${userId}:`, error);
      res.status(500).json({ error: `Erreur lors de la récupération de l'user ${userId}` });
    }
  });

  // Route pour vider le cache
  app.get('/api/clear-cache', async (req, res) => {
    apiClient.clearCache();
    res.status(200).json({ message: 'Cache vidé avec succès' });
  });

  // Simuler des requests au serveur
  console.log('\n📡 Démarrage du serveur Node.js avec SmartCache');
  console.log('------------------------------------------------');

  // Première request - retrieve tous les users
  console.log('\n1. Première request - GET /api/users:');
  await app.simulateRequest('/api/users', { params: {} });

  // Deuxième request - retrieve un user spécifique
  console.log('\n2. Deuxième request - GET /api/users/1:');
  await app.simulateRequest('/api/users/:id', { params: { id: '1' } });

  // Troisième request - retrieve la liste des users à nouveau (devrait être en cache)
  console.log('\n3. Troisième request - GET /api/users (devrait être en cache):');
  await app.simulateRequest('/api/users', { params: {} });

  // display les statistics du cache
  console.log('\n4. Statistiques du cache - GET /cache-stats:');
  await app.simulateRequest('/cache-stats', { params: {} });

  // Vider le cache
  console.log('\n5. Vider le cache - GET /api/clear-cache:');
  await app.simulateRequest('/api/clear-cache', { params: {} });

  // retrieve les users à nouveau (doit retrieve du réseau)
  console.log('\n6. Après avoir vidé le cache - GET /api/users:');
  await app.simulateRequest('/api/users', { params: {} });

  // statistics finales
  console.log('\n7. Statistiques finales du cache:');
  await app.simulateRequest('/cache-stats', { params: {} });
}

// Pour exécuter l'Example, simulons l'existence de SmartCache
const SmartCache = {
  createClient: (options) => {
    console.log(`SmartCache créé avec la strategy: ${options.strategy}`);
    
    // Simuler un client avec un cache
    let cache = {};
    let stats = { hits: 0, misses: 0, ratio: 0, size: 0 };
    
    return {
      get: async (url) => {
        console.log(`Requête GET vers: ${url}`);
        
        // Vérifier si l'URL est en cache
        if (cache[url]) {
          console.log(`🎯 Cache hit pour: ${url}`);
          stats.hits++;
          return cache[url];
        }
        
        // Sinon, faire une "vraie" request
        console.log(`⚡ Cache miss pour: ${url}`);
        stats.misses++;
        
        // Simuler une request réseau
        console.log(`Connexion au réseau pour: ${url}`);
        
        // Créer une response fictive en fonction de l'URL
        let response;
        if (url === 'https://jsonplaceholder.typicode.com/users') {
          response = {
            data: [
              { id: 1, name: 'Leanne Graham', email: 'leanne@example.com' },
              { id: 2, name: 'Ervin Howell', email: 'ervin@example.com' }
            ]
          };
        } else if (url.includes('/users/1')) {
          response = {
            data: { id: 1, name: 'Leanne Graham', email: 'leanne@example.com' }
          };
        } else if (url.includes('/posts')) {
          response = {
            data: [
              { id: 1, title: 'Post 1', body: 'Contenu du post 1' },
              { id: 2, title: 'Post 2', body: 'Contenu du post 2' }
            ]
          };
        } else {
          response = { data: { message: 'Données fictives' } };
        }
        
        // Mettre en cache
        cache[url] = response;
        stats.size = Object.keys(cache).length;
        
        return response;
      },
      getStats: () => {
        const total = stats.hits + stats.misses;
        stats.ratio = total > 0 ? stats.hits / total : 0;
        return { ...stats };
      },
      clearCache: () => {
        cache = {};
        stats.size = 0;
      }
    };
  }
};

// Exécuter le programme
main().catch(console.error); 