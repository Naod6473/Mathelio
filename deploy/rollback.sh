#!/usr/bin/env bash
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Exécuter en root dans le LXC.'; exit 1; }
ROOT=/var/www/mathelio
exec 9>/run/lock/mathelio-update.lock
flock -n 9 || { echo 'Une mise à jour est en cours.'; exit 1; }
PREVIOUS=$(readlink -f "$ROOT/previous")
CURRENT=$(readlink -f "$ROOT/current")
[[ "$PREVIOUS" == "$ROOT/releases/"* && -f "$PREVIOUS/server.cjs" ]] || { echo 'Aucune version v2 précédente disponible.'; exit 1; }
restore_current(){ trap - ERR; ln -sfn "$CURRENT" "$ROOT/current.revert"; mv -Tf "$ROOT/current.revert" "$ROOT/current"; systemctl restart mathelio; echo 'Retour arrière impossible : version courante restaurée.'; exit 1; }
trap restore_current ERR
ln -sfn "$PREVIOUS" "$ROOT/current.next"
mv -Tf "$ROOT/current.next" "$ROOT/current"
systemctl restart mathelio
curl --retry 8 --retry-connrefused --retry-delay 1 --fail --silent http://127.0.0.1:4319/api/health
ln -sfn "$CURRENT" "$ROOT/previous"
printf '%s ROLLBACK %s\n' "$(date -Is)" "$PREVIOUS" >> /var/log/mathelio-deploy.log
echo 'Version précédente restaurée. La base de scores a été conservée.'
