# Sélection d'étage / bâtiment

## Description

Change l'étage ou le bâtiment affiché via un contrôle natif (une liste de boutons dans le bottom sheet de la feature), en s'appuyant sur `select_floor` — déjà partiellement exposé côté pont JS (`goToFloor`/`goToBuilding` dans `useVisioMap.ts`, géré côté WebView dans `visioOneHtml.ts`/`visioOne.html`) avant cette feature, mais jamais relié à une UI ni listé dans le menu.

Le SDK affiche **déjà lui-même** son propre sélecteur d'étage par défaut (option `floorSelector: true` dans `DEFAULT_OPTIONS`, visible sur la carte sans aucun code applicatif). Cette feature ne remplace pas ce widget — elle démontre que l'app peut **piloter elle-même** les changements d'étage/bâtiment depuis sa propre UI (utile pour un client qui veut son propre design de sélecteur, l'intégrer à une navigation existante, ou le piloter depuis un autre déclencheur que le widget du SDK).

`goToFloor(buildingId, floorId)` envoie `{ type: 'select_floor', data: { buildingId, floorId } }` ; côté WebView, `goToFloor` résout `buildingId`/`floorId` en objets `Building`/`Floor` réels (`venue.venueLayout.buildings`) puis appelle `view.goToFloor(floor)` (ou `view.goToBuilding(building)` si `floorId` est omis — c'est ce que fait `goToBuilding(buildingId)` côté pont, qui envoie le même type de message sans `floorId`).

## Step by step

1. **Obtenir la liste réelle des étages/bâtiments** — c'est la partie qui manquait. Rien dans le pont ne forwardait `venue.venueLayout.buildings` côté natif avant cette feature. Ajouté dans `setup()` (`visioOneHtml.ts`/`visioOne.html`), juste avant l'envoi du message `ready` :
   ```js
   const buildings = venue.venueLayout.buildings.map((building) => ({
     id: building.id,
     label: venue.translator.translateBuilding(building, venue.currentLocale).name,
     defaultFloorID: building.defaultFloorID,
     floors: building.floors.map((floor) => ({
       id: floor.id,
       label: venue.translator.translateFloor(floor, venue.currentLocale).name,
       levelIndex: floor.levelIndex,
     })),
   }))
   sendToNative({
     type: 'ready',
     data: { buildings, currentBuildingId: view.currentBuilding?.id, currentFloorId: view.currentFloor?.id },
   })
   ```
   `Floor`/`Building` n'ont pas de champ `label` propre (seulement `id`, `altitude`, `levelIndex` pour `Floor`) — le libellé humain vient de `venue.translator.translateBuilding()`/`translateFloor()`, la même source que celle utilisée par le widget natif du SDK. Ne jamais afficher un `id` brut comme libellé par défaut : les ids de venue ne sont pas garantis lisibles (ex. `bldg_a3f1`).
2. **Garder l'étage courant synchronisé**, y compris quand c'est le widget natif du SDK (pas l'UI de cette app) qui déclenche le changement — l'utilisateur peut très bien taper le sélecteur du SDK plutôt que celui de l'app, les deux coexistent sur le même écran. Écouté via l'event `currentfloorchanged` de la `View` :
   ```js
   v.addEventListener('currentfloorchanged', () => {
     sendToNative({
       type: 'floor_changed',
       data: { buildingId: v.currentBuilding?.id, floorId: v.currentFloor?.id },
     })
   })
   ```
3. **Côté natif** (`src/components/VisioMapView.tsx`), stocker `buildings`/`currentBuildingId`/`currentFloorId` dans un state `venueLayout`, alimenté par `ready` (valeur initiale) et mis à jour par chaque `floor_changed`. Ce state est transmis à `renderOverlay` en 4ᵉ paramètre, aux côtés de `bridge`/`status`/`clickedPois` déjà existants.
4. **Le composant consommateur** (`src/features/FloorSelectorOverlay.tsx`, branché dans `FeatureScreen.tsx` sous `slug: 'floor-selector'`) :
   - Résout le "bâtiment actif" = celui de `currentBuildingId`, ou le premier bâtiment de la venue si rien n'est encore sélectionné (repli demandé par la spec de la feature — jamais d'ID codé en dur).
   - Affiche une rangée de bâtiments (uniquement si `buildings.length > 1` — la plupart des venues de démo n'en ont qu'un) puis une liste verticale de boutons, un par étage du bâtiment actif, triés du plus haut (`levelIndex` décroissant) au plus bas.
   - Surligne le bouton dont `floor.id === currentFloorId` (et bâtiment actif === `currentBuildingId`).
   - Appelle `goToFloor(activeBuilding.id, floor.id)` au tap sur un étage, `goToBuilding(building.id)` au tap sur un bâtiment.
5. **Menu** : entrée ajoutée dans `src/features/registry.ts` (`slug: 'floor-selector'`) avec ses clés `floorSelector.title`/`floorSelector.description` (EN/FR) dans `src/i18n/strings.ts`.

## Points d'attention

- **Cette feature existait à moitié avant d'être "faite".** `goToFloor(buildingId, floorId)` et `goToBuilding(buildingId)` étaient déjà dans `useVisioMap.ts` (statut `🟡` dans `CHECKLIST.md` : câblé côté pont, mais sans UI et sans entrée de menu). Le vrai travail de cette feature n'était donc pas d'ajouter `goToFloor` — déjà là — mais (a) d'exposer la liste réelle des étages/bâtiments (rien ne la forwardait) et (b) de construire l'UI + l'entrée de menu qui manquaient. Une checklist `🟡` peut donc représenter un travail non trivial restant, pas juste "brancher un bouton".
- **`visioOneHtml.ts` et `visioOne.html` doivent rester identiques** (à l'échappement de template-literal près) — ce repo les garde synchronisés à la main, il n'y a pas de build qui génère l'un depuis l'autre. Les deux ont été édités dans ce commit ; un `diff` entre les deux (en ignorant le wrapper `export const visioOneHtml = \`...\`;` et les backticks/`${...}` échappés en `\``/`\${...}`) doit rester vide après toute modification future de la logique SDK.
- **Chevauchement volontaire avec le sélecteur natif du SDK.** `floorSelector: true` (dans `DEFAULT_OPTIONS`) affiche déjà un widget de sélection d'étage sur la carte, sans aucun code applicatif — cette feature n'a pas vocation à le remplacer mais à démontrer le pilotage programmatique. D'où l'écoute de `currentfloorchanged` : sans elle, taper le widget du SDK désynchroniserait le surlignage de la liste custom de cette app.
- **`Floor`/`Building` n'ont pas de champ `label`.** Utiliser `venue.translator.translateBuilding/translateFloor(entity, venue.currentLocale).name` — c'est la même source de vérité que celle du widget natif du SDK, donc les libellés restent cohérents entre les deux sélecteurs affichés simultanément. Ne pas se fier à `id` seul pour l'affichage (souvent un identifiant technique, pas un libellé humain).
- **Fallback "premier bâtiment"** : si `currentBuildingId` n'est pas encore connu (avant le premier message `ready`, ou si la venue ne renvoie aucun bâtiment courant), l'overlay retombe sur `buildings[0]`. Ce choix est celui demandé par la spec de la feature, pas une garantie de la SDK qu'un premier bâtiment soit toujours pertinent pour toute venue.
- Comme pour `goto-poi`/`occupancy-simulated`, il n'y a pas de vérification que la venue de démo a plusieurs étages/bâtiments — avec une venue à un seul étage, la liste n'affichera qu'une entrée (comportement correct, juste moins spectaculaire en démo).

## Pour aller plus loin

- `docs/features/goto-poi.md` de ce repo pour la feature symétrique côté POI (`select_place`/`clear_place`), dont le pont suit exactement le même patron `{ type, data }`.
- `docs/SDK_NOTES.md` de ce repo pour les gotchas SDK/WebView documentés indépendamment de toute feature (dont le pourquoi du `baseUrl` fixe utilisé pour charger `visioOneHtml`).
