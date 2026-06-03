# Plan de réorganisation de la documentation

## Objectif

- Avoir des sections claires et séparées pour chaque type d'usager (utilisateurs - non-technicien, administrateur - technicien, développeur / agent de développement).
- Une organisation hierarchique claire :
  - Les pages d'entrée sont une introduction suivi de paragraphes de liens (sauf pour la section "guide de l'utilisateur" qui doit maintenir une présentation convaincante de l'outil, ainsi que "introduction.mdx").
  - Puis on va de l'information de la plus générique (pages principales) aux informations les plus spécifiques (feuilles).
- Règles pour une écriture guidée de la documentation par des agents IA, qui se chargeront de comprendre comment fonctionne un sujet ou de quoi se compose tel ou tel élément, afin de proposer une documentation claire.
- Des règles de rédaction permettant d'aller droit au but et de répondre au besoins : 
  - Guide Utilisateur : donner envie d'utiliser, le moins de bla bla possible, rédaction positive et style travaillé.
  - Guide Administrateur : toutes les informations dont il a besoin pour effectuer des tâches, comprendre ce qu'il fait et réparer en cas de problème.
  - Guide du développeur : organisation hierarchique permettant de comprendre l'architecture applicative (ou se trouve quoi), jusqu'au détail, (ex: comment créer un module). Explications étape par étape. 
- Mise à jour automatique par les agents : quand une tâche de développement est terminée, permettre à l'agent de trouver tout de suite où il doit modifier / créer du contenu pour étoffer la documentation. 
- FAQ transversale : la page d'accueil de la FAQ contient des liens vers des petites pages "how-to", qui expliquent des sujets transverses importants. (ex. pour les développeurs: règles de rédaction des headers de page de code).

## 1. Points de départ

Note importante: déplacer les fichiers et leur contenu de manière à maintenir au maximum la correspondance des tags de traduction. Sur cette étape on ne corrige pas le contenu existant, on le déplace et on l'étoffe.

Note importante 2: on déplace le contenu des deux langues en même temps, sauf contre-indication.

A partir de l'existant :

- doc/admin-guide.mdx
  - Déplacer le contenu dans doc/admin-guide/first-network-installation.mdx
  - Créer une intro puis un paragraphe "# Installations initiales"
- doc/introduction.mdx -> on laisse comme c'est.
- doc/specifications.mdx -> supprimer.
- doc/user-guide.mdx -> réorganiser comme suit :
  - doc/user-guide.mdx -> laisser l'introduction
- doc/how-to.mdx -> a étoffer, page d'accueil avec titres thématiques et liens vers des pages "how-to" situées dans doc/how-to/xxx.mdx. On distinguera les how-to pour utilisateurs, administrateurs, développeurs. Petits sujets transverses.
- doc/dev-guide.mdx -> "Guide du développeur", section à créer, informations hierarchisées. A destination des agents IA et des développeurs : règles de développement, architecture de projet, grands sujets techniques. 
- ordre des grandes sections : introduction, user-guide, admin-guide, dev-guide. 

## 2. Réflexion de fond

- Etudier le projet /etc/nixos, en particulier le README, la structure, les fonctionnalités - dans sa globalité (pas d'étude détaillée !). 
  - Pour chaque grandes sections, déterminer les sujets importants. 
  - Les organiser selon les sections : hierarchie, ordre des sujets.
  - Sujets transverses à mettre dans "how-to".
  - Générer un titre et une phrase d'introduction pour chacun d'eux, en français.

## 3. Règles d'écriture, outils et skills pour agents de rédaction

Définir des règles d'écriture permettant : 

- Des pages de documentation aérées, claires, belles. 
- Règles de forme :
  - Limite du nombre de titres par page (7 par niveau) et de profondeur (3 max), scinder s'il le faut.
  - Préférer des informations visuelles :
    - Mon contenu peut-il être organisé par étapes ? -> créer des Steps
    - Mon contenu peut-il etre expliqué avec un diagramme -> créer un diagramme (cf. skill)
    - Mon contenu est-il une remarque informative, tip, caution, danger ? -> créer un callout
  - Ne pas mettre que des infos visuelles, aérer avec des titres et paragraphes courts.
  - Callouts :
    - Toujours leur mettre un titre explicite.
    - Les utiliser à bon escient, ne pas en abuser.
  - Cards : uniquement pour la partie "guide utilisateur", préférer des liens simples sinon. 
  - Admin / Dev : contenu simple, précis et concis.
  - Proposer d'autres règles de forme pour une belle documentation.

Outils et skills :

- Skill de création de diagrammes :
  - Déterminer un outil (openflowkit ? mcp-mermaid ?)
  - Doit avoir une charge graphique commune.
  - Doit être lisible par n'importe quel agent (diagram as code).
  - Doit être beau quand il est généré sous forme d'image.
  - Créer un skill permettant aux agents de créer leur diagramme en le décrivant.
- Autres skills ?
  - Croiser ces informations :
    - Règles d'écriture
    - Contenus à générer
    - Possibilités avec Starlight et Astro
  - Déterminer
    - Quels skills seraient pertinents
    - Ce qu'il faut plutôt mettre dans les règles

Créer des règles pour les agents dans AGENTS.md (à la racine du projet)

- Règles courtes, style télégraphique
- Uniquement les règles globales, à observer quelque soit la tâche à exécuter
- Pas plus de 200 lignes, dans l'idéal 100 à 150
- Contenu :
  - Règles d'organisation des données, comment déterminer où mettre quoi
  - Règles de forme importantes
  - Skills et outils à disposition

## 4. Génération de la structure

Important : on ne fait que la partie française (fr/doc), car la partie anglaise sera automatiquement traduite par les agents de traduction.

- Générer les pages principales, leur contenu et liens vers les pages secondaires.
- Générer les pages secondaires, avec une petite introduction (pas de détail).
- Repecter les règles d'écriture définies précédemment.

## 5. Essais

Commencer à créer du contenu et à le visualiser. Regarder ce qui va, ce qui ne va pas. 

- Lancer un `just dev` qui lance le site sur `http://localhost:4321/` et donne des informations sur les pages crées en sortie standard.
- Se mettre à la place d'un agent rédaction, créer une page sur un sujet.
- Observer le résultat. 
- Le critiquer, améliorer :
  - Généré avec succès ?
  - Respecte-t-il les règles ?
  - Est-ce que les skills fonctionnent ?
- Créer d'autres pages s'il le faut, pour tester l'ensemble des règles.


