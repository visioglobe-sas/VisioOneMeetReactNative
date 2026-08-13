# Itinéraire

## Description

Calcule et affiche un itinéraire entre deux lieux (POI) de la carte chargée, en s'appuyant sur `start_itinerary` — déjà exposé côté pont JS (`startItinerary` dans `useVisioMap.ts`, géré côté WebView dans `visioOneHtml.ts`/`visioOne.html`).

`startItinerary(origin, destination, isAccessible)` demande au SDK de calculer un chemin entre les deux identifiants de POI donnés et de l'afficher sur la carte ; `isAccessible` bascule le calcul sur un itinéraire accessible (évite escaliers/marches) quand la carte fournit cette information.

## Step by step

1. **Rien à ajouter côté pont** : `useVisioMap().startItinerary(origin: string, destination: string, isAccessible: boolean)` existe déjà et envoie `{ type: 'start_itinerary', data: { origin, destination, isAccessible } }` à la WebView.
2. Dans le composant consommateur (`src/features/ComputeNavigationOverlay.tsx`, rendu par `FeatureScreen.tsx` à l'intérieur de `VisioMapView.tsx`), garder les deux identifiants saisis dans des états locaux (`useState`) et exposer un bouton :
   ```tsx
   <TextInput value={origin} onChangeText={setOrigin} placeholder="From (place ID)" />
   <TextInput value={destination} onChangeText={setDestination} placeholder="To (place ID)" />
   <TouchableOpacity onPress={() => startItinerary(origin, destination, false)}>
     <Text>Itinerary</Text>
   </TouchableOpacity>
   ```
   Cette démo appelle toujours `startItinerary` avec `isAccessible: false` — le paramètre reste piloté par le code, pas par un contrôle UI dédié.
3. Le bridge (`startItinerary`, `webRef`, `sendSetup`, ...) est fourni par `useVisioMap()` à l'intérieur de `VisioMapView.tsx`, qui le passe à l'overlay actif via la prop `renderOverlay` — voir `FeatureScreen.tsx` pour le branchement par `slug` de feature (`'compute-navigation'`).

## Points d'attention

- **`origin` et `destination` doivent être de vrais IDs de POI de la carte chargée**, comme pour `goto-poi` (voir `docs/features/goto-poi.md`) — un ID invalide échoue silencieusement côté SDK dans cette démo.
- **Pas d'état à nettoyer au démontage** : `startItinerary` est un appel ponctuel, sans timer ni cleanup à gérer.
- Les évènements `itinerary_instructions` renvoyés par la WebView (étapes du trajet calculé) sont déjà relayés vers la console par `VisioMapView.tsx` (`handleWebMessage`) mais ne sont pas affichés dans l'UI de cette démo — un client voulant les exploiter branchera son propre affichage sur ce même évènement.
- Ces deux champs + ce bouton étaient auparavant regroupés avec les autres contrôles de démo (Place ID, reset, occupation) dans un unique `MapScreen.tsx` ; ils vivent maintenant sur leur propre écran (`FeatureScreen` avec `slug: 'compute-navigation'`), accessible depuis le menu (`HomeScreen.tsx`).

## Pour aller plus loin

- `docs/features/goto-poi.md` de ce repo pour la feature de sélection d'un lieu unique dont celle-ci reprend la logique d'identifiants de POI.
- `docs/SDK_NOTES.md` de ce repo pour les gotchas SDK/WebView documentés indépendamment de toute feature.
