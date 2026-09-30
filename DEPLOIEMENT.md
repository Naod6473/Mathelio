# Déployer Mathélio v2 sur le LXC

Cible connue : Debian 13, `192.168.1.37`, Nginx, domaine `mathelio.pissits.com`, tunnel Cloudflare existant pointant sur le port 80. Cette version nécessite un service Node pour le classement commun. Le tunnel ne change pas.

## 1. Préparer Node.js

Exécuter en root dans le LXC. Node 22.13 minimum est nécessaire pour `node:sqlite`. Si une version compatible est déjà installée à `/usr/bin/node`, conserver cette installation.

```bash
node --version
```

Pour installer Node 22 depuis le dépôt NodeSource (ajoute une source APT tierce signée), suivre sa [documentation](https://github.com/nodesource/distributions/blob/master/DEV_README.md) :

```bash
apt update
apt install -y curl ca-certificates git nginx sqlite3
curl -fsSL https://deb.nodesource.com/setup_22.x -o /root/nodesource_setup.sh
bash /root/nodesource_setup.sh
apt install -y nodejs
node -e "require('node:sqlite'); console.log('SQLite disponible')"
```

En cas d'erreur, s'arrêter avant le déploiement. Aucune installation Node n'est nécessaire sur Proxmox lui-même. Installer `sqlite3` même si Node est déjà présent : il sert aux sauvegardes.

## 2. Installer une version

Conserver le dépôt existant dans `/opt/mathelio`. Le script de mise à jour exige une référence explicite. Choisir le SHA d'un commit validé dans GitHub Actions. Pour préparer le dépôt :

```bash
cd /opt/mathelio
git pull --ff-only origin main
git log -1 --oneline
```

Puis, remplacer `COMMIT_VALIDE` par ce SHA :

```bash
bash /opt/mathelio/deploy/update.sh COMMIT_VALIDE
```

Le script récupère le commit, vérifie qu'il appartient à `origin/main`, exécute les tests, construit une version isolée, sauvegarde SQLite, installe le service sous l'utilisateur système `mathelio`, configure Nginx puis bascule le lien `current`. Il vérifie l'API directement puis via Nginx. En cas d'échec après configuration, il rétablit le lien et les configurations précédentes.

La première migration conserve le lien de la v1 sous `legacy-v1` et la configuration Nginx dans `/etc/nginx/sites-available/mathelio.before-*`. Les prochaines mises à jour v2 conservent une version `previous`. Les données navigateur restent présentes si l'adresse HTTPS ne change pas. Les parties communes en cours sont interrompues lors du redémarrage du service ; déployer en dehors des séances.

## 3. Vérifier

```bash
systemctl is-active nginx mathelio
curl -fsS http://127.0.0.1:4319/api/health
curl -fsS -H 'Host: mathelio.pissits.com' http://127.0.0.1/api/health
```

Ouvrir https://mathelio.pissits.com et recharger la page. La version 2 apparaît en pied de page. Activer volontairement la participation dans Réglages pour publier les prochains défis. Les fichiers utilisent `Cache-Control: no-cache` : ne pas ajouter de règle Cloudflare forçant un cache sur `/api/*` ou ignorant ces en-têtes.

## Mise à jour suivante et retour arrière

```bash
cd /opt/mathelio
git pull --ff-only origin main
bash deploy/update.sh COMMIT_VALIDE
```

Retour à la v2 précédente :

```bash
bash /opt/mathelio/deploy/rollback.sh
```

Ce retour arrière conserve la base de données courante. Pour une future migration de schéma incompatible, prévoir une restauration adaptée avant de déployer. La version 2 ne modifie pas de base antérieure à la v2, qui n'en possédait pas.

Les répertoires de versions ne sont pas supprimés automatiquement. Surveiller leur taille et conserver les versions nécessaires au retour arrière. Les scripts sont vérifiés syntaxiquement et les tests API tournent sur Windows/Linux via CI ; le premier lancement systemd/Nginx doit encore être vérifié sur le LXC réel.

## Données et journaux

- Base : `/var/lib/mathelio/mathelio.sqlite`, inaccessible depuis Nginx.
- Sauvegarde SQLite avant chaque mise à jour : `/var/lib/mathelio/backup-*.sqlite`.
- Historique de déploiement : `/var/log/mathelio-deploy.log`.
- API : `journalctl -u mathelio -n 100 --no-pager`.
- Nginx : `/var/log/nginx/mathelio-access.log`, `/var/log/nginx/mathelio-error.log`.
- Diagnostic navigateur : `/logs.html`.

Le service écoute uniquement sur `127.0.0.1:4319`. Nginx sert uniquement `current/public`, jamais le dépôt, les tests, le code serveur ou SQLite. La limite API de 300 requêtes/minute porte sur l'adresse du proxy local ; elle convient à un petit usage familial. Une utilisation scolaire importante demandera un réglage adapté et une gestion fiable des adresses clients.

Prévoir les sauvegardes Proxmox et une sauvegarde SQLite régulière via `.backup`. Copier seulement le fichier SQLite actif sans ses fichiers WAL n'est pas une sauvegarde fiable. Les profils et le bilan parent résident dans les navigateurs et nécessitent leur propre export.
