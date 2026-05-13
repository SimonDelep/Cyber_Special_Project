#!/usr/bin/env node

/**
 * Script de test de l'API eBoutique
 * Exécution: node test-api.js
 * 
 * Ce script teste les différents endpoints de l'API
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let testsPassed = 0;
let testsFailed = 0;

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testRegister() {
  log('blue', '\n🧪 Test: Inscription');
  
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'test123',
    nom: 'Test',
    prenom: 'User'
  };

  try {
    const response = await makeRequest('POST', '/auth/register', testUser);
    if (response.status === 200 && response.data.userId) {
      log('green', '✅ Inscription réussie');
      testsPassed++;
      return testUser;
    } else {
      log('red', `❌ Inscription échouée: ${JSON.stringify(response.data)}`);
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function testLogin(user) {
  log('blue', '\n🧪 Test: Connexion');
  
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: user.email,
      password: user.password
    });

    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      log('green', '✅ Connexion réussie');
      log('yellow', `   Token: ${authToken.substring(0, 20)}...`);
      testsPassed++;
    } else {
      log('red', `❌ Connexion échouée: ${response.data.error}`);
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function testGetProducts() {
  log('blue', '\n🧪 Test: Récupérer les produits');
  
  try {
    const response = await makeRequest('GET', '/produits');
    
    if (response.status === 200 && Array.isArray(response.data)) {
      log('green', `✅ ${response.data.length} produits récupérés`);
      testsPassed++;
      return response.data;
    } else {
      log('red', '❌ Impossible de récupérer les produits');
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function testGetProductDetail(productId) {
  log('blue', `\n🧪 Test: Détails du produit ${productId.substring(0, 8)}`);
  
  try {
    const response = await makeRequest('GET', `/produits/${productId}`);
    
    if (response.status === 200 && response.data.nom) {
      log('green', `✅ Produit trouvé: ${response.data.nom}`);
      log('yellow', `   Prix: ${response.data.prix}€`);
      log('yellow', `   Stock: ${response.data.stock}`);
      testsPassed++;
    } else {
      log('red', '❌ Produit non trouvé');
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function testAddToCart(productId) {
  log('blue', '\n🧪 Test: Ajouter au panier');
  
  if (!authToken) {
    log('yellow', '⚠️  Impossible sans authentification');
    return;
  }

  try {
    const response = await makeRequest('POST', '/panier', {
      produit_id: productId,
      quantite: 1
    });

    if (response.status === 200) {
      log('green', '✅ Produit ajouté au panier');
      testsPassed++;
    } else {
      log('red', `❌ Erreur: ${response.data.error}`);
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function testGetCart() {
  log('blue', '\n🧪 Test: Récupérer le panier');
  
  if (!authToken) {
    log('yellow', '⚠️  Impossible sans authentification');
    return;
  }

  try {
    const response = await makeRequest('GET', '/panier');
    
    if (response.status === 200 && Array.isArray(response.data)) {
      log('green', `✅ Panier contient ${response.data.length} article(s)`);
      testsPassed++;
    } else {
      log('red', '❌ Impossible de récupérer le panier');
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function testCreateOrder() {
  log('blue', '\n🧪 Test: Créer une commande');
  
  if (!authToken) {
    log('yellow', '⚠️  Impossible sans authentification');
    return;
  }

  try {
    const response = await makeRequest('POST', '/commandes', {
      adresse_livraison: '123 Rue de Test, 75000 Paris'
    });

    if (response.status === 200) {
      log('green', `✅ Commande créée: ${response.data.commandeId.substring(0, 8)}`);
      log('yellow', `   Total: ${response.data.total}€`);
      testsPassed++;
    } else {
      log('red', `❌ Erreur: ${response.data.error}`);
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function testGetOrders() {
  log('blue', '\n🧪 Test: Récupérer les commandes');
  
  if (!authToken) {
    log('yellow', '⚠️  Impossible sans authentification');
    return;
  }

  try {
    const response = await makeRequest('GET', '/commandes');
    
    if (response.status === 200 && Array.isArray(response.data)) {
      log('green', `✅ ${response.data.length} commande(s) trouvée(s)`);
      testsPassed++;
    } else {
      log('red', '❌ Impossible de récupérer les commandes');
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function testAddReview(productId) {
  log('blue', '\n🧪 Test: Ajouter un avis');
  
  if (!authToken) {
    log('yellow', '⚠️  Impossible sans authentification');
    return;
  }

  try {
    const response = await makeRequest('POST', '/avis', {
      produit_id: productId,
      note: 5,
      commentaire: 'Excellent produit!'
    });

    if (response.status === 200) {
      log('green', '✅ Avis ajouté');
      testsPassed++;
    } else {
      log('red', `❌ Erreur: ${response.data.error}`);
      testsFailed++;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  log('blue', '================================');
  log('blue', '  🛍️  Test eBoutique API');
  log('blue', '================================');

  // Test d'inscription et connexion
  const testUser = await testRegister();
  if (!testUser) {
    log('red', '❌ Impossible de continuer sans inscription');
    return;
  }

  await testLogin(testUser);

  // Tests produits
  const products = await testGetProducts();
  if (products && products.length > 0) {
    await testGetProductDetail(products[0].id);
  }

  // Tests panier
  if (products && products.length > 0) {
    await testAddToCart(products[0].id);
    await testGetCart();
  }

  // Test avis
  if (products && products.length > 0) {
    await testAddReview(products[0].id);
  }

  // Tests commandes
  await testCreateOrder();
  await testGetOrders();

  // Résumé
  log('blue', '\n================================');
  log('green', `✅ Tests réussis: ${testsPassed}`);
  log('red', `❌ Tests échoués: ${testsFailed}`);
  log('blue', '================================\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Vérifier que le serveur est accessible
setTimeout(() => {
  makeRequest('GET', '/produits')
    .then(() => {
      log('green', '✅ Serveur accessible');
      runTests();
    })
    .catch(() => {
      log('red', '❌ Serveur non accessible sur localhost:3000');
      log('red', 'Assurez-vous que le serveur est démarré: npm start');
      process.exit(1);
    });
}, 100);
