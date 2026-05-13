const express = require('express');
const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_secret_key_change_in_production';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database initialization
const db = new sqlite3.Database('boutique.db', (err) => {
  if (err) {
    console.error('Erreur de connexion à la DB:', err);
  } else {
    console.log('✅ Base de données connectée');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        role TEXT DEFAULT 'client',
        adresse TEXT,
        telephone TEXT,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        actif INTEGER DEFAULT 1
      )
    `);

    // Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS produits (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        description TEXT,
        prix REAL NOT NULL,
        categorie TEXT NOT NULL,
        stock INTEGER NOT NULL,
        image_url TEXT,
        image_path TEXT,
        note REAL DEFAULT 0,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        nom TEXT UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // Cart table
    db.run(`
      CREATE TABLE IF NOT EXISTS panier (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        produit_id TEXT NOT NULL,
        quantite INTEGER NOT NULL,
        date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(produit_id) REFERENCES produits(id)
      )
    `);

    // Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS commandes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        total REAL NOT NULL,
        statut TEXT DEFAULT 'en attente',
        date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
        adresse_livraison TEXT,
        numero_suivi TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Order items table
    db.run(`
      CREATE TABLE IF NOT EXISTS commande_items (
        id TEXT PRIMARY KEY,
        commande_id TEXT NOT NULL,
        produit_id TEXT NOT NULL,
        quantite INTEGER NOT NULL,
        prix_unitaire REAL NOT NULL,
        FOREIGN KEY(commande_id) REFERENCES commandes(id),
        FOREIGN KEY(produit_id) REFERENCES produits(id)
      )
    `);

    // Reviews table
    db.run(`
      CREATE TABLE IF NOT EXISTS avis (
        id TEXT PRIMARY KEY,
        produit_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        note INTEGER NOT NULL,
        commentaire TEXT,
        date_avis DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(produit_id) REFERENCES produits(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    console.log('✅ Tables créées avec succès');
    addSampleData();
  });
}

// Add sample data
function addSampleData() {
  db.serialize(() => {
    // Add admin user
    const adminId = uuidv4();
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`
      INSERT OR IGNORE INTO users (id, email, password, nom, prenom, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [adminId, 'admin@boutique.com', adminPassword, 'Admin', 'Boutique', 'admin', '0612345678']);

    // Add sample categories
    const categories = [
      { id: uuidv4(), nom: 'Électronique', description: 'Appareils électroniques et gadgets' },
      { id: uuidv4(), nom: 'Vêtements', description: 'Vêtements pour tous les styles' },
      { id: uuidv4(), nom: 'Livres', description: 'Livres et publications' },
      { id: uuidv4(), nom: 'Maison', description: 'Articles pour la maison' }
    ];

    categories.forEach(cat => {
      db.run(`
        INSERT OR IGNORE INTO categories (id, nom, description)
        VALUES (?, ?, ?)
      `, [cat.id, cat.nom, cat.description]);
    });

    console.log('✅ Données initiales ajoutées');
  });
}

// === AUTHENTICATION ROUTES ===

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, nom, prenom } = req.body;

  if (!email || !password || !nom || !prenom) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }

  const userId = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`
    INSERT INTO users (id, email, password, nom, prenom, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [userId, email, hashedPassword, nom, prenom, 'client'], (err) => {
    if (err) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    res.json({ message: 'Utilisateur créé avec succès', userId });
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role } });
  });
});

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    req.user = decoded;
    next();
  });
}

// === PRODUCTS ROUTES ===

// Get all products
app.get('/api/produits', (req, res) => {
  const { categorie, search } = req.query;
  let query = 'SELECT * FROM produits WHERE stock > 0';
  let params = [];

  if (categorie) {
    query += ' AND categorie = ?';
    params.push(categorie);
  }

  if (search) {
    query += ' AND (nom LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(rows);
  });
});

// Get product by ID
app.get('/api/produits/:id', (req, res) => {
  db.get(`SELECT * FROM produits WHERE id = ?`, [req.params.id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    // Get reviews
    db.all(`
      SELECT a.*, u.nom, u.prenom FROM avis a
      JOIN users u ON a.user_id = u.id
      WHERE a.produit_id = ?
      ORDER BY a.date_avis DESC
    `, [req.params.id], (err, reviews) => {
      res.json({ ...row, avis: reviews || [] });
    });
  });
});

