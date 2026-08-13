# Occupation temps réel (données simulées)

## Description

Colore dynamiquement la surface d'un POI pour refléter un statut d'occupation (libre / bientôt occupé / occupé), en s'appuyant sur `update_occupancy` — déjà exposé côté pont JS (`updateOccupancy` dans `useVisioMap.ts`, géré côté WebView dans `visioOneHtml.ts`/`visioOne.html`).

Il n'y a pas de vrai capteur derrière : un `setInterval` côté React Native fait tourner la couleur toutes les 2,5 secondes, en lieu et place d'un flux IoT réel. C'est le point de départ pour brancher une vraie source de données (websocket, polling d'API) sans rien changer côté pont ou côté SDK.

## Step by step

1. **Rien à ajouter côté pont** : `useVisioMap().updateOccupancy(occupancy: OccupancyUpdate[])` existe déjà et envoie `{ type: 'update_occupancy', data: { occupancy } }` à la WebView, qui résout chaque `planId` en POI (`venue.pois.find(...)`) et colore ses surfaces (`venue.updateSurface(surface, { color })`).
2. Dans le composant consommateur (`src/features/OccupancySimulatedOverlay.tsx`, rendu par `FeatureScreen.tsx` à l'intérieur de `VisioMapView.tsx`), démarrer un timer qui appelle `updateOccupancy([{ planId, color }])` avec une couleur qui change à chaque tick :
   ```ts
   const OCCUPANCY_COLORS = ['#2ECC71', '#F1C40F', '#E74C3C'];
   // ...
   const timer = setInterval(() => {
     colorIndex = (colorIndex + 1) % OCCUPANCY_COLORS.length;
     updateOccupancy([{ planId: targetPlaceId, color: OCCUPANCY_COLORS[colorIndex] }]);
   }, 2500);
   ```
3. Toujours nettoyer le timer (`clearInterval`) **et** remettre la couleur à `undefined` en cleanup — sinon la surface reste bloquée sur la dernière couleur simulée après avoir arrêté la simulation ou changé de `planId`.
4. Exposer un contrôle utilisateur pour démarrer/arrêter la simulation (ici, un bouton toggle associé à son propre champ "Place ID", sur l'écran dédié à cette feature — chaque feature du menu vit sur son propre écran, avec sa propre WebView recréée par React Navigation) — une feature du catalogue doit être démontrable via une interaction, pas seulement câblée en silence.

## Points d'attention

- **`planId` doit être un vrai ID de POI de la carte chargée.** `venue.pois.find((p) => p.id === entry.planId)` échoue silencieusement (pas d'erreur remontée) si l'ID ne correspond à rien — vérifier avec un ID de POI existant de la carte (voir VisioMapEditor pour la liste des POIs de la carte de démo).
- **`color: undefined` réinitialise l'apparence de la surface** (même mécanisme que `clearPlace` avec `selectionColor: undefined`) — c'est la façon de "rendre" une place à son état normal, pas une couleur par défaut à coder en dur.
- **Le timer doit vivre dans un `useEffect`**, dépendant de l'état "simulation active" et du `placeId` ciblé — sinon un changement de `placeId` en cours de simulation laisse tourner l'ancien timer sur l'ancien POI en plus du nouveau.
- Ceci démontre la **mécanique** de mise à jour temps réel, pas une vraie intégration IoT — pour un cas client réel, remplacer le `setInterval` par un abonnement à la vraie source (websocket, polling d'API) sans toucher au pont ni au SDK.

## Pour aller plus loin

- Version "vrai capteur" : voir le [`ROADMAP.md`](https://github.com/visioglobe-sas/VisioOneHub) du hub, feature "Suivi d'actifs connectés (IoT)" — hors scope tant qu'aucun flux IoT réel n'est disponible.
- `docs/SDK_NOTES.md` de ce repo pour les autres gotchas SDK/WebView déjà documentés ici.
