# Audio Mathélio

Les WAV fournis sont de courtes mélodies et effets synthétisés pour cette application, sans échantillon externe. Leur générateur reproductible est `tools/generate-audio.py`.

Le navigateur démarre la musique au premier toucher ou à la première touche. `launch.wav` passe une fois à chaque ouverture, puis les morceaux de fond sont mélangés sans répétition immédiate lorsqu’au moins deux sont disponibles. La musique est suspendue quand la page est masquée. Les réglages et le mute sont mémorisés par navigateur.

## Remplacer les sons

Déposer les fichiers dans `assets/audio/music/` ou `assets/audio/sfx/`, puis modifier `manifest.json`. Les noms utilisent des minuscules, chiffres et tirets. Formats acceptés : `.mp3`, `.wav`, `.ogg`.

Convention conseillée : `music/launch.mp3`, `music/background-01.mp3`, `music/background-02.mp3`, `sfx/click-01.mp3`, `sfx/success-01.mp3`, `sfx/error-01.mp3`, `sfx/badge-01.mp3`, `sfx/finish-01.mp3`. Les chemins du manifeste commencent par `assets/audio/`. Plusieurs variantes peuvent être indiquées dans chaque liste d’effets. Aucun titre musical n’est affiché dans le jeu.

Les fichiers doivent être ajoutés au dépôt pour être déployés. Utiliser des fichiers dont la diffusion publique est autorisée. Un fichier musical manquant est ignoré et enregistré dans le diagnostic, sans bloquer la partie.
