#!/usr/bin/env bash
# Run as root. Accept only an explicit Git revision, never deploy an untested pull.
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Exécuter en root dans le LXC.'; exit 1; }
REVISION=${1:?Usage: bash deploy/update.sh COMMIT_OU_TAG}
ROOT=/var/www/mathelio
REPO=/opt/mathelio
install -d "$ROOT/releases"
exec 9>/run/lock/mathelio-update.lock
flock -n 9 || { echo 'Une mise à jour est déjà en cours.'; exit 1; }
git -C "$REPO" fetch origin
COMMIT=$(git -C "$REPO" rev-parse --verify "${REVISION}^{commit}")
git -C "$REPO" merge-base --is-ancestor "$COMMIT" origin/main || { echo 'Cette version ne fait pas partie de origin/main.'; exit 1; }
node -e "require('node:sqlite')" || { echo 'Node.js 22.13 minimum requis.'; exit 1; }
RELEASE="$ROOT/releases/${COMMIT}-$(date +%s)"
install -d "$RELEASE/source" "$RELEASE/public"
git -C "$REPO" archive "$COMMIT" | tar -x -C "$RELEASE/source"
(cd "$RELEASE/source" && npm test)
for file in index.html style.css script.js engine.js progress.js audio.js diagnostics.js logs.html logs.js favicon.svg; do
    install -m 644 "$RELEASE/source/$file" "$RELEASE/public/$file"
done
cp -r "$RELEASE/source/assets" "$RELEASE/public/assets"
install -m 644 "$RELEASE/source/server.cjs" "$RELEASE/server.cjs"
install -m 644 "$RELEASE/source/engine.js" "$RELEASE/engine.js"
chmod -R a+rX "$RELEASE"
OLD=$(readlink -f "$ROOT/current" || true)
id mathelio >/dev/null 2>&1 || useradd --system --home /var/lib/mathelio --shell /usr/sbin/nologin mathelio
install -d -o mathelio -g mathelio -m 700 /var/lib/mathelio
BACKUP="/var/lib/mathelio/backup-$(date +%Y%m%d-%H%M%S).sqlite"
if [[ -f /var/lib/mathelio/mathelio.sqlite ]]; then
    sqlite3 /var/lib/mathelio/mathelio.sqlite ".backup '$BACKUP'"
    chmod 600 "$BACKUP"
fi
STAMP=$(date +%s)
NGINX_BACKUP="/etc/nginx/sites-available/mathelio.before-$STAMP"
SERVICE_BACKUP="/etc/systemd/system/mathelio.service.before-$STAMP"
[[ ! -f /etc/nginx/sites-available/mathelio ]] || cp /etc/nginx/sites-available/mathelio "$NGINX_BACKUP"
[[ ! -f /etc/systemd/system/mathelio.service ]] || cp /etc/systemd/system/mathelio.service "$SERVICE_BACKUP"
rollback_failed() {
    trap - ERR
    echo "Échec : restauration de la version précédente."
    if [[ -n "$OLD" ]]; then ln -sfn "$OLD" "$ROOT/current.revert"; mv -Tf "$ROOT/current.revert" "$ROOT/current"; fi
    if [[ -f "$NGINX_BACKUP" ]]; then cp "$NGINX_BACKUP" /etc/nginx/sites-available/mathelio; fi
    if [[ -f "$SERVICE_BACKUP" ]]; then cp "$SERVICE_BACKUP" /etc/systemd/system/mathelio.service; systemctl daemon-reload; systemctl restart mathelio || true; else systemctl stop mathelio || true; fi
    nginx -t && systemctl reload nginx
    printf '%s FAILURE %s\n' "$(date -Is)" "$COMMIT" >> /var/log/mathelio-deploy.log
    exit 1
}
trap rollback_failed ERR
install -m 644 "$RELEASE/source/deploy/mathelio.service" /etc/systemd/system/mathelio.service
install -m 644 "$RELEASE/source/deploy/nginx.conf" /etc/nginx/sites-available/mathelio
ln -sfn /etc/nginx/sites-available/mathelio /etc/nginx/sites-enabled/mathelio
nginx -t
ln -sfn "$RELEASE" "$ROOT/current.next"
mv -Tf "$ROOT/current.next" "$ROOT/current"
systemctl daemon-reload
systemctl enable mathelio
systemctl restart mathelio
source "$RELEASE/source/deploy/health.sh"
EXPECTED_VERSION=$(node -p "require('$RELEASE/source/package.json').version")
wait_health "$EXPECTED_VERSION" http://127.0.0.1:4319/api/health
systemctl reload nginx
wait_health "$EXPECTED_VERSION" http://127.0.0.1/api/health -H 'Host: mathelio.pissits.com'
if [[ -n "$OLD" && -f "$OLD/server.cjs" ]]; then ln -sfn "$OLD" "$ROOT/previous"; elif [[ -n "$OLD" ]]; then ln -sfn "$OLD" "$ROOT/legacy-v1"; fi
printf '%s SUCCESS %s\n' "$(date -Is)" "$COMMIT" >> /var/log/mathelio-deploy.log
echo "Mathélio mis à jour : $COMMIT"
