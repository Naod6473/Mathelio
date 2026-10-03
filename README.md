# Mathélio · version 2.1

Application de calcul mental en HTML/CSS/JavaScript natifs. Le jeu personnel reste utilisable sur un serveur statique, sans compilation ni dépendance front-end. Le classement commun facultatif utilise Node.js 22.13 minimum et SQLite intégrée, sans paquet npm externe.

## Démarrer

```sh
npm start
```

Aperçu sur http://127.0.0.1:4318 avec classement temporaire en mémoire.

```sh
npm run serve
```

Application et classement persistant sur http://127.0.0.1:4319 ; base `data/mathelio.sqlite`, exclue de Git. Configuration : `PORT`, `MATHELIO_DB`, `MATHELIO_PUBLIC`. En production, Nginx sert les fichiers publics et relaie `/api/` vers ce service. Voir [DEPLOIEMENT.md](DEPLOIEMENT.md).

## Jouer

### Aides pour apprendre à son rythme

Dans Réglages, six interrupteurs indépendants activent le mode calme, le tableau de numération, les pièces de base dix, la correction par étapes, les grands chiffres/boutons et l’écran épuré. Le mode calme utilise l’entraînement et le passage manuel ; les corrections par étapes désactivent également le passage automatique. Doom conserve ses règles, ses contrôles de temps et ne propose pas les aides de calcul.

Le tableau aligne les opérandes et la réponse saisie dans les colonnes CM/DM/M/C/D/U/d/c. Le matériel représente les entiers de 0 à 9 999 ; cliquer une pièce la sélectionne pour compter, et les échanges d’un paquet contre dix pièces (ou l’inverse) préservent la quantité. L’affichage est limité à 200 pièces après échanges. Les corrections décomposent un calcul après validation, une étape à la fois. Toutes ces préférences restent propres au navigateur ; aucune lecture audio n’est ajoutée.

### Repères de numération

Dans Réglages, une couleur peut être choisie pour les unités, dizaines, centaines et milliers parmi huit couleurs sombres contrastées sur un fond blanc. Un aperçu, un bouton de réinitialisation et une option de lettres U/D/C/M complètent le menu. Les décimales restent noires ; les lettres d/c/m distinguent dixièmes, centièmes et millièmes. Pour les nombres à cinq ou six chiffres, DM/CM utilisent respectivement les couleurs des dizaines/centaines.

Les calculs, corrections et l’aperçu de la réponse saisie utilisent ces repères. Le champ de saisie reste un champ standard : sa valeur n’est ni transformée ni limitée par l’affichage coloré. Les lecteurs d’écran reçoivent le nombre complet, sans les lettres décoratives. Les préférences sont propres au navigateur, partagées entre profils, et distinctes des sauvegardes des profils. Le mode Guerre des champs propose également le menu et colore les aires des champs ; les lettres ne sont pas affichées à l’intérieur des petites cases.

### La guerre des champs

Accessible depuis l’accueil ou `fields.html`. Deux joueurs sur le même écran ou un joueur contre l’ordinateur, sur une grille de 23 × 15 avec deux fermes et un arbre central. Les deux dés définissent les dimensions du rectangle, que l’on peut tourner. Le joueur choisit un emplacement puis calcule l’aire avant de valider. Un indice propose un emplacement légal.

Les champs se touchent par un côté, sans chevauchement ni occupation des fermes ou de l’arbre. Deux tours bloqués consécutifs terminent la partie ; un placement remet ce compteur à zéro. Cette précision et le contact par un côté explicitent les règles papier. Les trois critères A/P/R rapportent chacun un point, aux deux joueurs en cas d’égalité. P est la somme des périmètres de chaque rectangle. Les scores peuvent être calculés par les enfants, avec correction, ou affichés directement.

Les parties restent temporaires dans cette page et ne modifient ni les profils ni le classement commun. L’ordinateur suit les mêmes règles et privilégie une progression vers le centre.

- Parcours CM1 : quatre opérations, mélange équilibré, trois difficultés et tables spécifiques.
- Petits explorateurs (5–6 ans) : chiffres et somme ≤ 10 ; chiffres et somme de 10 à 18 ; compléments à 20. Aide visuelle par points. Aucun bonus de rapidité ni chronomètre affiché dans ce parcours.
- Entraînement de 5, 10 ou 20 questions ; défis classés de 10 questions. Une table spécifique contient dix calculs distincts : une séance de vingt questions comprend deux passages.
- Une seconde tentative après la première erreur en entraînement. Un calcul raté revient après trois autres questions si la séance le permet, sinon à la fin. Une reprise est ajoutée au plus une fois par calcul et n'entre pas dans le taux de précision. Les erreurs non résolues restent disponibles pour les séances suivantes, dans la limite de 300.
- Question suivante après 5 secondes, option désactivable, bouton manuel conservé. Le délai et le temps de réponse s'arrêtent pendant les pauses ; la lecture des corrections est exclue du temps de réponse.
- Douze profils locaux maximum, six compagnons emoji, douze accessoires, vingt-quatre badges et douze trophées permanents. Les nouveaux compteurs commencent avec la v2 ; les récompenses v1 restent acquises.
- Mission facultative persistante, changeable, avec deux étoiles attribuées une seule fois par mission accomplie. Après changement, une nouvelle mission peut être réalisée.
- Bilan parent : précision par opération, tables sous 80 %, dix dernières séances, filtre par parcours. Historique limité aux 200 dernières séances depuis la v2. Ce bilan n'est pas protégé par un mot de passe.
- Après trois séances comparables, suggestion de difficulté supérieure à partir de 90 % de réussite, ou inférieure sous 50 %. Le joueur doit accepter la suggestion.

