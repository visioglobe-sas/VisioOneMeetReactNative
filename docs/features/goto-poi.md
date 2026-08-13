# Aller à un lieu

## Description

Centre la caméra du SDK sur un lieu (POI) à partir de son identifiant, en s'appuyant sur `select_place`/`clear_place` — déjà exposés côté pont JS (`goToPlace`/`clearPlace` dans `useVisioMap.ts`, gérés côté WebView dans `visioOneHtml.ts`/`visioOne.html`).

`goToPlace(placeId)` résout l'identifiant en POI côté SDK et recentre la vue dessus ; `clearPlace()` annule cette sélection sans paramètre, de la même façon que `resetMap()` ramène la caméra à son cadrage initial (voir `docs/features/reset-view.md`).

## Step by step

1. **Rien à ajouter côté pont** : `useVisioMap().goToPlace(placeId: string)` et `useVisioMap().clearPlace()` existent déjà et envoient respectivement `{ type: 'select_place', data: { placeId } }` et `{ type: 'clear_place' }` à la WebView.
2. Dans le composant consommateur (`src/features/GoToPoiOverlay.tsx`, rendu par `FeatureScreen.tsx` à l'intérieur de `VisioMapView.tsx`), garder l'identifiant saisi dans un état local (`useState`) et exposer deux boutons :
   ```tsx
   <TextInput value={placeId} onChangeText={setPlaceId} placeholder="Place ID" />
   <TouchableOpacity onPress={() => goToPlace(placeId)}>
     <Text>Go</Text>
   </TouchableOpacity>
   <TouchableOpacity onPress={clearPlace}>
     <Text>Clear</Text>
   </TouchableOpacity>
   ```
3. Le bridge (`goToPlace`, `clearPlace`, `webRef`, `sendSetup`, ...) est fourni par `useVisioMap()` à l'intérieur de `VisioMapView.tsx`, qui le passe à l'overlay actif via la prop `renderOverlay` — voir `FeatureScreen.tsx` pour le branchement par `slug` de feature (`'goto-poi'`).

## Points d'attention

- **`placeId` doit être un vrai ID de POI de la carte chargée.** Comme pour `update_occupancy` (voir `docs/features/occupancy-simulated.md`), une résolution qui échoue côté SDK n'affiche pas d'erreur exploitable dans cette démo — vérifier avec un ID de POI existant de la carte de démo (voir VisioMapEditor pour la liste des POIs).
- **Pas d'état à nettoyer au démontage** : contrairement à `occupancy-simulated`, il n'y a ni timer ni `useEffect` — `goToPlace`/`clearPlace` sont de simples appels ponctuels, sans effet de bord persistant.
- Ce champ + ces deux boutons étaient auparavant regroupés avec les autres contrôles de démo (itinéraire, reset, occupation) dans un unique `MapScreen.tsx` ; ils vivent maintenant sur leur propre écran (`FeatureScreen` avec `slug: 'goto-poi'`), accessible depuis le menu (`HomeScreen.tsx`).

## Pour aller plus loin

- `docs/features/reset-view.md` de ce repo pour l'action symétrique sans paramètre (`resetMap`).
- `docs/SDK_NOTES.md` de ce repo pour les gotchas SDK/WebView documentés indépendamment de toute feature.