// Add product (admin only)
app.post('/api/admin/produits', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { nom, description, prix, categorie, stock, image_url } = req.body;
  const produitId = uuidv4();

  db.run(`
    INSERT INTO produits (id, nom, description, prix, categorie, stock, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [produitId, nom, description, prix, categorie, stock, image_url], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur création produit' });
    }
    res.json({ message: 'Produit créé', produitId });
  });
});

// === CART ROUTES ===

// Get cart
app.get('/api/panier', verifyToken, (req, res) => {
  db.all(`
    SELECT p.*, pan.id as panier_id, pan.quantite
    FROM panier pan
    JOIN produits p ON pan.produit_id = p.id
    WHERE pan.user_id = ?
  `, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(rows || []);
  });
});

// Add to cart
app.post('/api/panier', verifyToken, (req, res) => {
  const { produit_id, quantite } = req.body;
  const panierItemId = uuidv4();

  db.run(`
    INSERT INTO panier (id, user_id, produit_id, quantite)
    VALUES (?, ?, ?, ?)
  `, [panierItemId, req.user.id, produit_id, quantite], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur ajout panier' });
    }
    res.json({ message: 'Produit ajouté au panier' });
  });
});

// Remove from cart
app.delete('/api/panier/:id', verifyToken, (req, res) => {
  db.run(`
    DELETE FROM panier WHERE id = ? AND user_id = ?
  `, [req.params.id, req.user.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur suppression' });
    }
    res.json({ message: 'Produit supprimé du panier' });
  });
});

// === ORDERS ROUTES ===

// Create order
app.post('/api/commandes', verifyToken, (req, res) => {
  const { adresse_livraison } = req.body;
  const commandeId = uuidv4();

  db.all(`SELECT * FROM panier WHERE user_id = ?`, [req.user.id], (err, items) => {
    if (err || items.length === 0) {
      return res.status(400).json({ error: 'Panier vide' });
    }

    let total = 0;

    db.serialize(() => {
      // Calculate total and create order
      db.all(`
        SELECT p.prix, pan.quantite FROM panier pan
        JOIN produits p ON pan.produit_id = p.id
        WHERE pan.user_id = ?
      `, [req.user.id], (err, rows) => {
        total = rows.reduce((sum, row) => sum + (row.prix * row.quantite), 0);

        db.run(`
          INSERT INTO commandes (id, user_id, total, adresse_livraison, numero_suivi)
          VALUES (?, ?, ?, ?, ?)
        `, [commandeId, req.user.id, total, adresse_livraison, 'TRACK-' + uuidv4().substr(0, 8).toUpperCase()], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Erreur création commande' });
          }

          // Add items to order
          items.forEach(item => {
            db.run(`
              SELECT prix FROM produits WHERE id = ?
            `, [item.produit_id], (err, prod) => {
              db.run(`
                INSERT INTO commande_items (id, commande_id, produit_id, quantite, prix_unitaire)
                VALUES (?, ?, ?, ?, ?)
              `, [uuidv4(), commandeId, item.produit_id, item.quantite, prod.prix]);
            });
          });

          // Clear cart
          db.run(`DELETE FROM panier WHERE user_id = ?`, [req.user.id]);

          res.json({ message: 'Commande créée', commandeId, total });
        });
      });
    });
  });
});

// Get user orders
app.get('/api/commandes', verifyToken, (req, res) => {
  db.all(`
    SELECT * FROM commandes WHERE user_id = ? ORDER BY date_commande DESC
  `, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(rows || []);
  });
});

// Get order details
app.get('/api/commandes/:id', verifyToken, (req, res) => {
  db.get(`
    SELECT * FROM commandes WHERE id = ? AND user_id = ?
  `, [req.params.id, req.user.id], (err, order) => {
    if (err || !order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    db.all(`
      SELECT ci.*, p.nom, p.image_url FROM commande_items ci
      JOIN produits p ON ci.produit_id = p.id
      WHERE ci.commande_id = ?
    `, [req.params.id], (err, items) => {
      res.json({ ...order, items });
    });
  });
});

// === REVIEWS ROUTES ===

// Add review
app.post('/api/avis', verifyToken, (req, res) => {
  const { produit_id, note, commentaire } = req.body;
  const avisId = uuidv4();

  db.run(`
    INSERT INTO avis (id, produit_id, user_id, note, commentaire)
    VALUES (?, ?, ?, ?, ?)
  `, [avisId, produit_id, req.user.id, note, commentaire], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur création avis' });
    }
    res.json({ message: 'Avis ajouté' });
  });
});

// === ADMIN ROUTES ===

// Get all orders (admin)
app.get('/api/admin/commandes', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  db.all(`
    SELECT c.*, u.nom, u.prenom, u.email FROM commandes c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.date_commande DESC
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(rows || []);
  });
});

// Update order status (admin)
app.put('/api/admin/commandes/:id/statut', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { statut } = req.body;
  db.run(`
    UPDATE commandes SET statut = ? WHERE id = ?
  `, [statut, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur mise à jour' });
    }
    res.json({ message: 'Statut mis à jour' });
  });
});

// Get dashboard stats (admin)
app.get('/api/admin/stats', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  db.serialize(() => {
    let stats = {};

    db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
      stats.totalUsers = row.count;
    });

    db.get(`SELECT COUNT(*) as count FROM commandes`, (err, row) => {
      stats.totalOrders = row.count;
    });

    db.get(`SELECT SUM(total) as sum FROM commandes`, (err, row) => {
      stats.totalRevenue = row.sum || 0;
    });

    db.get(`SELECT COUNT(*) as count FROM produits`, (err, row) => {
      stats.totalProducts = row.count;
      res.json(stats);
    });
  });
});

// Get all users (admin)
app.get('/api/admin/users', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  db.all(`SELECT id, email, nom, prenom, role, date_creation FROM users`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(rows || []);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📧 Admin: admin@boutique.com / admin123`);
});
