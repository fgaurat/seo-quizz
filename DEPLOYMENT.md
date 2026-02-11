# Déploiement — SEO Quizz

## Prérequis serveur

- **PHP >= 8.4** avec extensions : mysql, mbstring, xml, curl, zip, bcmath, gd, intl
- **PHP-FPM 8.4** avec un pool dédié
- **Nginx**
- **MariaDB / MySQL**
- **Composer**
- **Node.js + npm** (build local uniquement)

## Configuration serveur

### Pool PHP-FPM

Créer `/etc/php/8.4/fpm/pool.d/quizzes.seo4.fun.conf` :

```ini
[quizzes.seo4.fun]
user = www-data
group = www-data
listen = /run/php/php8.4-fpm-quizzes.seo4.fun.sock
listen.owner = www-data
listen.group = www-data
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
```

Puis recharger : `systemctl reload php8.4-fpm`

### Nginx

Voir `/etc/nginx/sites-available/quizzes.seo4.fun.conf`. Points importants :

- Le `root` pointe vers `/var/www/quizzes.seo4.fun/public`
- Le socket fastcgi pointe vers le pool PHP 8.4
- **Ne pas** mettre `X-Frame-Options: SAMEORIGIN` globalement (les quiz publics doivent être intégrables en iframe cross-origin)

### Base de données

```sql
CREATE DATABASE seo_quizzes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'seo_quizzes'@'localhost' IDENTIFIED BY '<MOT_DE_PASSE>';
GRANT ALL PRIVILEGES ON seo_quizzes.* TO 'seo_quizzes'@'localhost';
FLUSH PRIVILEGES;
```

### Variables d'environnement (.env)

Configurer au minimum sur le serveur :

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://quizzes.seo4.fun

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=seo_quizzes
DB_USERNAME=seo_quizzes
DB_PASSWORD=<MOT_DE_PASSE>
```

**Attention** : `APP_URL` ne doit **pas** avoir de slash final (sinon les URLs d'embed auront un double slash).

Générer la clé si c'est la première installation :

```bash
php artisan key:generate --force
```

## Déploiement

### 1. Build des assets (en local)

```bash
./vendor/bin/sail npm run build
```

Cela génère les fichiers dans `public/build/`.

### 2. Rsync vers le serveur

```bash
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='public/hot' \
  --exclude='storage/logs/*' \
  --exclude='storage/framework/cache/data/*' \
  --exclude='storage/framework/sessions/*' \
  --exclude='storage/framework/views/*' \
  --exclude='storage/app/*' \
  --exclude='bootstrap/cache/*' \
  /Users/fgaurat/local_dev/seo/seo-quizz/ \
  root@wp.seo4.fun:/var/www/quizzes.seo4.fun/
```

Exclusions importantes :
- `.env` — ne jamais écraser la config de prod
- `public/hot` — fichier créé par Vite en dev, provoque le chargement depuis `localhost:5173`
- `storage/` — logs, sessions et cache du serveur
- `node_modules/` — inutile en prod

### 3. Commandes post-déploiement (sur le serveur)

```bash
cd /var/www/quizzes.seo4.fun

# Installer les dépendances PHP (sans les dépendances de dev)
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction

# Migrations
php artisan migrate --force

# Optimisation des caches
php artisan optimize

# Permissions
chown -R www-data:www-data storage bootstrap/cache
```

### Commande complète (one-liner)

```bash
ssh root@wp.seo4.fun "cd /var/www/quizzes.seo4.fun && \
  COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction && \
  php artisan migrate --force && \
  php artisan optimize && \
  chown -R www-data:www-data storage bootstrap/cache"
```

## Pièges connus

| Problème | Cause | Solution |
|----------|-------|----------|
| Assets chargent depuis `localhost:5173` | Fichier `public/hot` déployé par erreur | Exclure `public/hot` du rsync |
| Mixed Content (HTTP dans HTTPS) | `APP_URL` incorrect ou slash final | Vérifier `APP_URL=https://...` sans `/` final |
| Double slash dans les URLs d'embed | `APP_URL` se termine par `/` | Retirer le slash final |
| 502 Bad Gateway | Pool PHP-FPM manquant | Créer le pool et recharger `php-fpm` |
| 500 Internal Server Error | `APP_KEY` vide | `php artisan key:generate --force` |
| 419 sur submit quiz en iframe | CSRF bloque le POST cross-origin | La route `q/*/submit` est exclue du CSRF dans `bootstrap/app.php` |
| Script d'embed bloqué | Les ad blockers filtrent `embed.js` | Le script est nommé `quiz-widget.js` |
| Quiz non affichable en iframe | `X-Frame-Options: SAMEORIGIN` | Ne pas mettre ce header dans Nginx ; le contrôleur gère ça |
