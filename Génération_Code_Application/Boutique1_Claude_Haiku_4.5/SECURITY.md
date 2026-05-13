# 🔐 Guide de Sécurité - eBoutique

## ⚠️ IMPORTANT: À Faire Avant Production

### 1. Changer la Clé JWT
```javascript
// ❌ JAMAIS en production
const SECRET_KEY = 'your_secret_key_change_in_production';

// ✅ À faire
const SECRET_KEY = process.env.JWT_SECRET;
// Générer: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Utiliser HTTPS
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
```

### 3. Variables d'Environnement
```bash
# .env (NE PAS commiter!)
JWT_SECRET=xxx
DATABASE_PATH=./boutique.db
NODE_ENV=production
PORT=3000
```

### 4. CORS Sécurisé
```javascript
const cors = require('cors');

const whitelist = ['https://eboutique.com', 'https://www.eboutique.com'];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

---

## 🛡️ Vulnérabilités Courantes et Prévention

### 1. SQL Injection ✅ Protégé
```javascript
// ❌ DANGEREUX
db.run(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ SÉCURISÉ (parametrized queries)
db.run('SELECT * FROM users WHERE email = ?', [email], ...);
```

### 2. XSS (Cross-Site Scripting) ✅ Protégé
```javascript
// ❌ DANGEREUX
html += `<div>${userInput}</div>`;

// ✅ SÉCURISÉ
const textarea = document.createElement('textarea');
textarea.textContent = userInput;
html += `<div>${textarea.innerHTML}</div>`;
// Ou utiliser une librairie: DOMPurify
```

### 3. CSRF (Cross-Site Request Forgery) ⚠️ À Implémenter
```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Dans les formulaires
<input type="hidden" name="_csrf" value="<%= csrfToken %>">
```

### 4. Rate Limiting ⚠️ À Implémenter
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requêtes
});

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // Max 5 tentatives de login
}));
```

### 5. Validation des Inputs ✅ Partiellement Protégé
```javascript
// À améliorer avec express-validator
const { validationResult, body } = require('express-validator');

app.post('/api/auth/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('nom').trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Continuer...
  }
);
```

### 6. Injection de Dépendances ⚠️ À Améliorer
```javascript
// Éviter les chemins dynamiques non validés
// ❌ Dangereux
const path = req.params.file;
const data = fs.readFileSync(`./uploads/${path}`);

// ✅ Sécurisé
const allowedFiles = ['file1.pdf', 'file2.pdf'];
if (!allowedFiles.includes(req.params.file)) {
  return res.status(403).json({ error: 'Access denied' });
}
```

---

## 🔑 Gestion des Secrets

### Variables Sensibles
```
- JWT_SECRET
- Database password (si applicable)
- API keys (Stripe, PayPal)
- SMTP credentials
```

### À JAMAIS commiter:
```
- .env
- private keys
- certificates
- database backups
- logs contenant mots de passe
```

### Rotation des Secrets
```bash
# Tous les 3 mois en production
# Notamment JWT_SECRET
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

---

## 🔐 Authentification Sécurisée

### Bcrypt
```javascript
// ✅ Sécurisé
const hashedPassword = bcrypt.hashSync(password, 10);
const isValid = bcrypt.compareSync(password, hashedPassword);

// Nombre de rounds (coût)
// 10 = bon compromis sécurité/performance
// Plus haut = plus sécurisé mais plus lent
```

### JWT
```javascript
// Token contient:
const payload = {
  id: user.id,
  email: user.email,
  role: user.role
  // ❌ NE JAMAIS inclure de secrets, passwords, cartes bancaires
};

const token = jwt.sign(payload, SECRET_KEY, { 
  expiresIn: '7d',
  algorithm: 'HS256'
});
```

### Sessions vs JWT
```
Sessions (traditional)
+ Serveur contrôle complètement
- État serveur, scalabilité difficile

JWT (moderne)
+ Stateless, scalable
- Impossible de révoquer immédiatement
- Fuite de token = accès jusqu'à expiration

Recommandation: JWT pour API, Sessions pour web classique
```

---

## 🛡️ Headers de Sécurité

### À Ajouter
```javascript
const helmet = require('helmet');

app.use(helmet());

// Ou manuellement:
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

---

## 🔍 Audit et Logging

### Logger les Actions Importantes
```javascript
function logSecurityEvent(event, user, details) {
  console.log(JSON.stringify({
    timestamp: new Date(),
    event: event, // 'login', 'failed_login', 'admin_action'
    userId: user?.id,
    userEmail: user?.email,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    details: details
  }));
}

// Utilisation
logSecurityEvent('admin_product_created', req.user, { productId: product.id });
logSecurityEvent('failed_login', null, { email: email });
```

### Monitorer
```
- Tentatives de login échouées (brute force)
- Accès non autorisés (403)
- Modifications d'objets d'autres utilisateurs
- Uploads de fichiers malveillants
- Grandes requêtes (DoS)
```

---

## 📋 Checklist de Sécurité

- [ ] JWT_SECRET en variable d'environnement
- [ ] Pas de secrets dans le code
- [ ] HTTPS en production
- [ ] CORS configuré
- [ ] Rate limiting sur login/register
- [ ] Validation des inputs
- [ ] SQL injections prévenues (prepared statements)
- [ ] XSS prévenu (escaping)
- [ ] CSRF tokens
- [ ] Headers de sécurité (Helmet)
- [ ] Logging des événements
- [ ] Gestion des erreurs sécurisée
- [ ] Pas d'infos sensibles dans les réponses d'erreur
- [ ] Mots de passe minima 6 caractères (recommandé 12+)
- [ ] Hashage des mots de passe (Bcrypt)
- [ ] Tokens avec expiration
- [ ] HTTPS en production
- [ ] Certificats SSL valides
- [ ] Backup réguliers
- [ ] Monitoring et alertes

---

## 🚀 Déploiement Sécurisé

### Avant le déploiement
```bash
# Vérifier pas de secrets
grep -r "password\|secret\|key" . --exclude-dir=node_modules

# Tests de sécurité
npm audit

# Vérifier .env en .gitignore
cat .gitignore | grep ".env"

# Vérifier NODE_ENV
export NODE_ENV=production

# Utiliser certificat SSL
# Letsencrypt gratuit: https://letsencrypt.org
```

### Sur le serveur
```bash
# Utilisateur non-root
useradd eboutique-app

# Permissions restrictives
chmod 600 .env
chmod 600 private-key.pem

# Firewall
sudo ufw allow 443
sudo ufw allow 80

# Monitoring
npm install -g pm2
pm2 start server.js --name eboutique
pm2 logs eboutique
```

---

## 📞 Incident Response

### Si compromission
1. **Revoke tous les tokens JWT** (pas possible avec JWT... alternative: blacklist)
2. **Changer JWT_SECRET**
3. **Reset mots de passe utilisateurs**
4. **Audit des logs**
5. **Notifier utilisateurs**

### Blacklist de tokens (alternative JWT)
```javascript
const tokenBlacklist = new Set();

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    tokenBlacklist.add(token);
  }
  res.json({ message: 'Logged out' });
});

// Vérifier dans middleware
if (tokenBlacklist.has(token)) {
  return res.status(401).json({ error: 'Token révoqué' });
}
```

---

## 🎓 Ressources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
- npm audit: https://docs.npmjs.com/cli/audit

---

**La sécurité n'est pas une option, c'est une nécessité! 🔐**
