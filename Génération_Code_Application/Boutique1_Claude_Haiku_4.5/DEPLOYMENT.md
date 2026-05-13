# 🚀 Déploiement eBoutique

## 📋 Table des matières
1. [Déploiement Local](#déploiement-local)
2. [Déploiement Sur Serveur](#déploiement-sur-serveur)
3. [Déploiement Cloud](#déploiement-cloud)
4. [Maintenance](#maintenance)

---

## 💻 Déploiement Local

### Développement rapide
```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur
npm start

# 3. Accéder à http://localhost:3000
```

### Avec auto-reload (nodemon)
```bash
# Installer
npm install --save-dev nodemon

# Dans package.json
"dev": "nodemon server.js"

# Démarrer
npm run dev
```

---

## 🖥️ Déploiement Sur Serveur (Ubuntu/Debian)

### Prérequis
- Serveur Ubuntu 20.04+
- Accès SSH root ou sudo
- Domaine configuré

### Étape 1: Configuration du serveur
```bash
# Mettre à jour
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm

# Vérifier
node --version
npm --version

# Installer Git
sudo apt install -y git

# Installer PM2 (process manager)
sudo npm install -g pm2

# Installer Nginx (reverse proxy)
sudo apt install -y nginx

# Installer SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### Étape 2: Préparer l'application
```bash
# Créer dossier application
mkdir -p /var/www/eboutique
cd /var/www/eboutique

# Cloner le repository
git clone https://github.com/votre-user/eboutique.git .

# Installer dépendances
npm install --production

# Créer fichier .env
cat > .env << EOF
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
DATABASE_PATH=./boutique.db
NODE_ENV=production
PORT=3000
EOF

# Initialiser la base de données
node init-products.js

# Permissions
sudo chown -R www-data:www-data /var/www/eboutique
```

### Étape 3: Configurer PM2
```bash
# Démarrer avec PM2
pm2 start server.js --name "eboutique" --env production

# Sauvegarder la configuration
pm2 save

# Auto-start au reboot
pm2 startup systemd -u www-data --hp /var/www/eboutique
```

### Étape 4: Configurer Nginx
```bash
# Créer configuration
sudo nano /etc/nginx/sites-available/eboutique
```

**Contenu:**
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/eboutique /etc/nginx/sites-enabled/

# Désactiver default
sudo rm /etc/nginx/sites-enabled/default

# Tester configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Étape 5: Configurer HTTPS/SSL
```bash
# Obtenir certificat Let's Encrypt
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Vérifier le déploiement
```bash
# État du service
pm2 status

# Logs
pm2 logs eboutique

# Visiter https://votre-domaine.com
```

---

## ☁️ Déploiement Cloud

### Heroku (Plus simple)

#### Prérequis
- Compte Heroku
- Heroku CLI installé

#### Déploiement
```bash
# 1. Login
heroku login

# 2. Créer app
heroku create eboutique-app

# 3. Configurer variables d'environnement
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set NODE_ENV=production

# 4. Déployer
git push heroku main

# 5. Initialiser BD
heroku run "node init-products.js"

# 6. Ouvrir
heroku open
```

### Vercel (Frontend seulement)
```bash
# Déployer le HTML/CSS/JS
npm install -g vercel
vercel --prod
```

### Railway (Gratuit + simple)
```bash
# 1. Connecter le repository
# Sur railway.app, créer nouveau projet

# 2. Configurer variables
JWT_SECRET=xxx
NODE_ENV=production

# 3. Auto-déploiement sur push
```

### DigitalOcean App Platform
```bash
# 1. Se connecter
# 2. New App -> Connect repo
# 3. Configure App
# 4. Deploy
```

### AWS EC2 + RDS

#### Avantages
- Scalabilité
- Flexibilité
- Support complet

#### Processus
1. Créer instance EC2
2. Configurer sécurité
3. Installer Node.js
4. Déployer application
5. Configurer RDS (PostgreSQL)
6. Load balancer

---

## 📊 Architecture Production

```
                    Internet
                       |
                       |
                   +-------+
                   | DNS   |
                   +---+---+
                       |
                   +-------+
                   | CDN   | (Images statiques)
                   +-------+
                       |
              +--------+--------+
              |                 |
          +-------+         +-------+
          |CloudF|         |Nginx  |
          |lare  |         |(HTTPS)|
          +---+---+         +---+---+
              |                 |
              +--------+--------+
                       |
                   +-------+
                   |Node.js|
                   |Server | (Port 3000)
                   +-------+
                       |
              +--------+--------+
              |        |        |
          +------+ +------+ +------+
          | PM2  | | PM2  | | PM2  |  (Load balancing)
          +------+ +------+ +------+
                       |
                   +-------+
                   |SQLite | (ou PostgreSQL)
                   |BD     |
                   +-------+
                       |
                   +-------+
                   |Backup |
                   +-------+
```

---

## 🔧 Maintenance

### Monitoring

#### PM2 Monitoring
```bash
# Installer monitoring
npm install pm2-auto-pull pm2-logrotate -g

# Dashboard
pm2 monit

# Web dashboard
pm2 web
# Accéder à http://localhost:9615
```

#### Logs
```bash
# Visualiser logs
pm2 logs eboutique

# Log rotation
pm2 install pm2-logrotate
```

#### Health Checks
```bash
# Endpoint de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date()
  });
});

# Vérifier régulièrement
curl http://localhost:3000/health
```

### Backups

#### Base de données
```bash
# Backup SQLite
cp boutique.db boutique-$(date +%Y%m%d).db

# Script automatisé
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/eboutique"
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/eboutique/boutique.db $BACKUP_DIR/boutique_$DATE.db

# Garder 7 jours de backups
find $BACKUP_DIR -name "boutique_*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# Cron job
0 2 * * * /var/www/eboutique/backup.sh
```

### Updates

#### Mettre à jour les dépendances
```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour
npm update

# Majeure (plus risqué)
npm install npm-check-updates -g
ncu -u
npm install
```

#### Redéployer
```bash
# Pull latest code
cd /var/www/eboutique
git pull origin main

# Réinstaller dépendances
npm install --production

# Redémarrer
pm2 restart eboutique

# Vérifier
curl https://votre-domaine.com
```

---

## 🚨 Troubleshooting

### Port 3000 en utilisation
```bash
# Trouver processus
lsof -i :3000

# Tuer le processus
kill -9 PID
```

### Base de données corrompue
```bash
# Backup
cp boutique.db boutique-backup.db

# Supprimer
rm boutique.db

# Redémarrer serveur
pm2 restart eboutique

# Réinitialiser produits
node init-products.js
```

### Mémoire saturée
```bash
# Vérifier utilisation
free -h

# Augmenter swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### SSL non renouvelé
```bash
# Renouveler manuel
sudo certbot renew

# Test auto-renew
sudo certbot renew --dry-run
```

---

## ✅ Checklist de Production

- [ ] JWT_SECRET configuré
- [ ] NODE_ENV=production
- [ ] Certificat SSL valid
- [ ] Logs configurés
- [ ] Backups automatisés
- [ ] Monitoring en place
- [ ] Firewall configuré
- [ ] Fails2ban installé
- [ ] PM2 auto-startup
- [ ] CDN configuré (optionnel)
- [ ] Health checks en place
- [ ] Auto-update dépendances (pas critique)
- [ ] Incident response plan
- [ ] Documentation mise à jour
- [ ] Tests en production
- [ ] DNS configuré
- [ ] Email notifications
- [ ] Alertes monitoring

---

## 📞 Support Production

- **Status page**: https://status.votre-domaine.com
- **Support email**: support@votre-domaine.com
- **Documentation**: https://docs.votre-domaine.com

---

**Le déploiement c'est pas fini, c'est le début! 🚀**
