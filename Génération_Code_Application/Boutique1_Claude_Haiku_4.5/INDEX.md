# 📚 Index Complet - eBoutique

## 📁 Structure du Projet

```
Cyber_Special_Project/
│
├── 📄 FICHIERS PRINCIPAUX
│   ├── server.js              API et backend (15KB)
│   ├── app.js                 Frontend logic (29KB)
│   ├── index.html             Page HTML principale
│   ├── style.css              Styles et design
│   └── package.json           Dépendances Node.js
│
├── 📄 SCRIPTS UTILITAIRES
│   ├── init-products.js       Initialiser 12 produits d'exemple
│   ├── test-api.js            Tests automatisés de l'API
│   ├── backup.sh              Script de backup (à créer)
│   └── config.js              Configuration avancée
│
├── 📄 DOCUMENTATION
│   ├── README.md              Guide principal (5KB)
│   ├── GUIDE.md               Guide détaillé utilisateur (8KB)
│   ├── ARCHITECTURE.md        Architecture du système (8KB)
│   ├── SECURITY.md            Guide de sécurité (8KB)
│   ├── DEPLOYMENT.md          Guide de déploiement (8KB)
│   └── INDEX.md               Ce fichier
│
├── 📄 CONFIGURATION
│   ├── .env                   Variables d'environnement (à créer)
│   ├── .env.example           Exemple de configuration
│   ├── .gitignore             Fichiers à ignorer
│   └── package-lock.json      Versions exactes npm
│
└── 📄 BASE DE DONNÉES & UPLOADS
    ├── boutique.db            SQLite (créée au démarrage)
    ├── uploads/               Dossier pour images (optionnel)
    └── logs/                  Dossier pour logs (optionnel)
```

---

## 🗂️ Fichiers par Type

### 🖥️ Backend
- **server.js** - Serveur Express, routes API, base de données
- **config.js** - Configuration centralisée

### 💻 Frontend
- **index.html** - Page HTML unique
- **app.js** - Logique JavaScript client
- **style.css** - Tous les styles CSS

### ⚙️ Configuration
- **package.json** - Dépendances et scripts
- **.env** - Variables sensibles (à ne pas commiter)
- **.gitignore** - Fichiers ignorés par Git

### 📚 Documentation
- **README.md** - Vue d'ensemble du projet
- **GUIDE.md** - Guide complet d'utilisation
- **ARCHITECTURE.md** - Architecture technique
- **SECURITY.md** - Guide de sécurité
- **DEPLOYMENT.md** - Guide de déploiement
- **INDEX.md** - Ce fichier

### 🛠️ Scripts Utilitaires
- **init-products.js** - Ajouter produits d'exemple
- **test-api.js** - Tester tous les endpoints

### 🗄️ Base de Données
- **boutique.db** - SQLite (créée au démarrage)

---

## 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur
npm start

# 3. Ouvrir dans navigateur
http://localhost:3000

# 4. Se connecter
Email: admin@boutique.com
Password: admin123

# 5. Ajouter produits (optionnel)
node init-products.js

# 6. Tester l'API (optionnel)
node test-api.js
```

---

## 📖 Guides Disponibles

### Pour les Utilisateurs
- **GUIDE.md** - Comment utiliser la boutique (clients et admins)

### Pour les Développeurs
- **ARCHITECTURE.md** - Comment le système fonctionne
- **server.js** - Commentaires inline sur le code backend
- **app.js** - Commentaires inline sur le code frontend

### Pour la Sécurité
- **SECURITY.md** - Checklist de sécurité complète

### Pour le Déploiement
- **DEPLOYMENT.md** - Comment déployer en production

---

## 🎯 Cas d'Utilisation

### Je veux...

#### ...démarrer la boutique
→ `npm start` et ouvrir http://localhost:3000

#### ...ajouter des produits
→ Lire **GUIDE.md** section "Admin" ou executer `node init-products.js`

#### ...comprendre l'architecture
→ Lire **ARCHITECTURE.md**

#### ...sécuriser la boutique
→ Lire **SECURITY.md** et **DEPLOYMENT.md**

#### ...tester l'API
→ Executer `node test-api.js`

#### ...déployer en production
→ Lire **DEPLOYMENT.md**

#### ...ajouter une nouvelle fonctionnalité
→ Lire **ARCHITECTURE.md** puis modifier `server.js` et `app.js`

#### ...corriger un bug
→ Vérifier les logs console et `node test-api.js`

---

## 📋 Endpoints API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Produits
- `GET /api/produits` - Lister produits
- `GET /api/produits/:id` - Détail produit
- `POST /api/admin/produits` - Ajouter produit (admin)

### Panier
- `GET /api/panier` - Voir panier
- `POST /api/panier` - Ajouter au panier
- `DELETE /api/panier/:id` - Retirer du panier

### Commandes
- `GET /api/commandes` - Mes commandes
- `GET /api/commandes/:id` - Détail commande
- `POST /api/commandes` - Créer commande

### Admin
- `GET /api/admin/stats` - Statistiques
- `GET /api/admin/commandes` - Toutes commandes
- `PUT /api/admin/commandes/:id/statut` - Update statut
- `GET /api/admin/users` - Tous utilisateurs

---

## 🔑 Identifiants de Test

### Admin
```
Email: admin@boutique.com
Password: admin123
```

### Client
Créer un compte via le formulaire d'inscription

### Produits de test
Exécuter: `node init-products.js`

---

## 💾 Base de Données

### Tables
- **users** - Utilisateurs (id, email, password, role)
- **produits** - Produits (nom, prix, stock, image)
- **panier** - Articles en panier
- **commandes** - Commandes clients
- **commande_items** - Articles d'une commande
- **avis** - Avis et commentaires
- **categories** - Catégories de produits

### Réinitialiser la BD
```bash
# Supprimer la DB
rm boutique.db

