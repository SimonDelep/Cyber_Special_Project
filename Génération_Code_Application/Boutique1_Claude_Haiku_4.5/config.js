/**
 * Configuration avancée pour eBoutique
 * À importer dans server.js pour activer les fonctionnalités
 */

// === CONFIGURATION DE BASE ===
const config = {
  // Serveur
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  
  // Sécurité
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  },
  
  // Bcrypt
  bcrypt: {
    rounds: 10
  },
  
  // Base de données
  database: {
    path: process.env.DATABASE_PATH || './boutique.db',
    timeout: 5000
  },
  
  // Upload fichiers
  upload: {
    enabled: false,
    dir: './uploads',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  
  // CORS
  cors: {
    enabled: false,
    origins: ['http://localhost:3000', 'http://localhost:3001']
  },
  
  // Email (optionnel)
  email: {
    enabled: false,
    provider: 'smtp', // 'smtp' ou 'sendgrid'
    from: process.env.SMTP_FROM || 'noreply@eboutique.com',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || ''
      }
    }
  },
  
  // Paiement
  payment: {
    enabled: false,
    provider: 'stripe', // 'stripe' ou 'paypal'
    stripe: {
      publicKey: process.env.STRIPE_PUBLIC_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || ''
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || ''
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info', // error, warn, info, debug
    format: 'json', // 'json' ou 'text'
    file: './logs/eboutique.log'
  },
  
  // Limites et validations
  limits: {
    maxProductsPerPage: 50,
    maxOrdersPerPage: 25,
    maxReviewsPerProduct: 100,
    maxCartItems: 100,
    maxFileUploadSize: 5 * 1024 * 1024,
    passwordMinLength: 6,
    emailMaxLength: 255
  },
  
  // Cache
  cache: {
    enabled: false,
    ttl: 3600, // 1 heure
    // Option: utiliser Redis
    // redis: {
    //   host: 'localhost',
    //   port: 6379,
    //   db: 0
    // }
  },
  
  // Statuts et énumérations
  statuses: {
    order: ['en attente', 'confirmée', 'expédiée', 'livrée', 'annulée'],
    user: ['actif', 'inactif', 'suspendu'],
    payment: ['pending', 'completed', 'failed', 'refunded']
  },
  
  // Rôles et permissions
  roles: {
    client: {
      permissions: [
        'view_products',
        'view_own_orders',
        'create_order',
        'view_cart',
        'create_review',
        'view_reviews'
      ]
    },
    admin: {
      permissions: [
        'view_products',
        'create_product',
        'update_product',
        'delete_product',
        'view_all_orders',
        'update_order_status',
        'view_all_users',
        'view_stats',
        'manage_categories'
      ]
    },
    support: {
      permissions: [
        'view_all_orders',
        'update_order_status',
        'view_user_info',
        'view_products'
      ]
    }
  }
};

// === CATÉGORIES PAR DÉFAUT ===
const defaultCategories = [
  { nom: 'Électronique', description: 'Appareils électroniques et gadgets' },
  { nom: 'Vêtements', description: 'Vêtements pour tous les styles' },
  { nom: 'Livres', description: 'Livres et publications' },
  { nom: 'Maison', description: 'Articles pour la maison' },
  { nom: 'Sports', description: 'Équipements sportifs' },
  { nom: 'Jouets', description: 'Jouets et loisirs' },
  { nom: 'Beauté', description: 'Produits de beauté' },
  { nom: 'Alimentation', description: 'Aliments et boissons' }
];

// === PRODUITS PAR DÉFAUT PREMIUM ===
const premiumProducts = [
  {
    nom: 'MacBook Pro 16"',
    description: 'Ordinateur portable haut de gamme Apple avec M2 Max',
    prix: 3499.99,
    categorie: 'Électronique',
    stock: 5,
    image_url: 'https://via.placeholder.com/250x200?text=MacBook+Pro'
  },
  {
    nom: 'iPhone 15 Pro Max',
    description: 'Smartphone premium Apple dernière génération',
    prix: 1599.99,
    categorie: 'Électronique',
    stock: 10,
    image_url: 'https://via.placeholder.com/250x200?text=iPhone+15+Pro'
  },
  {
    nom: 'Canon EOS R5',
    description: 'Appareil photo professionnel haute résolution',
    prix: 4299.99,
    categorie: 'Électronique',
    stock: 3,
    image_url: 'https://via.placeholder.com/250x200?text=Canon+EOS+R5'
  }
];

// === MESSAGES STANDARDS ===
const messages = {
  fr: {
    errors: {
      notFound: 'Ressource non trouvée',
      unauthorized: 'Non authentifié',
      forbidden: 'Accès refusé',
      invalidInput: 'Données invalides',
      emailExists: 'Cet email est déjà utilisé',
      invalidPassword: 'Mot de passe incorrect',
      outOfStock: 'Produit en rupture de stock',
      cartEmpty: 'Votre panier est vide',
      orderNotFound: 'Commande non trouvée'
    },
    success: {
      registered: 'Inscription réussie!',
      loggedIn: 'Connecté avec succès!',
      orderCreated: 'Commande créée!',
      productAdded: 'Produit ajouté!',
      reviewAdded: 'Avis ajouté!',
      statusUpdated: 'Statut mis à jour!'
    }
  }
};

// === VALIDATION SCHEMAS ===
const validationSchemas = {
  user: {
    email: {
      required: true,
      type: 'email',
      maxLength: 255
    },
    password: {
      required: true,
      minLength: 6,
      maxLength: 255
    },
    nom: {
      required: true,
      type: 'string',
      maxLength: 100
    },
    prenom: {
      required: true,
      type: 'string',
      maxLength: 100
    }
  },
  product: {
    nom: {
      required: true,
      type: 'string',
      maxLength: 255
    },
    prix: {
      required: true,
      type: 'number',
      min: 0
    },
    stock: {
      required: true,
      type: 'integer',
      min: 0
    },
    categorie: {
      required: true,
      type: 'string'
    }
  },
  review: {
    note: {
      required: true,
      type: 'integer',
      min: 1,
      max: 5
    },
    commentaire: {
      required: false,
      type: 'string',
      maxLength: 1000
    }
  }
};

// === FONCTIONS UTILITAIRES ===
class ConfigManager {
  static getConfig() {
    return config;
  }

  static getValue(path, defaultValue = null) {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  static isDevelopment() {
    return process.env.NODE_ENV !== 'production';
  }

  static hasFeature(feature) {
    return config[feature]?.enabled === true;
  }

  static getPermissions(role) {
    return config.roles[role]?.permissions || [];
  }

  static canAccess(role, permission) {
    const permissions = this.getPermissions(role);
    return permissions.includes(permission);
  }
}

// === EXPORT ===
module.exports = {
  config,
  defaultCategories,
  premiumProducts,
  messages,
  validationSchemas,
  ConfigManager
};

/**
 * UTILISATION DANS SERVER.JS:
 * 
 * const { config, ConfigManager } = require('./config');
 * 
 * // Récupérer une valeur
 * const port = ConfigManager.getValue('port');
 * 
 * // Vérifier si en production
 * if (ConfigManager.isProduction()) {
 *   // Activer HTTPS
 * }
 * 
 * // Vérifier permission
 * if (ConfigManager.canAccess('admin', 'create_product')) {
 *   // Créer produit
 * }
 */
