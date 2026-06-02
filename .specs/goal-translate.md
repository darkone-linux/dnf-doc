# Objectif — `just translate` : traductions incrémentales par agents

Tous les fichiers à traiter sont rangés dans des répertoires `doc/src/content/docs/<lang>` ; pour
le moment nous avons `fr` et `en`. Parmi ces fichiers, il y a des fichiers **main** et des fichiers
**translated-from**. Tous les fichiers `translated-from` sont rattachés à un fichier `main` d'une
autre langue. Le contenu de chaque fichier est divisé en paragraphes, tous les paragraphes sont
séparés par les titres (`^#+ .*$`). Le contenu de chaque paragraphe (trimmé), ainsi que le contenu
du header entre `---`, ont un hash **blake3** calculé.

- `t:main` -> fichier principal (source de traduction)
- `t:translated-from fr` -> fichier traduit, depuis le fichier principal correspondant en langue `fr` (paramétrable)
- `t:h` -> hash blake3 du header du fichier **main** (recopié à l'identique dans les translated)
- `t:p` -> hash blake3 d'un paragraphe **source** du main (titre + contenu, ou haut de fichier avant
  le premier titre). **Identique** dans le main et tous ses translated : c'est l'ID stable qui relie
  une traduction à son paragraphe source.

Placement des tags **uniforme** entre main et translated : le bloc `t:<role>` + `t:h` est placé
**avant** les imports, puis chaque paragraphe est précédé de son `{/* t:p <hash> */}`.

Exemple `doc/src/content/docs/en/doc/admin-guide.mdx` (imaginons que c'est lui le `main`) :

```mdx
---
title: Administrator Guide
sidebar:
  order: 3
lang: en
---

{/* t:main */}
{/* t:h 402f0c5bb7016ae5f6008a4f3d186752b1d59bfb3036ffb7961816e6c54d699c */}

import { Steps } from '@astrojs/starlight/components';

{/* t:p 8a341961f6b9bda1c1e4e77272464744261812068628f107b4326e2a4320c086 */}
This section is dedicated to administrators.


{/* t:p 6ec6f033b2626004663bc0a516fde225cc9606cce2fee558c06f5387ef3b65c2 */}
## Preparation

We will install in order:

1. a machine (the administrator's),
2. a gateway and other machines in the same zone,
3. the tailnet network (coordination server),
4. other zones linked to our configuration.

:::note[Unique Configuration]
All these nodes will be described in a single NixOS configuration on the administrator's machine, from which
we can update and evolve the entire network and its machines.
:::
```

Exemple correspondant `doc/src/content/docs/fr/doc/admin-guide.mdx` (`translated-from en`) :

```mdx
---
title: Guide de l'administrateur
sidebar:
  order: 3
lang: fr
---

{/* t:translated-from en */}
{/* t:h 402f0c5bb7016ae5f6008a4f3d186752b1d59bfb3036ffb7961816e6c54d699c */}

import { Steps } from '@astrojs/starlight/components';

{/* t:p 8a341961f6b9bda1c1e4e77272464744261812068628f107b4326e2a4320c086 */}
Cette section est dédiée aux administrateurs.

{/* t:p 6ec6f033b2626004663bc0a516fde225cc9606cce2fee558c06f5387ef3b65c2 */}
## Préparation

On va installer dans l'ordre :

1. une machine (celle de l'administrateur),
2. une passerelle et d'autres machines dans la même zone,
3. le réseau tailnet (serveur de coordination),
4. d'autres zones liées à notre configuration.

:::note[Configuration unique]
L'ensemble de ces noeuds seront décrits dans une unique configuration NixOS sur la machine de l'administrateur, à partir de laquelle
on va pouvoir mettre à jour et faire évoluer tout le réseau et ses machines.
:::
```

## Règles

- Si 2 fichiers orphelins (qui ne sont ni `main` ni `translated-from`) concordants existent (même
  chemin sauf la langue), le `main` est le `fr` par défaut (paramétrable `mainLang`).
- S'il existe 1 seul fichier orphelin, il devient `main` et devra être traduit dans les autres langues.
- Les rôles déjà tagués (`t:main` / `t:translated-from`) sont respectés et non réécrits.
- Les déclarations d'imports juste après le header (le « préambule ») ne font pas partie d'un
  paragraphe et ne sont pas hashées.
- Les lignes de tags `{/* t:... */}` sont ignorées dans le calcul des hashs.
- Les noms de fichiers sont tous en anglais ; les fichiers correspondants partagent le même chemin,
  seule la langue change. Pas d'inventaire : les langues sont découvertes par les sous-dossiers de
  `src/content/docs/`.

## Étape 1

Transformer tous les fichiers `.md` en `.mdx` dans `doc/src/content/docs/` (afin de pouvoir mettre
des commentaires de tags).

## Étape 2

Créer un script `scripts/update-tags.mjs` qui parse tous les fichiers mdx dans
`doc/src/content/docs/` en commençant par les `fr` (langue principale) puis tous les autres. Si le
fichier est orphelin et qu'il n'a pas de `main` dans une autre langue, il devient `main`. S'il a un
`main` dans une autre langue, il devient `translated-from xxx`, `xxx` étant la langue du fichier
`main` correspondant. Pour chaque fichier main, le script localise les paragraphes puis met à jour ou
crée les hashs de chacun d'eux. Il crée le tag `translated-from` des fichiers orphelins translated
mais **pas les hashs** !

## Étape 3

Créer un script `scripts/translate.mjs` qui fait ceci :

- Parse `doc/src/content/docs/` et repère tous les fichiers `main`.
- Pour chaque fichier main, crée s'il le faut, puis ouvre les fichiers `translated`.
- Pour chaque fichier translated, on regarde les tags :
  - Si le tag existe déjà dans `main`, alors la traduction est à jour.
  - Si le tag n'existe plus dans `main`, alors le paragraphe doit être traduit ou supprimé (il est
    supprimé pour être retraduit ou pas).
- Les tags à mettre à jour sont inscrits dans le fichier `translated` et le script ordonne à un agent
  IA de traduire tous les paragraphes « vides » (aller chercher dans main le contenu de ces
  paragraphes et les traduire dans la langue sous chaque tag).
- À la fin, il doit y avoir les mêmes tags dans `main` et ses `translated-from`.

## Étape 4

Créer la recette `just translate` qui lance l'ensemble du processus (update-tags puis translate).

## Paramètres

Tous les paramètres sont rassemblés dans un fichier de configuration unique
`scripts/translate.config.mjs` (overrides possibles par variables d'environnement) :

- `docsDir`, `mainLang` (défaut `fr`)
- outil agent : **`claude`** (défaut) ou `opencode`
- modèle : **`claude-haiku-4-5`** (défaut)
- `concurrency` (agents en parallèle, 1 par fichier), `timeout`
- templates de prompt des agents (traduction de paragraphes + du titre du header)

Hashs blake3 calculés via **`@noble/hashes/blake3`** (pur JS, pas de binaire natif).

## À noter

- Il faut absolument que les liens internes fonctionnent ! Le préfixe de locale `/<langSrc>/` est
  réécrit vers `/<langCible>/` ; les autres liens restent intacts.
- Il peut y avoir des fichiers en plus ou en moins, les scripts s'adaptent, il n'y a pas d'inventaire.
- Les agents IA peuvent être lancés en parallèle (1 par fichier), nombre paramétrable.
- Créer des tests unitaires (`node:test`) au fur et à mesure !
