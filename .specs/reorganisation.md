# Plan de réorganisation de la documentation

## Objectif

Réorganiser la documentation DNF (`dnf-doc`, Astro + Starlight) pour qu'elle soit :

- **Segmentée par persona** (voir §0) : chaque type d'usager trouve sa section.
- **Hiérarchique et lisible** : du générique (pages d'entrée) au spécifique (feuilles).
- **Rédigeable par des agents IA** : règles claires sur _où_ mettre quoi et _comment_ écrire.
- **Maintenable automatiquement** : à la fin d'une tâche de dev, un agent doit trouver
  immédiatement où créer/étoffer le contenu.

Principes d'organisation :

- Les **pages d'entrée** = une introduction + des paragraphes de liens, sauf
  `introduction.mdx` et le guide utilisateur, qui gardent une présentation convaincante.
- Ordre des grandes sections : **introduction → user-guide → admin-guide → dev-guide**.
- **FAQ / how-to transversale** : une page d'accueil `how-to.mdx` avec des titres
  thématiques pointant vers de petites pages rangées par persona dans
  `how-to/user/`, `how-to/admin/`, `how-to/dev/` (sujets transverses courts).
  Ex. dev : « règles de rédaction des headers de code ».

---

## 0. Conventions & périmètre

**Chemins.** Toute notation `doc/xxx.mdx` dans ce document désigne le fichier réel
`src/content/docs/<lang>/doc/xxx.mdx` (avec `<lang>` ∈ `fr`, `en`). La sidebar est
générée par `autogenerate` sur les dossiers `doc/` et `ref/` (`astro.config.mjs:62-73`).

**Convention page / section.** `doc/<section>.mdx` = page d'entrée d'une section ;
`doc/<section>/<feuille>.mdx` = pages de détail (feuilles). Créer un dossier crée une
sous-section dans la sidebar.

**Nommage des fichiers / slugs : en anglais.** Comme l'existant (`admin-guide`,
`user-guide`, `first-network-installation`). URLs stables et identiques fr/en, liens
internes simples. Seuls les **titres** et le **contenu** sont en français côté `fr/`.

**Ordre de la sidebar.** L'autogenerate ne respecte pas l'ordre voulu par défaut. Pour
imposer `introduction → user → admin → dev`, utiliser le frontmatter
`sidebar.order: <n>` sur chaque page d'entrée (et sur les feuilles si besoin).

**Langues — règle unique.**
- **Déplacement de l'existant** (§2) : on déplace le contenu des **deux langues** en même
  temps, pour préserver la correspondance des tags de traduction.
- **Créer du neuf** (§4) : on ne crée qu'en **français** (`fr/doc`) ; l'anglais est
  produit ensuite par `just translate` (ne pas l'utiliser ici).

**Tags de traduction — ne pas toucher à la main.** Les marqueurs `{/* t:* */}` sont
gérés par les scripts. Lors d'un déplacement : déplacer le fichier **tel quel** (avec ses
tags), ne jamais recopier/réécrire le contenu manuellement, puis lancer `just tags` pour
rafraîchir l'état. Idem `*/ref/modules.mdx` est généré (`just codegen`) — ne pas l'éditer.

**Hors-scope.** Ne pas modifier : `ref/` (généré), `changelog`, `thanks`. On ne réécrit
**pas** le fond du contenu existant pendant le déplacement (§2) — on déplace et on étoffe
la structure seulement.

**Personas.**
- **Utilisateur** (non-technicien) : veut utiliser les sevices - outils - postes linux, sans jargon.
- **Administrateur** (technicien) : installe, exécute des tâches, comprend, répare.
- **Développeur / agent IA** : comprend l'architecture, contribue, crée ou modifie des fonctionnalités.

---

## 1. Réflexion de fond (à faire AVANT de déplacer)

Décider la cible avant de bouger les fichiers.

- Étudier le projet `/etc/nixos` **dans sa globalité** (README, structure, fonctionnalités) —
  **pas** d'étude détaillée.
- Pour chaque grande section, déterminer les **sujets importants**.
- Les organiser : hiérarchie + ordre des sujets ; sujets transverses → `how-to`.
- Pour chacun : générer un **titre** et une **phrase d'introduction**, en français.
- Produire en sortie la **liste des feuilles** par section (notamment le découpage de
  `user-guide` — voir §2), qui alimentera le mapping et la génération (§4).

Notes :

- La structure et le contenu devra être éditable / gérée par des agents IA ou humains.
- Les futurs agents IA pour la doc auront les rôles suivants, il peut être utile de séparer les instructions en fonction de leur rôle (§3) : 
  - Rédacteur -> étudie le sujet, rédige.
  - Améliorateur -> améliore la forme, propose d'autres manières d'expliquer.
  - Correcteur -> orthographe, grammaire, lisibilité.
  - Réorganisateur -> étudie la cohérence du plan, détecte des doublons, sujets à déplacer, propose des améliorations.

---

## 2. Points de départ — mapping de l'existant

On déplace et on étoffe la structure, **sans corriger le fond**, dans **les deux langues**
(voir règle §0). Après les déplacements : `just tags` -> vérifier que les hashs restent les mêmes.

