# Simulated occupancy

## Description

Colors a place's surface to show an occupancy status (free / about to be occupied / occupied), the way a live sensor feed would. Built on `venue.updateSurface(surface, { color })`. There is no real sensor here: a timer on the React Native side cycles the color every 2.5 s; replace it with your own data source (websocket, API polling) without changing anything on the SDK side.

## SDK usage

React Native sends `{ type: 'update_occupancy', data: { occupancy: [{ planId, color }] } }` on every tick:

```ts
// src/features/occupancy-simulated/bridge.ts
export interface OccupancyUpdate {
  planId: string;
  color?: string;
}

export const useOccupancySimulatedBridge = () => {
  const { send } = useMapBridge();
  return {
    updateOccupancy: (occupancy: OccupancyUpdate[]) => send('update_occupancy', { occupancy }),
  };
};
```

The page recolors every surface of each POI:

```js
// src/features/occupancy-simulated/webview.js
core.register({
  update_occupancy: ({ occupancy }) => {
    const venue = core.venue
    if (!venue) {
      return
    }
    occupancy.forEach((entry) => {
      const poi = core.findPoi(entry.planId)
      if (!poi) {
        return
      }
      poi.surfaces.forEach((surface) => {
        venue.updateSurface(surface, { color: entry.color })
      })
    })
  },
})
```

The timer (`core.findPoi(id)` above is `venue.pois.find((p) => p.id === id)`):

```tsx
// src/features/occupancy-simulated/OccupancySimulatedPanel.tsx
const OCCUPANCY_COLORS = ['#2ECC71', '#F1C40F', '#E74C3C']; // free, about to be occupied, occupied
const OCCUPANCY_INTERVAL_MS = 2500;

React.useEffect(() => {
  if (!runningPlaceId) {
    return;
  }
  let colorIndex = 0;
  const apply = (color: string | undefined) =>
    updateOccupancyRef.current([{ planId: runningPlaceId, color }]);
  apply(OCCUPANCY_COLORS[colorIndex]);
  const timer = setInterval(() => {
    colorIndex = (colorIndex + 1) % OCCUPANCY_COLORS.length;
    apply(OCCUPANCY_COLORS[colorIndex]);
  }, OCCUPANCY_INTERVAL_MS);

  return () => {
    clearInterval(timer);
    // Back to the map's own color rather than leaving the last simulated one.
    apply('initial');
  };
}, [runningPlaceId]);
```

## Things to know

- **`color: 'initial'` restores the map's own color.** Passing `undefined` (or omitting `color`) does not reset anything — and an `undefined` value is dropped by `JSON.stringify` before it even reaches the page.
- **A POI can have several surfaces, or none.** Update every entry of `poi.surfaces`; a POI without surface has nothing to color.
- **An unknown id is silently ignored** (`venue.pois.find` returns `undefined`).
- **Run one timer only**, and stop it (and reset the color) when the simulation stops or the screen goes away.

## Learn more

- [Category highlight](category-highlight.md) and [Clickable surface](clickable-surface.md) — other uses of `updateSurface`.
