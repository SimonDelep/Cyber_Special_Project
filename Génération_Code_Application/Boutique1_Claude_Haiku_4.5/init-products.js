#!/usr/bin/env node

/**
 * Script d'initialisation de la boutique avec produits d'exemple
 * Exécution: node init-products.js
 */

const sqlite3 = require('sqlite3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const db = new sqlite3.Database('boutique.db', (err) => {
  if (err) {
    console.error('❌ Erreur de connexion:', err);
    process.exit(1);
  }
  console.log('✅ Connecté à la base de données');
  initializeProducts();
});

const products = [
  {
    nom: 'Laptop Pro',
    description: 'Ordinateur portable haute performance avec processeur dernière génération',
    prix: 1299.99,
    categorie: 'Électronique',
    stock: 15,
    image_url: 'https://via.placeholder.com/250x200?text=Laptop+Pro'
  },
  {
    nom: 'Smartphone X1',
    description: 'Smartphone flagship avec écran AMOLED et caméra 108MP',
    prix: 899.99,
    categorie: 'Électronique',
    stock: 30,
    image_url: 'https://via.placeholder.com/250x200?text=Smartphone+X1'
  },
  {
    nom: 'Airbuds Pro',
    description: 'Écouteurs sans fil avec suppression du bruit',
    prix: 249.99,
    categorie: 'Électronique',
    stock: 50,
    image_url: 'https://via.placeholder.com/250x200?text=Airbuds+Pro'
  },
  {
    nom: 'T-shirt Premium',
    description: 'T-shirt en coton 100% premium avec impression',
    prix: 29.99,
    categorie: 'Vêtements',
    stock: 100,
    image_url: 'https://via.placeholder.com/250x200?text=T-shirt+Premium'
  },
  {
    nom: 'Jeans Classique',
    description: 'Jeans denim confortable et durable',
    prix: 79.99,
    categorie: 'Vêtements',
    stock: 75,
    image_url: 'https://via.placeholder.com/250x200?text=Jeans+Classique'
  },
  {
    nom: 'Sneakers Sport',
    description: 'Chaussures de sport légères et confortables',
    prix: 119.99,
    categorie: 'Vêtements',
    stock: 40,
    image_url: 'https://via.placeholder.com/250x200?text=Sneakers+Sport'
  },
  {
    nom: 'JavaScript Guide',
    description: 'Le guide complet pour maîtriser JavaScript',
    prix: 34.99,
    categorie: 'Livres',
    stock: 200,
    image_url: 'https://via.placeholder.com/250x200?text=JavaScript+Guide'
  },
  {
    nom: 'Node.js Handbook',
    description: 'Manuel complet de Node.js et Express',
    prix: 44.99,
    categorie: 'Livres',
    stock: 150,
    image_url: 'https://via.placeholder.com/250x200?text=NodeJS+Handbook'
  },
  {
    nom: 'Lampe LED Smart',
    description: 'Lampe LED connectée contrôlable par smartphone',
    prix: 89.99,
    categorie: 'Maison',
    stock: 60,
    image_url: 'https://via.placeholder.com/250x200?text=Lampe+LED+Smart'
  },
  {
    nom: 'Coussin Ergonomique',
    description: 'Coussin ergonomique pour bureau ou canapé',
    prix: 59.99,
    categorie: 'Maison',
    stock: 80,
    image_url: 'https://via.placeholder.com/250x200?text=Coussin+Ergonomique'
  },
  {
    nom: 'Plante Verte Artificielle',
    description: 'Plante décorative artificielle haute qualité',
    prix: 49.99,
    categorie: 'Maison',
    stock: 120,
    image_url: 'https://via.placeholder.com/250x200?text=Plante+Artificielle'
  },
  {
    nom: 'Montre Connectée',
    description: 'Montre intelligente avec capteur cœur et GPS',
    prix: 299.99,
    categorie: 'Électronique',
    stock: 25,
    image_url: 'https://via.placeholder.com/250x200?text=Montre+Connectée'
  }
];

function initializeProducts() {
  let addedCount = 0;

  products.forEach((product) => {
    const produitId = uuidv4();
    
    db.run(
      `INSERT INTO produits (id, nom, description, prix, categorie, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [produitId, product.nom, product.description, product.prix, product.categorie, product.stock, product.image_url],
      function(err) {
        if (err) {
          console.error(`❌ Erreur ajout ${product.nom}:`, err);
        } else {
          console.log(`✅ ${product.nom} ajouté`);
          addedCount++;
        }

        if (addedCount === products.length) {
          console.log(`\n🎉 ${products.length} produits ajoutés avec succès!\n`);
          db.close();
          process.exit(0);
        }
      }
    );
  });
}
