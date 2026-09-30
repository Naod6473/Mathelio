#!/usr/bin/env bash
# A reload can return before Nginx's new workers accept requests.
wait_health() {
    local expected=$1 url=$2 response attempt
    shift 2
    for attempt in {1..10}; do
        if response=$(curl --fail --silent --show-error --connect-timeout 2 --max-time 3 "$@" "$url" 2>&1); then
            if node -e 'const r=JSON.parse(process.argv[1]);process.exit(r.ok===true&&r.version===process.argv[2]?0:1)' "$response" "$expected" 2>/dev/null; then
                printf 'Service prêt : %s (%s)\n' "$url" "$expected"
                return 0
            fi
        fi
        if (( attempt < 10 )); then sleep 1; fi
    done
    printf 'Échec du contrôle : %s\nDernière réponse : %s\n' "$url" "$response" >&2
    return 1
}