| Existant | Action | Cible |
| --- | --- | --- |
| `doc/admin-guide.mdx` | Déplacer le contenu + créer une intro et un titre `# Installations initiales` | `doc/admin-guide.mdx` (intro + liens) ; contenu → `doc/admin-guide/first-network-installation.mdx` |
| `doc/user-guide.mdx` | Garder l'**intro** ; éclater le reste en feuilles | `doc/user-guide.mdx` (intro convaincante) ; reste → `doc/user-guide/<sujet>.mdx` (sujets définis en §1) |
| `doc/how-to.mdx` | Étoffer : page d'accueil avec titres thématiques + liens, distinguant les personas | `doc/how-to.mdx` + sous-dossiers `doc/how-to/{user,admin,dev}/<sujet>.mdx` |
| `doc/introduction.mdx` | Inchangé | `doc/introduction.mdx` |
| `doc/dev-guide.mdx` | **Créer** la section « Guide du développeur » : règles de dev, architecture projet, grands sujets techniques, étape par étape ; destinée aux agents IA et aux devs | `doc/dev-guide.mdx` + `doc/dev-guide/<sujet>.mdx` |
| `doc/specifications.mdx` | **Supprimer les deux langues** (fr placeholder + en obsolète). D'abord vérifier les liens entrants (`just check-links`, recherche dans `src/`) et les rediriger/retirer, **puis** supprimer | — (supprimé fr + en) |

Appliquer `sidebar.order` sur les pages d'entrée pour fixer l'ordre §0.

---

## 3. Règles d'écriture, composants et skills

### Règles de rédaction par persona

- **Guide utilisateur** : donner envie, le moins de bla-bla possible, ton positif, style
  travaillé.
- **Guide administrateur** : toutes les infos pour installer, maintenir, agir, comprendre et **réparer**.
  Contenu simple, précis, concis.
- **Guide développeur** : hiérarchie permettant de comprendre l'architecture (où se trouve
  quoi) jusqu'au détail (ex. créer un module). Explications étape par étape. Concis.

### Règles de forme

- Max **7 titres par niveau**, profondeur **3 max** ; au-delà, scinder en feuilles.
- Privilégier les **informations visuelles**, sans en abuser ; aérer avec titres et
  paragraphes courts. Pour chaque contenu, se demander :
  - Est-ce une suite d'étapes ? → `<Steps>`.
  - Est-ce explicable par un schéma ? → diagramme (voir skill).
  - Est-ce une remarque / tip / caution / danger ? → callout `<Aside>`.
- **Callouts (`<Aside>`)** : toujours un titre explicite ; usage parcimonieux.
- **Cards (`<Card>` / `<CardGrid>` / `<LinkCard>`)** : réservées au **guide utilisateur** ;
  ailleurs, préférer des liens simples.

### Composants Starlight de référence (MDX)

Import : `import { Steps, Card, CardGrid, LinkCard, Aside, Tabs, TabItem } from '@astrojs/starlight/components';`

```mdx
<Steps>
1. Première étape.
2. Deuxième étape.
</Steps>

<Aside type="tip" title="Titre explicite">Conseil court.</Aside>
<!-- type ∈ note | tip | caution | danger -->

<CardGrid>
  <LinkCard title="Installer DNF" href="/fr/doc/user-guide/" />
</CardGrid>

<Tabs>
  <TabItem label="NixOS">…</TabItem>
  <TabItem label="Flake">…</TabItem>
</Tabs>
```

### Skill diagrammes

- **Outil recommandé : Mermaid** (diagram-as-code, lisible par tout agent, rendu image
  propre). _Non encore installé_ → à ajouter (plugin Starlight / `rehype-mermaid`), avec
  une charte graphique commune.
- Créer un **skill** permettant à un agent de décrire son diagramme et de l'obtenir au bon
  format.

### Un skill par rôle d'agent

Les 4 rôles de §1 deviennent **4 skills distincts** ; les règles communes restent dans
`AGENTS.md` (chaque skill s'y réfère, sans dupliquer).

- **Rédacteur** : étudie le sujet, choisit la section/feuille cible, rédige selon §3.
- **Améliorateur** : améliore la forme, propose d'autres manières d'expliquer (visuels,
  Steps, diagrammes).
- **Correcteur** : orthographe, grammaire, lisibilité.
- **Réorganisateur** : cohérence du plan, doublons, sujets à déplacer, améliorations de
  structure.

### Autres skills ?

Croiser (règles d'écriture × contenus à générer × possibilités Starlight/Astro) pour
décider ce qui mérite un **skill** supplémentaire vs ce qui doit rester une **règle** dans
`AGENTS.md`.

### Règles agents dans `AGENTS.md` (racine du projet)

- Style **télégraphique**, **100–150 lignes** (200 max).
- Uniquement les **règles globales** valables quelle que soit la tâche/le rôle.
- Contenu : où mettre quoi (organisation des données), règles de forme clés, skills (dont
  les 4 skills de rôle) et outils à disposition.

---

## 4. Génération de la structure

**Français uniquement** (`fr/doc`) ; l'anglais sera produit par `just translate` plus tard.

- Générer les pages d'entrée : contenu + liens vers les feuilles.
- Générer les feuilles avec une **petite introduction** (pas de détail).
- Respecter les règles d'écriture du §3.

---

## 5. Essais

- Lancer `just dev` (site sur `http://localhost:4321/`, infos sur les pages en sortie).
- Se mettre dans la peau d'un **agent rédacteur** : créer une page sur un sujet réel.
- Observer, critiquer, améliorer :
  - Génération réussie ? Règles respectées ? Skills fonctionnels ?
- Créer d'autres pages au besoin pour couvrir l'ensemble des règles.

---

## 6. Definition of Done

- `just build` **vert** (aucune erreur).
- `just check-links` et `just test` **OK** (liens internes / ancres valides).
- `just tags` à jour (état de traduction cohérent, aucun tag édité à la main).
- Les **4 sections** présentes et **ordonnées** (introduction → user → admin → dev).
- Chaque fichier de §2 a bien atteint sa **cible unique** ; `specifications.mdx` supprimé
  (fr + en) sans lien cassé.
- Slugs en anglais ; how-to rangé en sous-dossiers `user/admin/dev` ; 4 skills de rôle
  prévus.