## Mode secret Doom

Cliquer cinq fois sur le logo, avec moins de deux secondes entre deux clics, ouvre le défi pour les parents. Un profil doit être sélectionné. Dix calculs distincts comportent deux à cinq nombres, avec additions, soustractions et multiplications. Les parenthèses précisent l’ordre des opérations.

Chaque question dispose de 30 secondes, sans pause, même si l’onglet est masqué. Une réponse hors délai rapporte zéro point et révèle la correction. La correction est exclue du temps de réponse ; elle peut être mise en pause. Le passage automatique après cinq secondes reste désactivable et le bouton manuel reste disponible.

Les records Doom sont séparés dans les classements personnel et commun. Ces parties ne modifient ni les étoiles, ni les missions, ni le bilan parent de l’enfant. Le classement commun vérifie aussi le délai côté serveur.

## Musique

Les MP3 fournis sont inclus dans `assets/audio`. `launch.mp3` ouvre le jeu ; chaque partie normale choisit ensuite un morceau parmi launch et les six backgrounds, sans répétition immédiate. Doom possède sa musique en boucle et son effet de validation. Une variante de victory joue à chaque fin de partie, suivie de badge si une récompense est obtenue. Mute global, deux volumes et deux interrupteurs musique/effets sont mémorisés. La musique démarre après une interaction et s'arrête en arrière-plan. Voir [la convention audio](assets/audio/README.md) pour les chemins et les règles de lecture. Aucun titre n'apparaît dans le jeu.

## Scores

Bonne réponse en défi : 100 points, 0–20 points de vitesse (CM1 et Doom), et 0–30 points de combo. Les étoiles valorisent les séances terminées et la précision, pas la rapidité. Les missions rapportent deux étoiles supplémentaires.

L'onglet personnel affiche uniquement les scores du profil actif, avec dix résultats par réglage. Le classement commun garde un meilleur résultat par identité locale, parcours, opération, niveau et table. Le serveur génère les questions, vérifie chaque réponse, calcule le score et mesure le temps actif. Il refuse les réponses rejouées et les parties d'une autre identité. Les sessions expirent après une heure et ne survivent pas au redémarrage du serveur ; les scores validés persistent dans SQLite.

Le classement n'est pas un système de compétition inviolable : les robots, comptes multiples et calculs pendant une pause restent possibles. Il n'y a ni compte avec mot de passe ni synchronisation de profils entre appareils. La participation publique est désactivée par défaut, activable dans Réglages. Le pseudo, score, précision, durée et date sont publics une fois publiés. Une identité est propre au profil et au navigateur ; son secret n'est jamais exporté avec les profils. Un import crée donc une nouvelle identité si la participation est activée ensuite. Désactiver la participation n'efface pas les résultats déjà publiés.

Une perte de connexion pendant un défi permet de terminer localement. Si la réponse finale a été traitée avant la coupure, le résultat peut déjà être publié ; vérifier le classement commun. Les résultats locaux antérieurs ne sont pas envoyés rétroactivement.

## Sauvegardes et diagnostic

Les clés locales `mathelio.state.v1` (format étendu compatible), `mathelio.preferences.v1`, `mathelio.credentials.v1` et `mathelio.logs.v1` restent propres à l'origine du site. Les anciens profils sont conservés et normalisés. Une sauvegarde illisible ouvre une session temporaire sans écraser les données existantes. Deux onglets modifiant les profils déclenchent un avertissement et bloquent les écritures de l'onglet ancien.

Réglages permet d'exporter tous les profils, puis d'importer un fichier v2 validé de moins de 20 Mo. Les profils sont ajoutés, sans remplacement ; la limite totale reste douze. Les secrets du classement et les préférences sonores ne font pas partie de l'export. Ne partager ce fichier qu'avec une personne autorisée à voir les historiques.

`logs.html` conserve 200 erreurs/avertissements locaux, avec filtre et export. Les requêtes API n'y enregistrent ni pseudo ni réponses. Le serveur journalise ses erreurs dans journald ; Nginx possède ses journaux d'accès et d'erreurs. Rien n'expose les logs système via la page publique.

## Vérifications

```sh
npm test
```

Tests des calculs, niveaux juniors, saisie, score, audio, import, révisions, missions, stockage, authentification des parties, refus des réponses répétées, pauses serveur et persistance SQLite. GitHub Actions vérifie Node 22 et 24, puis la syntaxe des scripts de déploiement.

Code : https://github.com/Naod6473/Mathelio

Les parcours disponibles sont CP, CM1 et CM2. Le CP propose additions, soustractions sans résultat négatif et un mode mixte équilibré ; au niveau difficile, les additions sont des compléments à 20. Le CM2 propose les quatre opérations et un mode mixte, avec des nombres plus grands, des décimaux au dixième puis au centième et des multiplications à deux chiffres. Les records, bilans et révisions restent séparés par parcours.
