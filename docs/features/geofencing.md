# Geofencing

## Description

Flags an existing POI's surface as a "zone" and alerts (by recoloring it) when a tracked position enters or leaves it — a contextual-notification demo (e.g. "you're entering the promo area") built on top of [`simulated-position`](simulated-position.md)'s tracking loop.

The SDK has **no geofencing or point-in-polygon primitive of its own.** This demo is built entirely from primitives already used by other features:

- `Surface.positions: Position[]` (`poi.surfaces[0].positions`, same `{ latitude, longitude, altitude? }` shape `injectTrackedPosition` takes) — the zone's boundary vertices, read straight off an existing POI. There's no separate "geofence" object on the SDK side; a zone *is* a POI's surface.
- `view.injectTrackedPosition` / `view.allowTracking` — reused as-is from `simulated-position`, unmodified.
- `venue.updateSurface(surface, { color })` — same call `clickable-surface`/`category-highlight` use for their own coloring, here used as the "alert" visual.
- A hand-rolled ray-casting point-in-polygon check (`isPointInPolygon` in `GeofencingOverlay.tsx`) — plain app logic, not an SDK call.

## SDK usage

```ts
// useVisioMap.ts
const resolveGeofenceZone = (placeId: string) => {
  sendMessage({ type: 'resolve_geofence_zone', data: { placeId } });
};

const setGeofenceAlert = (placeId: string, active: boolean) => {
  sendMessage({ type: 'set_geofence_alert', data: { placeId, active } });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const resolveGeofenceZone = (placeId) => {
  if (!venue) return
  const poi = venue.pois.find((p) => p.id === placeId)
  if (!poi) {
    sendToNative({ type: 'geofence_zone_error', data: { message: `POI not found: ${placeId}` } })
    return
  }
  if (!poi.surfaces || poi.surfaces.length === 0) {
    sendToNative({ type: 'geofence_zone_error', data: { message: `Zone POI has no surface geometry: ${placeId}` } })
    return
  }
  sendToNative({
    type: 'geofence_zone_resolved',
    data: {
      placeId,
      surfaces: poi.surfaces.map((surface) =>
        surface.positions.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      ),
    },
  })
}

const setGeofenceAlert = (placeId, active) => {
  if (!venue) return
  const poi = venue.pois.find((p) => p.id === placeId)
  if (!poi) return
  poi.surfaces.forEach((surface) => {
    venue.updateSurface(surface, { color: active ? '#E74C3C' : 'initial' })
  })
}
```

`resolve_geofence_zone` goes in once, when the "Zone POI ID" field is submitted; `geofence_zone_resolved` (`{ placeId, surfaces: Position[][] }`) or `geofence_zone_error` comes back. Every surface's boundary is returned — not just the first — since a POI can carry more than one `Surface`.

The containment check itself happens entirely on the native side, piggybacked onto `simulated-position`'s existing ~150ms tick loop (`SimulatedPositionOverlay.tsx` now accepts an optional `onPositionTick` callback for exactly this) — no separate polling loop, since the SDK has no `trackedpositionchanged` event to react to instead. On every tick, `GeofencingOverlay.tsx` runs a ray-casting test between the freshly-interpolated position and each of the zone's polygons; on a state transition it calls `setGeofenceAlert(placeId, isInside)`.

## Things to know

- **No SDK geofencing primitive exists.** `Surface.positions` gives zone geometry and `injectTrackedPosition` gives a position, both already in WGS84 — but nothing in the SDK checks one against the other. The point-in-polygon test (`isPointInPolygon`, ray-casting, lat/lng treated as planar x/y — accurate enough at building scale) is plain app code.
- **A "zone" is just an existing POI's surface**, not a first-class concept. Any POI ID that resolves to a POI with at least one `Surface` works as a zone; a point/marker-only POI (`poi.surfaces` empty) is reported as a normal, non-crash error ("Zone POI has no surface geometry"), same idiom as a not-found ID.
- **`'initial'` reverts the color**, not `undefined` or omitting the key — same `SurfaceUpdateOptions` sentinel `clickable-surface`/`category-highlight` already rely on to restore a surface's bundle-defined color.
- **Reuses, doesn't duplicate, `simulated-position`'s tracking loop.** No second `setInterval`/timer was added — `onPositionTick` fires from the same tick that already calls `injectTrackedPosition`. `onTrackingStopped` fires once when that loop stops (Stop pressed, or the screen unmounts) so a lingering "inside zone" alert gets reverted even if the position never explicitly re-exits the polygon.

## Learn more

- [Simulated position](simulated-position.md) — the tracking loop this feature's containment check is piggybacked onto.
- [Clickable surface](clickable-surface.md) / [Category highlight](category-highlight.md) — the other features already using `venue.updateSurface`'s `'initial'` color-revert sentinel.
