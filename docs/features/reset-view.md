# Réinitialisation de la vue

## Description

Recentre la caméra sur la vue par défaut du lieu chargé, en s'appuyant sur `reset_map` — déjà exposé côté pont JS (`resetMap` dans `useVisioMap.ts`, géré côté WebView dans `visioOneHtml.ts`/`visioOne.html`).

Contrairement à `select_place`/`clear_place`, cette action ne prend aucun paramètre : elle ramène simplement la caméra du SDK à son cadrage initial (celui utilisé au chargement de la carte), quelle que soit la navigation effectuée depuis (zoom, déplacement, sélection de POI).

## Step by step

1. **Rien à ajouter côté pont** : `useVisioMap().resetMap()` existe déjà et envoie `{ type: 'reset_map' }` à la WebView, qui appelle la méthode correspondante du SDK sur l'objet `venue` courant.
2. Dans le composant consommateur (`src/features/ResetViewOverlay.tsx`, rendu par `FeatureScreen.tsx` à l'intérieur de `VisioMapView.tsx`), exposer un bouton qui appelle directement `resetMap` :
   ```tsx
   <TouchableOpacity style={styles.buttonSecondary} onPress={resetMap}>
     <Text style={styles.buttonText}>Reset view</Text>
   </TouchableOpacity>
   ```
3. Le bridge (`resetMap`, `webRef`, `sendSetup`, ...) est fourni par `useVisioMap()` à l'intérieur de `VisioMapView.tsx`, qui le passe à l'overlay actif via la prop `renderOverlay` — voir `FeatureScreen.tsx` pour le branchement par `slug` de feature.

## Points d'attention

- **Pas d'état à gérer côté React** : contrairement à `occupancy-simulated`, il n'y a ni timer ni cleanup — `resetMap()` est un aller simple, appelable autant de fois que nécessaire sans effet de bord à nettoyer au démontage de l'écran.
- **La WebView est recréée à chaque navigation vers cet écran** (voir `RootNavigator.tsx` / `FeatureScreen.tsx`) : le "reset" ramène donc toujours la carte à son état initial tel que défini par le venue, pas à un état "précédent" mémorisé côté app — il n'y a rien à persister entre deux visites de l'écran.
- Ce bouton était auparavant regroupé avec les autres contrôles de démo (Place ID, itinéraire, occupation) dans un unique `MapScreen.tsx` empilant tout dans le même panneau ; il vit maintenant sur son propre écran (`FeatureScreen` avec `slug: 'reset-view'`), accessible depuis le menu (`HomeScreen.tsx`) — cohérent avec le fait que chaque feature du catalogue est démontrée indépendamment des autres.

## Pour aller plus loin

- `docs/features/occupancy-simulated.md` de ce repo pour un exemple de feature avec état/cleanup à gérer dans son propre overlay.
- `docs/SDK_NOTES.md` de ce repo pour les gotchas SDK/WebView documentés indépendamment de toute feature (chargement du HTML, `baseUrl`, etc.).
