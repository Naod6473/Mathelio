#!/usr/bin/env bash
# Check origin/main, then deploy an explicit revision using its own update script.
set -Eeuo pipefail

sync_once() {
    local repo=$1 root=$2 commit current script
    git -C "$repo" fetch --prune origin +refs/heads/main:refs/remotes/origin/main || return 1
    commit=$(git -C "$repo" rev-parse --verify 'origin/main^{commit}') || return 1
    [[ $commit =~ ^[a-f0-9]{40}$ ]] || { echo 'Revision Git invalide.' >&2; return 1; }
    current=$(readlink -f "$root/current" || true)
    if [[ ${current##*/} == "$commit"-* ]]; then
        echo "Mathélio est déjà à jour : $commit"
        return 0
    fi
    echo "Nouvelle version à déployer : $commit"
    # No git reset or pull: leave the working tree untouched. Load the deployment
    # script from the exact revision being deployed, rather than an old checkout.
    script=$(mktemp) || return 1
    if ! git -C "$repo" show "$commit:deploy/update.sh" > "$script"; then
        rm -f "$script"
        return 1
    fi
    if bash "$script" "$commit"; then
        rm -f "$script"
    else
        rm -f "$script"
        echo "Échec du déploiement : $commit. Consulter journalctl -u mathelio-sync." >&2
        return 1
    fi
}

main() {
    [[ $EUID == 0 ]] || { echo 'Exécuter en root dans le LXC Mathélio.' >&2; exit 1; }
    export GIT_TERMINAL_PROMPT=0
    exec 8>/run/lock/mathelio-sync.lock
    flock -n 8 || { echo 'Une synchronisation est déjà en cours.'; exit 0; }
    sync_once /opt/mathelio /var/www/mathelio
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then main "$@"; fi
