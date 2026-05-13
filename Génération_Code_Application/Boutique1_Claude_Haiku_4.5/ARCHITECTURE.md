# 🏗️ Architecture eBoutique

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Frontend)                        │
│  index.html + app.js + style.css (HTML5/CSS3/JavaScript)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    SERVEUR (Backend)                         │
│  Node.js + Express (Gestion API & Logique métier)          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │        Routes et Contrôleurs                        │    │
│  │  - Authentification                                │    │
│  │  - Produits                                        │    │
│  │  - Panier                                          │    │
│  │  - Commandes                                       │    │
│  │  - Admin                                           │    │
│  │  - Avis                                            │    │
│  └────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       │                                      │
│  ┌────────────────────┴────────────────────────────────┐    │
│  │         BASE DE DONNÉES (SQLite)                    │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │   Users      │  │  Produits    │              │    │
│  │  │ - id         │  │ - id         │              │    │
│  │  │ - email      │  │ - nom        │              │    │
│  │  │ - password   │  │ - prix       │              │    │
│  │  │ - role       │  │ - stock      │              │    │
│  │  │ - adresse    │  │ - image_url  │              │    │
│  │  └──────────────┘  └──────────────┘              │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │   Commandes  │  │    Panier    │              │    │
│  │  │ - id         │  │ - id         │              │    │
│  │  │ - user_id    │  │ - user_id    │              │    │
│  │  │ - total      │  │ - produit_id │              │    │
│  │  │ - statut     │  │ - quantite   │              │    │
│  │  │ - adresse    │  └──────────────┘              │    │
│  │  └──────────────┘                                │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │     Avis     │  │ Commande Items│             │    │
│  │  │ - id         │  │ - id         │              │    │
│  │  │ - produit_id │  │ - commande_id│             │    │
│  │  │ - user_id    │  │ - produit_id │              │    │
│  │  │ - note       │  │ - quantite   │              │    │
│  │  │ - commentaire│  │ - prix       │              │    │
│  │  └──────────────┘  └──────────────┘              │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## 📊 Flux de Données

### 1️⃣ Authentification
```
Utilisateur
    ↓
Inscript/Login (formulaire)
    ↓
API /auth/register ou /auth/login
    ↓
Vérification base de données
    ↓
Génération JWT token
    ↓
Stockage token (localStorage)
    ↓
Utilisateur authentifié ✅
```

### 2️⃣ Parcours Produits
```
Client
    ↓
Accueil / Browse produits
    ↓
API GET /api/produits
    ↓
Database → SELECT * FROM produits
    ↓
Affichage produits
    ↓
Clic sur "Détails"
    ↓
API GET /api/produits/:id
    ↓
Récupération produit + avis
    ↓
Affichage détails produit
```

### 3️⃣ Achat
```
Client ajoute au panier
    ↓
API POST /api/panier
    ↓
INSERT INTO panier
    ↓
Clic "Panier"
    ↓
API GET /api/panier
    ↓
Affichage articles
    ↓
Clic "Paiement"
    ↓
API POST /api/commandes
    ↓
Créer commande + items
    ↓
Effacer panier
    ↓
Confirmation + numéro suivi ✅
```

## 🔐 Sécurité

### Authentification
- **JWT (JSON Web Token)** pour les sessions
- **Bcrypt** pour hasher les mots de passe
- **Expiration de token** après 7 jours
- **Vérification token** sur chaque requête protégée

### Contrôle d'accès (RBAC)
```javascript
// Admin only
if (req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Accès refusé' });
}

// Client authentifié
if (!req.user) {
  return res.status(401).json({ error: 'Non authentifié' });
}
```

### Validation des données
- Vérification des champs obligatoires
- Validation des emails
- Vérification des quantités
- Contrôle des stocks

## 📈 Performance

### Optimisations
1. **Requêtes DB indexées** - Sur user_id, produit_id
2. **Cache côté client** - localStorage pour le token
3. **Lazy loading** - Images chargées à la demande
4. **Pagination** - Possible à ajouter pour produits

### Scalabilité future
- **Migration vers PostgreSQL** - Plus robuste
- **Redis cache** - Pour accélérer
- **CDN images** - Amazon S3 ou Cloudinary
- **Microservices** - Payment, Email, Search séparés

## 🔄 Relations Base de Données

```
users (1) ──→ (Many) panier
   ↓              ↓
   └──→ (Many) commandes
          ↓
          └──→ (Many) commande_items
                  ↓
                  └──→ (Many) produits

produits (1) ──→ (Many) avis
   ↑                     ↓
   └──────────────── users

produits (1) ──→ (Many) panier

produits (1) ──→ (Many) commande_items ←─ (1) commandes
```

## 🎯 Cas d'Usage Principaux

### Client Standard
```
1. S'inscrire
2. Se connecter
3. Parcourir produits
4. Ajouter produits au panier
5. Passer commande
6. Suivre commande
7. Laisser avis
```

### Administrateur
```
1. Se connecter avec compte admin
2. Voir dashboard
3. Ajouter/modifier produits
4. Gérer commandes
5. Suivre statistiques
6. Gérer utilisateurs
```

## 📱 Endpoints Disponibles

### Public (sans authentification)
- `GET /api/produits` - Liste produits
- `GET /api/produits/:id` - Détail produit
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Authentification requise
- `GET /api/panier` - Voir panier
- `POST /api/panier` - Ajouter panier
- `DELETE /api/panier/:id` - Retirer panier
- `GET /api/commandes` - Mes commandes
- `POST /api/commandes` - Créer commande
- `GET /api/commandes/:id` - Détail commande
- `POST /api/avis` - Ajouter avis

### Admin uniquement
- `GET /api/admin/stats` - Statistiques
- `GET /api/admin/commandes` - Toutes commandes
- `PUT /api/admin/commandes/:id/statut` - Update statut
- `GET /api/admin/users` - Tous utilisateurs
- `POST /api/admin/produits` - Ajouter produit

## 🛠️ Stack Technologique

| Couche | Technologie | Raison |
|--------|-------------|--------|
| Frontend | HTML5/CSS3/JavaScript Vanilla | Simplicité, pas de dépendances |
| Backend | Node.js + Express | Rapide, facile, JavaScript |
| DB | SQLite | Léger, pas de serveur, parfait pour démo |
| Auth | JWT + Bcrypt | Standard industrie, sécurisé |
| Images | URLs externes | Flexible, pas de stockage serveur |
| Package Manager | npm | Standard Node.js |

## 🚀 Améliorations Recommandées

### Court terme
- [ ] Validation côté client en temps réel
- [ ] Confirmation email
- [ ] Gestion des erreurs plus robuste
- [ ] Tests unitaires
- [ ] Logger les opérations

### Moyen terme
- [ ] Upload d'images
- [ ] Système de coupons
- [ ] Wishlist/Favoris
- [ ] Filtres avancés
- [ ] Recommendations ML

### Long terme
- [ ] Paiement réel (Stripe)
- [ ] Messaging en direct
- [ ] Support multidevises
- [ ] Réservation inventaire
- [ ] Mobile app native

---

**Architecture créée pour être simple, performante et facilement extensible! 🚀**
