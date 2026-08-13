# Réagir au clic sur un POI

## Description

Réagit au tap d'un lieu (POI) sur la carte en affichant ses infos dans un panneau, en s'appuyant sur l'événement SDK `poiclick` (`view.addEventListener('poiclick', ...)`), déclenché côté WebView dans `visioOneHtml.ts`/`visioOne.html`.

Contrairement aux autres features de ce catalogue, ce n'est pas l'app native qui déclenche l'action (bouton, champ) : c'est la carte elle-même, via un événement du SDK. Le rôle du pont RN est donc inversé — au lieu d'envoyer une commande vers la WebView (`postMessage` depuis React Native), la WebView envoie l'info du POI tapé vers React Native (`window.ReactNativeWebView.postMessage(...)`), qui met à jour son état et affiche un panneau.

## Step by step

1. **Côté WebView** (`visioOneHtml.ts`/`visioOne.html`), dans le callback `createView(...).then((v) => { ... })`, écouter l'événement `poiclick` sur la vue et en extraire des champs sérialisables (l'objet POI du SDK ne traverse pas la frontière `postMessage`) :
   ```js
   v.addEventListener('poiclick', (event) => {
     const pois = (event.pois || []).map((poi) => ({
       id: poi.id,
       name: poi.labels?.[0]?.text || poi.id,
       floorId: poi.floor?.id,
       categories: (poi.categories || []).map((category) => category.id),
     }))
     sendToNative({ type: 'poi_click', data: { pois } })
   })
   ```
   `event.pois` est un tableau : un seul tap peut toucher plusieurs POIs superposés (ex. un marker posé sur une surface) — on relaie tout le tableau plutôt que `event.pois[0]`.
2. **Côté pont React Native** (`src/components/VisioMapView.tsx`), gérer le nouveau type de message dans `handleWebMessage` : le stocker dans un état local (`clickedPois`) et notifier le parent via un callback `onPoiClick` (voir "Points d'attention" pour pourquoi ce callback existe plutôt qu'un simple `useEffect`) :
   ```ts
   } else if (evt.type === 'poi_click') {
     setClickedPois(evt.data.pois);
     onPoiClick?.(evt.data.pois);
   }
   ```
   `clickedPois` est ensuite passé au `renderOverlay` (3ᵉ argument), aux côtés du `bridge` et du `status` déjà existants.
3. **Côté écran** (`src/screens/FeatureScreen.tsx`), pour le slug `'poi-click'` : pas de FAB (rien à ouvrir manuellement, le tap sur la carte est le déclencheur), un texte d'accroche invite l'utilisateur à taper un lieu tant qu'aucun POI n'a été tapé, et `onPoiClick` ouvre le même `BottomSheet` que les autres features (panneau opaque, glissé depuis le bas, fermable par swipe/tap sur le scrim) :
   ```ts
   const handlePoiClick = () => {
     if (slug === 'poi-click') {
       setControlsVisible(true);
     }
   };
   ```
4. Le contenu du panneau (`src/features/PoiClickOverlay.tsx`) affiche, pour chaque POI tapé : son nom, son ID, son étage et ses catégories (si présents dans le payload).

## Points d'attention

- **Avant cette feature, l'événement était juste loggé** (`console.log('[VisioMap] place selected:', evt.data)` dans `VisioMapView.tsx`, avec seulement `poi.id` comme payload) — aucune UI ne réagissait au tap, ce qui ne satisfaisait pas la barre "démontré avec une interaction utilisateur" du hub malgré le ✅ affiché dans `CHECKLIST.md`. Le message a été renommé `place` → `poi_click` et son payload enrichi (`{ pois: [...] }`) pour porter assez d'info à afficher.
- **Le callback `onPoiClick` existe pour éviter un piège React** : le 3ᵉ argument de `renderOverlay` (`clickedPois`) est bien reçu par `FeatureScreen`, mais il est produit *pendant le rendu* de `VisioMapView` (un composant enfant) — appeler `setControlsVisible` directement dans ce callback aurait déclenché un `setState` d'un composant pendant le rendu d'un *autre* composant (React s'en plaint à raison). `onPoiClick` est en revanche invoqué depuis `handleWebMessage`, un vrai gestionnaire d'événement (`WebView.onMessage`), donc appeler `setControlsVisible` à cet endroit est un `setState` parfaitement normal, similaire à n'importe quel callback (`onPress`, etc.).
- **Un tap peut renvoyer plusieurs POIs** (`event.pois`, pas un singleton) — l'ancien code ne prenait que `event.pois[0]`. Le panneau affiche désormais toute la liste ; la clé React (`${poi.id}-${index}`) inclut l'index car le SDK ne garantit pas des `id` uniques entre POIs superposés d'un même événement.
- **Seuls des champs sérialisables traversent le pont.** L'objet POI du SDK (avec ses méthodes, ses surfaces, etc.) ne peut pas être envoyé tel quel via `postMessage` — seuls `id`, `name` (résolu depuis `poi.labels[0].text`, avec repli sur `id`), `floorId` et `categories` (juste leurs `id`) sont extraits côté WebView avant l'envoi.
- **Pas d'état à nettoyer au démontage** : comme `reset-view`/`goto-poi`, il n'y a ni timer ni `useEffect` avec cleanup — chaque nouvel événement `poi_click` remplace simplement `clickedPois`.
- Le pattern FAB + `BottomSheet` (panneau opaque, glissé depuis le bas par-dessus un scrim, fermable en swipant ou en tapant le scrim) reste identique aux autres features du menu (voir `docs/features/reset-view.md`) — seul son *déclencheur* change : l'événement carte remplace le tap sur le FAB. Le FAB est simplement masqué pour ce slug puisqu'il n'y a rien d'autre à ouvrir manuellement.

## Pour aller plus loin

- `docs/features/goto-poi.md` de ce repo pour l'action symétrique : partir d'un ID de POI connu pour centrer la caméra, plutôt que de réagir à un tap sur la carte.
- `docs/SDK_NOTES.md` de ce repo pour les autres gotchas SDK/WebView déjà documentés ici.
