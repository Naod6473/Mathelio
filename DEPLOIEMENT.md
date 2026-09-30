# Préparation de l’hébergement

## Fichiers publics

Servir ensemble : `index.html`, `style.css`, `script.js`, `engine.js`, `diagnostics.js`, `logs.html`, `logs.js`, `favicon.svg`.

Le jeu fonctionne depuis la racine ou un sous-dossier. Aucun routage SPA à configurer : les vues du jeu sont internes et le diagnostic a sa propre page. Aucun CDN, service externe, service worker, base de données ou processus Node requis en production.

N’exposer ni `.git`, ni les fichiers de développement, ni de futurs secrets. Le serveur d’aperçu fourni écoute uniquement sur la boucle locale et n’est pas le serveur de production.

## À décider ensemble

1. Dépôt public : https://github.com/Naod6473/Mathelio ; branche principale : `main`. La branche ou version à déployer sera choisie avec l’hébergement.
2. Cible : LXC ou VM, serveur HTTP et domaine.
3. Déclenchement des mises à jour : manuel ou automatique après validation des tests.
4. Conservation des logs serveur et éventuel diagnostic centralisé.

## Proposition de mise à jour, à configurer après choix de la cible

Tester chaque changement dans GitHub Actions, préparer un répertoire de version avec seulement les fichiers publics, puis basculer le serveur vers ce répertoire. Conserver la version précédente pour pouvoir revenir en arrière. Ne pas remplacer progressivement les fichiers servis au cours d’une mise à jour.

Configurer la revalidation HTTP (`Cache-Control: no-cache`) pour les fichiers de cette version, dont les noms ne sont pas hachés. Une page déjà ouverte conserve son ancien JavaScript jusqu’au rechargement ; la mettre à jour après la fin de la partie. Une mise à jour conserve localStorage si l’origine reste identique. Une évolution du format de données devra inclure une migration explicite avant écriture.

Le journal de l’application reste dans chaque navigateur. Les logs d’accès et d’erreur Nginx/Apache/Caddy seront gérés côté serveur. La page diagnostic ne nécessite pas d’authentification car elle n’accède qu’aux événements du navigateur courant.
