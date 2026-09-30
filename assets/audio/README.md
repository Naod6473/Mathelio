# Audio Mathélio

Les fichiers fournis sont enregistrés dans les dossiers suivants :

- `music/launch.mp3` : premier morceau à chaque ouverture, après la première interaction autorisant le son.
- `music/background-01.mp3` à `background-06.mp3` : musique du jeu normal. Chaque nouvelle partie choisit un morceau aléatoire parmi ces fichiers et `launch.mp3`, sans répétition immédiate. La lecture continue avec une liste mélangée.
- `doom/doombackground.mp3` : musique en boucle dès l’accès à l’écran Doom par cinq clics sur le logo ; elle continue sans repartir de zéro au lancement de la partie.
- `doom/doom-01.mp3` : validation de chaque question Doom, juste, fausse ou expirée.
- `sfx/click.mp3`, `sfx/error.mp3` : clic et erreur du jeu normal.
- `sfx/succes-01.mp3` à `succes-03.mp3` : bonne réponse normale, variante aléatoire.
- `sfx/victory-01.mp3` et `victory-02.mp3` : chaque partie terminée, variante aléatoire.
- `sfx/badge-01.mp3` et `badge-02.mp3` : récompense obtenue, variante aléatoire après le son de fin.

Les chemins complets sont déclarés dans `manifest.json`, depuis `assets/audio/`. Conserver l’orthographe `succes` des fichiers. Aucun titre musical n’est affiché. Les noms acceptent minuscules, chiffres et tirets ; formats MP3, WAV ou OGG.

Mute global, volumes et interrupteurs musique/effets sont mémorisés. La musique s’arrête lorsque l’onglet est masqué. En quittant Doom, la musique normale reprend. Un fichier manquant est signalé dans le diagnostic sans bloquer le jeu.

Le logo se trouve dans `assets/images/logo.png`, à côté du texte Mathélio dans l’en-tête. Ajouter les fichiers au dépôt pour les inclure dans les mises à jour.
