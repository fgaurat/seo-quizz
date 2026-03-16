#!/usr/bin/env bash
set -euo pipefail

#
# deploy.sh — Déploiement SEO Quizz vers production
#
# Usage:
#   ./deploy.sh              Déploiement complet (build + rsync + post-deploy)
#   ./deploy.sh --skip-build Rsync + post-deploy uniquement (assets déjà buildés)
#   ./deploy.sh --dry-run    Rsync en dry-run (rien n'est envoyé)
#

# --- Configuration ---
REMOTE_USER="root"
REMOTE_HOST="wp.seo4.fun"
REMOTE_PATH="/var/www/quizzes.seo4.fun"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)/"

# --- Couleurs ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --- Flags ---
SKIP_BUILD=false
DRY_RUN=false

for arg in "$@"; do
    case "$arg" in
        --skip-build) SKIP_BUILD=true ;;
        --dry-run)    DRY_RUN=true ;;
        --help|-h)
            echo "Usage: ./deploy.sh [--skip-build] [--dry-run]"
            exit 0
            ;;
        *)
            error "Option inconnue : $arg"
            exit 1
            ;;
    esac
done

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Déploiement SEO Quizz → production${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# --- Étape 1 : Build des assets ---
if [ "$SKIP_BUILD" = false ]; then
    info "Build des assets frontend (mode production)..."
    npx vite build --mode production
    ok "Assets buildés dans public/build/"
else
    warn "Build ignoré (--skip-build)"
    if [ ! -d "public/build" ]; then
        error "Le dossier public/build/ n'existe pas. Lancez d'abord npm run build."
        exit 1
    fi
fi

# --- Étape 2 : Vérifications pré-déploiement ---
info "Vérifications pré-déploiement..."

# Vérifier que public/hot n'existe pas
if [ -f "public/hot" ]; then
    warn "Suppression de public/hot (fichier Vite dev)"
    rm -f public/hot
fi

# Vérifier la connexion SSH
if ! ssh -q -o ConnectTimeout=5 "${REMOTE_USER}@${REMOTE_HOST}" "echo ok" > /dev/null 2>&1; then
    error "Impossible de se connecter à ${REMOTE_USER}@${REMOTE_HOST}"
    exit 1
fi
ok "Connexion SSH OK"

# --- Étape 3 : Rsync ---
RSYNC_FLAGS="-avz --delete"
if [ "$DRY_RUN" = true ]; then
    RSYNC_FLAGS="$RSYNC_FLAGS --dry-run"
    warn "Mode dry-run activé"
fi

info "Synchronisation des fichiers vers ${REMOTE_HOST}:${REMOTE_PATH}..."

rsync $RSYNC_FLAGS \
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
    --exclude='database/database.sqlite' \
    --exclude='.idea' \
    --exclude='.vscode' \
    --exclude='.env.production' \
    "${LOCAL_PATH}" \
    "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

ok "Fichiers synchronisés"

# --- Étape 4 : Commandes post-déploiement ---
if [ "$DRY_RUN" = true ]; then
    warn "Dry-run : commandes post-déploiement ignorées"
else
    info "Exécution des commandes post-déploiement..."

    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s <<'REMOTE_SCRIPT'
        set -euo pipefail
        cd /var/www/quizzes.seo4.fun

        echo "[remote] Composer install..."
        COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction --quiet

        echo "[remote] Migrations..."
        php artisan migrate --force

        echo "[remote] Optimisation des caches..."
        php artisan optimize

        echo "[remote] Permissions..."
        chown -R www-data:www-data storage bootstrap/cache

        echo "[remote] Redémarrage PHP-FPM..."
        systemctl reload php8.4-fpm

        echo "[remote] Redémarrage Reverb WebSocket..."
        systemctl restart quizzes-reverb.service 2>/dev/null || echo "[remote] Service Reverb non configuré — ignoré"

        echo "[remote] Terminé."
REMOTE_SCRIPT

    ok "Commandes post-déploiement exécutées"
fi

# --- Terminé ---
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Déploiement terminé !${NC}"
echo -e "${GREEN}  https://quizzes.seo4.fun${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
