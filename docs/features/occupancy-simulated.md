# Simulated Occupancy

## Description

Colors a POI's surfaces to reflect an occupancy status (free / soon occupied / occupied) via `venue.updateSurface(surface, { color })`.

This example has no real sensor behind it: a native-side timer cycles through colors on an interval, standing in for a real occupancy feed (websocket, API polling). Swapping in a real data source only means changing what feeds this call — nothing on the SDK-call side changes.

## SDK usage

```ts
// useVisioMap.ts
export interface OccupancyUpdate {
  planId: string;
  color?: string;
}

const updateOccupancy = (occupancy: OccupancyUpdate[]) => {
  sendMessage({ type: 'update_occupancy', data: { occupancy } });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const updateOccupancy = (occupancy) => {
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

## Things to know

- `planId` must be a real POI ID from the loaded venue. `venue.pois.find((p) => p.id === entry.planId)` fails silently (no error) if the ID doesn't match anything — validate against the actual venue data (e.g. via VisioMapEditor).
- `color: undefined` resets the surface's appearance back to normal (the same mechanism [Go to Place](goto-poi.md) uses with `selectionColor: undefined`) — that's how you clear a color override, not a color value in its own right.
- A POI can have multiple surfaces; `updateSurface` is called on each of them, so the whole POI's footprint changes color, not just part of it.

## Learn more

- [Go to Place](goto-poi.md) — uses the same `venue.updateSurface(surface, { ... })` call, for highlighting instead of occupancy coloring.
- A real-sensor version of this demo (websocket/API-driven occupancy) is out of scope for this repo; see the [VisioOneHub](https://github.com/visioglobe-sas/VisioOneHub) for the broader example catalog.
