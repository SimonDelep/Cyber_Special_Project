# 🛍️ eBoutique - Boutique en Ligne Complète

Une boutique e-commerce moderne et complète avec Node.js, Express et SQLite.

## ✨ Fonctionnalités

### 👤 Authentification & Rôles
- ✅ Inscription et connexion sécurisées
- ✅ Rôles: Client, Admin, Support
- ✅ JWT pour l'authentification
- ✅ Bcrypt pour le hashage des mots de passe

### 📦 Gestion des Produits
- ✅ Catalogue de produits avec images
- ✅ Catégories de produits
- ✅ Recherche et filtres
- ✅ Gestion du stock
- ✅ Système d'avis et de notes

### 🛒 Panier et Commandes
- ✅ Ajout/suppression du panier
- ✅ Gestion des quantités
- ✅ Processus de commande complet
- ✅ Numéro de suivi
- ✅ Historique des commandes

### 💼 Dashboard Admin
- ✅ Statistiques en temps réel
- ✅ Gestion des produits
- ✅ Gestion des commandes
- ✅ Suivi des utilisateurs
- ✅ Gestion des statuts de commande

### 🎨 Frontend
- ✅ Interface moderne et responsive
- ✅ Design mobile-friendly
- ✅ UX optimisée
- ✅ Recherche en temps réel

## 🚀 Installation

### Prérequis
- Node.js (v14+)
- npm

### Étapes

1. **Cloner/Extraire le projet**
```bash
cd Cyber_Special_Project
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Démarrer le serveur**
```bash
npm start
```

4. **Accéder à la boutique**
- Ouvrir http://localhost:3000 dans le navigateur

## 📝 Identifiants de Test

### Admin
- **Email:** admin@boutique.com
- **Mot de passe:** admin123

### Client
- Créer un compte via le formulaire d'inscription

## 🗂️ Structure du Projet

```
Cyber_Special_Project/
├── server.js              # Serveur principal & API
├── app.js                 # Logique frontend
├── index.html             # Page HTML
├── style.css              # Styles CSS
├── package.json           # Dépendances
├── boutique.db            # Base de données SQLite
└── README.md              # Documentation
```

## 🗄️ Base de Données

### Tables Principales

| Table | Description |
|-------|-------------|
| **users** | Utilisateurs et authentification |
| **produits** | Catalogue de produits |
| **categories** | Catégories de produits |
| **panier** | Articles dans le panier |
| **commandes** | Historique des commandes |
| **commande_items** | Détails des articles commandés |
| **avis** | Avis et commentaires clients |

## 🔐 Sécurité

- ✅ Mots de passe hashés avec bcrypt
- ✅ Authentification par JWT
- ✅ Validation des données côté serveur
- ✅ Contrôle d'accès basé sur les rôles (RBAC)
- ✅ Protection contre les attaques courantes

## 📱 Endpoints API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Produits
- `GET /api/produits` - Lister tous les produits
- `GET /api/produits/:id` - Détails d'un produit

### Panier
- `GET /api/panier` - Voir le panier
- `POST /api/panier` - Ajouter au panier
- `DELETE /api/panier/:id` - Retirer du panier

### Commandes
- `GET /api/commandes` - Mes commandes
- `GET /api/commandes/:id` - Détails d'une commande
- `POST /api/commandes` - Créer une commande

### Avis
- `POST /api/avis` - Ajouter un avis

### Admin
- `GET /api/admin/stats` - Statistiques
- `GET /api/admin/commandes` - Toutes les commandes
- `PUT /api/admin/commandes/:id/statut` - Mettre à jour le statut
- `GET /api/admin/users` - Liste des utilisateurs
- `POST /api/admin/produits` - Ajouter un produit

## 🎯 Fonctionnalités Avancées

### Système de Notation
- Les clients peuvent laisser des avis (1-5 étoiles)
- Commentaires associés aux produits
- Affichage des avis sur la page produit

### Gestion des Commandes
- Création automatique du numéro de suivi
- Mise à jour du statut
- Suivi en temps réel
- Historique complet

### Recherche et Filtres
- Recherche par nom ou description
- Filtrage par catégorie
- Vérification du stock en temps réel

## 📸 Images

Les images peuvent être ajoutées via:
1. **URLs externes** - Liens directs vers des images web
2. **Upload** - Modifier `server.js` pour ajouter multer pour les uploads

## 🔧 Configuration

Modifier les paramètres dans `server.js`:
- `PORT` - Port du serveur (default: 3000)
- `SECRET_KEY` - Clé JWT (à changer en production!)
- Base de données: `boutique.db`

## 🌐 Variables d'Environnement (Futur)

```env
PORT=3000
JWT_SECRET=your_secret_key
DATABASE_PATH=./boutique.db
NODE_ENV=development
```

## 📊 Améliorations Futures

- [ ] Intégration Stripe/PayPal
- [ ] Email de confirmation
- [ ] Système de coupons
- [ ] Wishlist
- [ ] Recommandations produits
- [ ] Upload d'images depuis l'interface
- [ ] Export des commandes (PDF)
- [ ] Statistiques avancées
- [ ] Chat support en direct
- [ ] Application mobile

## 🤝 Support

Pour toute question ou problème:
1. Vérifier que Node.js est installé
2. Vérifier que le port 3000 est disponible
3. Supprimer `boutique.db` pour réinitialiser la DB

## 📄 Licence

MIT

## 👨‍💻 Auteur

Cyber Special Project

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2024
