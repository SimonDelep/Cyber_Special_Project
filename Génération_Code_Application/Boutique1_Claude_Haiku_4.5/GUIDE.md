# 📘 Guide Complet d'Utilisation - eBoutique

## 🎯 Table des matières
1. [Installation](#installation)
2. [Démarrage](#démarrage)
3. [Utilisation Client](#utilisation-client)
4. [Utilisation Admin](#utilisation-admin)
5. [API Reference](#api-reference)
6. [Dépannage](#dépannage)

---

## 📦 Installation

### Étape 1: Vérifier les prérequis
```bash
node --version  # v14 ou plus
npm --version   # v6 ou plus
```

### Étape 2: Installer les dépendances
```bash
npm install
```

Cela installe:
- **express**: Framework web
- **sqlite3**: Base de données
- **jsonwebtoken**: Authentification JWT
- **bcryptjs**: Hashage des mots de passe
- **axios**: Client HTTP
- **uuid**: Génération d'identifiants

### Étape 3: Initialiser les produits (optionnel)
```bash
node init-products.js
```

Cela ajoute 12 produits d'exemple à la boutique.

---

## 🚀 Démarrage

### Démarrer le serveur
```bash
npm start
```

**Output attendu:**
```
✅ Base de données connectée
✅ Tables créées avec succès
✅ Données initiales ajoutées
🚀 Serveur démarré sur http://localhost:3000
📧 Admin: admin@boutique.com / admin123
```

### Accéder à la boutique
- Ouvrir http://localhost:3000 dans le navigateur

---

## 👤 Utilisation Client

### Créer un compte
1. Cliquer sur **"Connexion"** en haut à droite
2. Cliquer sur **"S'inscrire"**
3. Remplir le formulaire:
   - Prénom
   - Nom
   - Email
   - Mot de passe
4. Cliquer sur **"S'inscrire"**

### Se connecter
1. Cliquer sur **"Connexion"**
2. Entrer email et mot de passe
3. Cliquer sur **"Connexion"**

### Parcourir les produits
- Les produits s'affichent automatiquement
- **Rechercher**: Utiliser la barre de recherche
- **Voir détails**: Cliquer sur **"Détails"** sur un produit
- **Ajouter**: Cliquer sur **"Ajouter"** pour ajouter 1 unité

### Consulter un produit
- Cliquer sur **"Détails"**
- Voir la description complète
- Consulter les avis clients
- Laisser un avis (si connecté)
- Ajuster la quantité
- Cliquer **"Ajouter au panier"**

### Gérer le panier
1. Cliquer sur **"Panier"** en haut
2. Voir tous les articles
3. Voir le total
4. Retirer un article: Cliquer **"✕ Supprimer"**
5. Finaliser:
   - Entrer adresse de livraison
   - Cliquer **"Procéder au paiement"**

### Passer une commande
1. Après ajout au panier, cliquer **"Panier"**
2. Vérifier les articles
3. Entrer l'adresse de livraison
4. Cliquer **"Procéder au paiement"**
5. Commande créée! Vous recevez un numéro de suivi

### Voir les commandes
1. Cliquer sur **"Mes Commandes"**
2. Voir toutes vos commandes
3. Cliquer **"Voir détails"** pour les articles

### Laisser un avis
1. Consulter un produit
2. Scroll jusqu'à **"Laisser un avis"**
3. Sélectionner la note (1-5 ⭐)
4. Ajouter un commentaire (optionnel)
5. Cliquer **"Envoyer l'avis"**

---

## 👨‍💼 Utilisation Admin

### Accès Admin
1. **Se connecter** avec:
   - Email: `admin@boutique.com`
   - Mot de passe: `admin123`
2. Un menu **"Admin"** apparaît
3. Cliquer sur **"Admin"**

### Dashboard
Voir:
- 👥 Nombre d'utilisateurs
- 📦 Nombre de produits
- 🛒 Nombre de commandes
- 💰 Revenu total

### Ajouter un produit
1. Cliquer **"➕ Ajouter un produit"**
2. Remplir le formulaire:
   - Nom du produit
   - Description
   - Prix (€)
   - Catégorie
   - Stock (quantité)
   - URL image (optionnel)
3. Cliquer **"Créer le produit"**

**Exemple URL image:**
```
https://via.placeholder.com/250x200?text=Mon+Produit
```

### Gérer les commandes
1. Cliquer **"📦 Voir commandes"**
2. Voir toutes les commandes
3. Voir le statut de chaque commande
4. Mettre à jour le statut:
   - En attente
   - Confirmée
   - Expédiée
   - Livrée
   - Annulée

**Statuts disponibles:**
- ⏳ En attente: Nouvelle commande
- ✅ Confirmée: Commande validée
- 📬 Expédiée: En route vers le client
- 🎁 Livrée: Reçue par le client
- ❌ Annulée: Commande annulée

### Voir les utilisateurs
1. Cliquer **"👥 Voir utilisateurs"**
2. Voir:
   - Email
   - Nom et prénom
   - Rôle (client, admin)
   - Date d'inscription

---

## 🔌 API Reference

### Authentification

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "nom": "Dupont",
  "prenom": "Jean"
}
```

**Response:**
```json
{
  "message": "Utilisateur créé avec succès",
  "userId": "uuid"
}
```

#### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "client"
  }
}
```

### Produits

#### Lister tous les produits
```http
GET /api/produits
```

**Query Parameters:**
- `categorie`: Filtrer par catégorie
- `search`: Rechercher par nom

**Response:**
```json
[
  {
    "id": "uuid",
    "nom": "Laptop Pro",
    "description": "...",
    "prix": 1299.99,
    "categorie": "Électronique",
    "stock": 15,
    "image_url": "https://...",
    "note": 4.5
  }
]
```

#### Obtenir un produit
```http
GET /api/produits/uuid
```

**Response:**
```json
{
  "id": "uuid",
  "nom": "Laptop Pro",
  "description": "...",
  "prix": 1299.99,
  "categorie": "Électronique",
  "stock": 15,
  "image_url": "https://...",
  "note": 4.5,
  "avis": [
    {
      "id": "uuid",
      "note": 5,
      "commentaire": "Excellent!",
      "prenom": "Jean",
      "nom": "Dupont"
    }
  ]
}
```

### Panier

#### Voir le panier
```http
GET /api/panier
Authorization: Bearer token
```

#### Ajouter au panier
```http
POST /api/panier
Authorization: Bearer token
Content-Type: application/json

{
  "produit_id": "uuid",
  "quantite": 2
}
```

#### Retirer du panier
```http
DELETE /api/panier/panier_item_id
Authorization: Bearer token
```

### Commandes

#### Créer une commande
```http
POST /api/commandes
Authorization: Bearer token
Content-Type: application/json

{
  "adresse_livraison": "123 Rue de Paris, 75000 Paris"
}
```

**Response:**
```json
{
  "message": "Commande créée",
  "commandeId": "uuid",
  "total": 1599.98
}
```

#### Voir mes commandes
```http
GET /api/commandes
Authorization: Bearer token
```

#### Détails d'une commande
```http
GET /api/commandes/uuid
Authorization: Bearer token
```

### Avis

#### Ajouter un avis
```http
POST /api/avis
Authorization: Bearer token
Content-Type: application/json

{
  "produit_id": "uuid",
  "note": 5,
  "commentaire": "Excellent produit!"
}
```

### Admin

#### Statistiques
```http
GET /api/admin/stats
Authorization: Bearer admin_token
```

#### Ajouter un produit
```http
POST /api/admin/produits
Authorization: Bearer admin_token
Content-Type: application/json

{
  "nom": "Nouveau Produit",
  "description": "Description...",
  "prix": 99.99,
  "categorie": "Électronique",
  "stock": 50,
  "image_url": "https://..."
}
```

#### Mettre à jour le statut d'une commande
```http
PUT /api/admin/commandes/uuid/statut
Authorization: Bearer admin_token
Content-Type: application/json

{
  "statut": "expédiée"
}
```

---

## 🔍 Dépannage

### Le serveur ne démarre pas

**Erreur:** "Port 3000 already in use"
```bash
# Trouver quel processus utilise le port
netstat -ano | findstr :3000

# Ou changer le port dans server.js
PORT=3001
```

### "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Base de données corrompue
```bash
# Supprimer la DB et la recréer
del boutique.db
npm start
node init-products.js
```

### Les images ne s'affichent pas
- Vérifier que l'URL de l'image est valide
- Utiliser `https://` au lieu de `http://`
- Essayer: `https://via.placeholder.com/250x200?text=MonProduit`

### La connexion ne fonctionne pas
1. Vérifier l'email et mot de passe
2. Vérifier que le compte existe
3. Vérifier que le token est envoyé dans le header

### Les rôles admin ne fonctionnent pas
- Vérifier que `role = 'admin'` dans la DB
- Réinitialiser avec le compte admin par défaut

---

## 📞 Support

Pour plus d'aide:
1. Lire le `README.md`
2. Vérifier les logs dans la console
3. Vérifier la base de données: `boutique.db`

**Bon shopping! 🛍️**
