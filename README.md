# Mathélio

Application de calcul mental pour un enfant de CM1. HTML, CSS et JavaScript natifs, sans compilation, dépendance, compte externe ni appel réseau. Version 1.0.0.

## Ouvrir l’application

Ouvrir `index.html` directement fonctionne. Pour conserver une origine de stockage stable et tester comme sur un serveur, utiliser de préférence un serveur HTTP :

```sh
npm start
```

Puis ouvrir http://127.0.0.1:4318. Node.js est uniquement nécessaire pour cet aperçu et les tests ; il n’est pas nécessaire sur l’hébergement final.

## Fonctionnalités

- Profils locaux (12 maximum), six compagnons, douze accessoires débloqués tous les dix points d’étoiles et douze badges.
- Entraînement sans pression, seconde tentative et correction ; défi avec score, bonus de rapidité limité et combo plafonné.
- Dix calculs distincts, opérations séparées ou mélange équilibré, trois niveaux et sélection d’une table.
- Bilan, révision des erreurs, clavier tactile et physique, virgule et point acceptés.
- Classements des dix meilleurs défis par opération, niveau et sélection de table.
- Pause manuelle et automatique quand l’onglet est masqué ; aucune limite de temps imposée.
- Page `logs.html` : erreurs JavaScript, promesses rejetées, échecs de ressources et de sauvegarde, filtre, export JSON, effacement et test du journal.

## Règles

Les additions faciles restent sous 100, sans retenue. Les soustractions faciles sont sans emprunt. Le niveau moyen inclut les retenues et des additions jusqu’à 200. Le niveau difficile utilise des dixièmes pour addition/soustraction ; les calculs sont préparés en unités entières pour éviter les erreurs flottantes. Aucun résultat négatif, aucune division par zéro ou avec reste.

Tables faciles : 2, 5, 10 ; moyennes : 2 à 9 ; difficiles : 11, 12, 15, 20, 25. Une table précise (2 à 12) remplace ce choix et possède son classement distinct.

Une bonne réponse au premier essai en défi vaut 100 points, plus 0 à 20 points de vitesse et 0 à 30 points de combo (5 par bonne réponse consécutive supplémentaire). L’évaluation dépend seulement de la justesse. Une partie terminée rapporte 3 étoiles, plus 1 pour au moins 80 % de réponses correctes au premier essai. Une révision qui corrige au moins une erreur rapporte une étoile supplémentaire. Les révisions ne sont pas classées.

## Données et diagnostic

`mathelio.state.v1` et `mathelio.logs.v1` sont stockés dans localStorage. Rien n’est envoyé à un serveur. Les données sont propres au navigateur **et à l’origine** (protocole, domaine, port) : changer d’adresse ne transfère pas la progression. Effacer les données du navigateur les supprime. Le mode privé peut les rendre temporaires.

Si une sauvegarde est invalide, l’application préserve la valeur existante et ouvre une session temporaire. Si le stockage est inaccessible, le jeu continue en mémoire avec un avertissement. Un changement provenant d’un autre onglet suspend la sauvegarde de l’onglet courant et invite à le recharger.

Le journal conserve 200 événements au maximum ; les paramètres des URL HTTP sont retirés. Vérifier les exports avant de les partager. Ce journal est un outil de diagnostic local, pas une surveillance centralisée ni un journal des accès serveur. Il ne peut pas capturer ses propres échecs de chargement. Les scores locaux sont modifiables par l’utilisateur et ne constituent pas un classement sécurisé.

## Tests

```sh
npm test
```

Tests de génération de calculs, unicité, limites, équilibre, divisions exactes, saisie décimale et points. Aucun téléchargement nécessaire.

## Dépôt et hébergement

Le code source est disponible sur [GitHub : Naod6473/Mathelio](https://github.com/Naod6473/Mathelio). Les vérifications automatiques s’exécutent à chaque envoi et pull request. Aucun hébergement de production n’est configuré. Voir `DEPLOIEMENT.md` pour les fichiers à servir et les décisions à prendre concernant LXC/VM et les mises à jour.
