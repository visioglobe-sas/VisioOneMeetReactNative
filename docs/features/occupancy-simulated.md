# Simulated occupancy

## Description

Colors a place's surface to show an occupancy status (free / about to be occupied / occupied), the way a live sensor feed would. Built on `venue.updateSurface(surface, { color })`. There is no real sensor here: a timer on the React Native side cycles the color every 2.5 s; replace it with your own data source (websocket, API polling) without changing anything on the SDK side.

## SDK usage

React Native sends `{ type: 'update_occupancy', data: { occupancy: [{ planId, color }] } }` (`updateOccupancy` in `src/screens/useVisioMap.ts`) on every tick; the page recolors every surface of each POI:

```js
// src/assets/visioOne.html
const updateOccupancy = (occupancy) => {
  if (!venue) {
    return
  }
  occupancy.forEach((entry) => {
    const poi = venue.pois.find((p) => p.id === entry.planId)
    if (!poi) {
      return
    }
    poi.surfaces.forEach((surface) => {
      venue.updateSurface(surface, { color: entry.color })
    })
  })
}
```

The timer (`src/features/OccupancySimulatedOverlay.tsx`):

```ts
const OCCUPANCY_COLORS = ['#2ECC71', '#F1C40F', '#E74C3C']; // free, about to be occupied, occupied

const timer = setInterval(() => {
  colorIndex = (colorIndex + 1) % OCCUPANCY_COLORS.length;
  updateOccupancy([{ planId, color: OCCUPANCY_COLORS[colorIndex] }]);
}, 2500);
// on stop:
clearInterval(timer);
updateOccupancy([{ planId, color: 'initial' }]);
```

## Things to know

- **`color: 'initial'` restores the map's own color.** Passing `undefined` (or omitting `color`) does not reset anything — and an `undefined` value is dropped by `JSON.stringify` before it even reaches the page.
- **A POI can have several surfaces, or none.** Update every entry of `poi.surfaces`; a POI without surface has nothing to color.
- **An unknown id is silently ignored** (`venue.pois.find` returns `undefined`).
- **Run one timer only**, and stop it (and reset the color) when the simulation stops or the screen goes away.

## Learn more

- [Category highlight](category-highlight.md) and [Clickable surface](clickable-surface.md) — other uses of `updateSurface`.