# Redémarrer le serveur
npm start

# La BD se recréera automatiquement
```

---

## 🔐 Sécurité

### Avant de déployer
1. Lire **SECURITY.md**
2. Changer JWT_SECRET
3. Utiliser HTTPS
4. Configurer .env
5. Tester les endpoints

### Checklist
- [ ] JWT_SECRET changé
- [ ] HTTPS en place
- [ ] .env configuré
- [ ] Logs configurés
- [ ] Backups en place

---

## 🛠️ Technologies Utilisées

| Technologie | Usage | Raison |
|---|---|---|
| Node.js | Runtime JavaScript | Performant, populaire |
| Express | Framework web | Léger, simple |
| SQLite | Base de données | Aucun serveur, facile |
| JWT | Authentification | Standard industrie |
| Bcrypt | Hashage mots de passe | Sécurisé |
| HTML5/CSS3/JS | Frontend | Vanilla, pas de dépendances |

---

## 📊 Statistiques du Projet

| Métrique | Valeur |
|---|---|
| Fichiers | 12+ |
| Lignes de code | ~4000+ |
| Dépendances | 8 |
| Endpoints API | 18+ |
| Tables BD | 7 |
| Fonctionnalités | 30+ |

---

## 🚨 Troubleshooting Rapide

| Problème | Solution |
|---|---|
| Serveur ne démarre pas | Port déjà utilisé, `lsof -i :3000` |
| BD corrompue | `rm boutique.db && npm start` |
| Images n'apparaissent pas | Vérifier URL images, utiliser https:// |
| Connexion échouée | Vérifier email/password |
| Erreur 401 | Token expiré ou manquant |
| Erreur 403 | Permission insuffisante (role admin requis) |

---

## 📞 Support

### Documentation
- `README.md` - Vue d'ensemble
- `GUIDE.md` - Mode d'emploi détaillé
- `ARCHITECTURE.md` - Technique
- `SECURITY.md` - Sécurité
- `DEPLOYMENT.md` - Production

### Automatisé
- `node test-api.js` - Tester API
- `pm2 logs` - Voir logs (avec PM2)

### Code source
- `server.js` - Commentaires backend
- `app.js` - Commentaires frontend

---

## ✅ Fonctionnalités Implémentées

- ✅ Authentification (Register/Login)
- ✅ Rôles (Client/Admin/Support)
- ✅ Catalogue produits
- ✅ Recherche & filtres
- ✅ Panier
- ✅ Commandes
- ✅ Suivi commandes
- ✅ Avis produits
- ✅ Dashboard Admin
- ✅ Gestion utilisateurs
- ✅ Gestion produits
- ✅ Statuts commandes
- ✅ Sécurité (JWT, Bcrypt)
- ✅ Design responsive
- ✅ API REST complète

---

## 🎓 Points d'Apprentissage

En travaillant sur eBoutique, vous apprendrez:
- ✅ Node.js & Express
- ✅ SQLite
- ✅ JWT & Authentification
- ✅ Design responsive
- ✅ API REST
- ✅ JavaScript vanilla
- ✅ HTML5 & CSS3
- ✅ Base de données
- ✅ Sécurité web
- ✅ Déploiement

---

## 🎯 Prochaines Étapes

1. **Tester** - `node test-api.js`
2. **Utiliser** - Se connecter et explorer
3. **Apprendre** - Lire `ARCHITECTURE.md`
4. **Modifier** - Ajouter vos propres fonctionnalités
5. **Déployer** - Suivre `DEPLOYMENT.md`

---

**Bienvenue dans eBoutique! 🛍️**

*Dernière mise à jour: 2024*
*Version: 1.0.0*
