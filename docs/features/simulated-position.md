# Position simulée

## Description

Anime une position simulée (un point + son cercle de précision) entre deux POI, en s'appuyant sur `view.injectTrackedPosition(positionTrackerOptions)` (SDK `visioone`, `View.injectTrackedPosition` — voir `View.ts` dans le repo `visioone`). `precisionCircleRadius` (en mètres) **est** le cercle de précision : il n'y a pas d'appel séparé pour l'afficher.

Il n'y a pas de vrai capteur de position derrière : un `setInterval` côté React Native fait avancer un point le long du segment origine → destination, puis revient en arrière en boucle (aller-retour), en lieu et place d'un flux de positionnement indoor réel (BLE/Wi-Fi/UWB). C'est le point de départ pour brancher une vraie source de position sans rien changer côté SDK (voir "Points d'attention").

## Step by step

1. **Résoudre les deux POI ID en positions WGS84.** Les POI n'ont pas de champ lat/lng direct — la position vient de leur premier marker, label ou image (`poi.markers?.[0]?.position ?? poi.labels?.[0]?.position ?? poi.images?.[0]?.position`, tous portent un `Position` `{ latitude, longitude, altitude? }`, directement compatible avec `injectTrackedPosition`). Ajouté côté WebView (`visioOneHtml.ts`/`visioOne.html`) :
   ```js
   const resolvePoiPosition = (placeId) => {
     const poi = venue.pois.find((p) => p.id === placeId)
     if (!poi) return null
     const position = poi.markers?.[0]?.position ?? poi.labels?.[0]?.position ?? poi.images?.[0]?.position
     return position ? { latitude: position.latitude, longitude: position.longitude, altitude: position.altitude } : null
   }
   ```
   Exposé au pont via un message `resolve_poi_positions` (natif → WebView), qui répond `poi_positions_resolved` (les deux positions) ou `position_simulation_error` (le premier ID introuvable ou sans position).
2. **Le timer d'interpolation vit côté React Native**, pas côté WebView — même idiome que `occupancy-simulated` (un `setInterval` natif fait tourner la couleur toutes les 2,5s ; ici, un `setInterval` natif interpole la position toutes les 150ms). Une fois les deux positions résolues (`src/features/SimulatedPositionOverlay.tsx`), chaque tick calcule un point interpolé et l'envoie via un message `inject_tracked_position` :
   ```ts
   const timer = setInterval(() => {
     injectTrackedPosition(interpolatedPosition, radiusRef.current) // radiusRef : voir Points d'attention
     progress += direction * STEP_PER_TICK
     if (progress >= 1) { progress = 1; direction = -1 }
     else if (progress <= 0) { progress = 0; direction = 1 }
   }, 150)
   ```
   Côté WebView, le handler de `inject_tracked_position` est volontairement "bête" : il s'assure que `view.allowTracking = true` (une seule fois) puis appelle `view.injectTrackedPosition({ position, precisionCircleRadius })`. Toute la logique d'aller-retour reste côté natif.
3. **Démarrer/arrêter** : `view.allowTracking` doit être `true` **avant** le premier `injectTrackedPosition`, sinon la SDK lève une exception. Il n'existe pas de méthode dédiée pour arrêter/effacer le suivi — repasser `view.allowTracking = false` est ce qui retire le point et son cercle de la carte. Le message `stop_position_simulation` fait exactement ça ; envoyé à la fois par le bouton "Stop" et par le `cleanup` de l'effet React qui gère le timer (donc aussi si l'écran est démonté).
4. **Contrôle utilisateur** (`SimulatedPositionOverlay.tsx`, ouvert par le FAB de l'écran de la feature) : deux champs "Origin POI ID"/"Destination POI ID" (même look que `goto-poi`/`compute-navigation`), un stepper pour le rayon de précision (1–20 m, défaut 5 m — pas de `Slider` déjà utilisé ailleurs dans ce repo, donc un stepper `-`/`+` plutôt qu'en introduire un), et un bouton bascule Start/Stop (même patron que le toggle d'`occupancy-simulated`). Le rayon est lu depuis une `ref` par le timer, donc le déplacer en cours de simulation change le rayon utilisé au **prochain tick**, sans redémarrer la boucle ; s'il est changé avant que Start soit pressé, la valeur est simplement mémorisée pour le prochain démarrage.
5. **Menu** : entrée ajoutée dans `src/features/registry.ts` (`slug: 'simulated-position'`) avec ses clés `simulatedPosition.title`/`simulatedPosition.description` (EN/FR) dans `src/i18n/strings.ts`.

## Points d'attention

- **`injectTrackedPosition` exige `view.allowTracking = true` au préalable**, sinon la SDK lève une exception — c'est fait une seule fois, à la première position injectée, pas à chaque tick.
- **Pas de méthode "stop" dédiée** : le marqueur et son cercle de précision ne disparaissent de la carte qu'en repassant `view.allowTracking = false`. C'est ce que fait `stop_position_simulation`, jamais un appel du type "clear tracking" qui n'existe pas côté SDK.
- **Les POI n'ont pas de lat/lng direct** — la position vient de `poi.markers?.[0]?.position`, à défaut `poi.labels?.[0]?.position`, à défaut `poi.images?.[0]?.position`. Si le POI ID est introuvable, ou si aucun de ses markers/labels/images ne porte de position, c'est traité comme une erreur "POI not found" (`position_simulation_error`), affichée dans le panneau.
- **Ceci est une position simulée pilotée par l'app, pas un vrai positionnement indoor.** Le `setInterval` natif ne fait qu'interpoler linéairement entre deux points connus — remplacer ce timer par un vrai flux de positionnement (BLE/Wi-Fi/UWB) n'impliquerait aucun changement côté pont ni côté SDK, seulement côté source de la position envoyée à `inject_tracked_position`.
- **Le rayon ne s'applique qu'au tick suivant**, jamais rétroactivement sur le point déjà affiché — c'est une conséquence directe du fait que chaque tick ré-appelle `injectTrackedPosition` avec le rayon courant lu dans une `ref`, il n'y a pas d'état de rayon "en cours" côté SDK à mettre à jour indépendamment.
- **`visioOneHtml.ts` et `visioOne.html` doivent rester identiques** (à l'échappement de template-literal près) — ce repo les garde synchronisés à la main, il n'y a pas de build qui génère l'un depuis l'autre. Les deux ont été édités dans ce commit pour les trois nouveaux types de message (`resolve_poi_positions`, `inject_tracked_position`, `stop_position_simulation`).

## Pour aller plus loin

- `docs/features/occupancy-simulated.md` de ce repo pour le patron symétrique du timer côté natif (données simulées en boucle, sans vrai capteur derrière).
- `docs/features/goto-poi.md` de ce repo pour la résolution de POI ID côté WebView (`venue.pois.find(...)`), même mécanique de lookup que celle réutilisée ici pour retrouver les positions.
- Version "vrai capteur" : voir le [`ROADMAP.md`](https://github.com/visioglobe-sas/VisioOneHub) du hub, positionnement indoor réel (BLE/Wi-Fi/UWB) — hors scope tant qu'aucun flux de positionnement réel n'est disponible dans ces repos de démo.
