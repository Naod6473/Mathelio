#!/usr/bin/env bash
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Exécuter en root dans le LXC Mathélio.'; exit 1; }
SOURCE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
[[ -d /opt/mathelio/.git ]] || { echo 'Le dépôt /opt/mathelio doit déjà être installé.'; exit 1; }
for tool in git node npm nginx sqlite3 curl flock systemctl; do
    command -v "$tool" >/dev/null || { echo "Outil manquant : $tool"; exit 1; }
done
node -e "require('node:sqlite')"
bash -n "$SOURCE/auto-sync.sh"
install -m 0755 "$SOURCE/auto-sync.sh" /usr/local/sbin/mathelio-auto-sync
install -m 0644 "$SOURCE/mathelio-sync.service" /etc/systemd/system/mathelio-sync.service
install -m 0644 "$SOURCE/mathelio-sync.timer" /etc/systemd/system/mathelio-sync.timer
systemctl daemon-reload
systemctl enable --now mathelio-sync.timer
echo 'Synchronisation automatique activée : GitHub est vérifié toutes les cinq minutes.'
echo 'Déclencher maintenant : systemctl start mathelio-sync.service'
echo 'Prochain passage : systemctl list-timers mathelio-sync.timer'
echo 'Journaux : journalctl -u mathelio-sync.service -n 80 --no-pager'
