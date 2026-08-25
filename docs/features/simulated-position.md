# Simulated Position

## Description

Animates a tracked position (a marker plus its accuracy circle) via `view.injectTrackedPosition(positionTrackerOptions)` — a `View` method (see `View.ts` in the `visioone` SDK). `precisionCircleRadius` (in meters) *is* the accuracy circle; there's no separate call to draw it.

This example has no real position sensor behind it: a native-side timer interpolates a point back and forth between two POIs, standing in for a real indoor-positioning feed (BLE/Wi-Fi/UWB). Swapping in a real position source only means changing what feeds `injectTrackedPosition` — nothing on the SDK-call side changes.

## SDK usage

Resolving two POI IDs to WGS84 positions — a POI has no direct lat/lng field; the position comes from whichever sub-object (marker, label, or image) actually carries one:

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const resolvePoiPosition = (placeId) => {
  const poi = venue.pois.find((p) => p.id === placeId)
  if (!poi) return null
  const position = poi.markers?.[0]?.position ?? poi.labels?.[0]?.position ?? poi.images?.[0]?.position
  return position ? { latitude: position.latitude, longitude: position.longitude, altitude: position.altitude } : null
}
```

Injecting a position on every tick of an (app-side) animation timer:

```ts
// useVisioMap.ts
const injectTrackedPosition = (position: Position, precisionCircleRadius: number) => {
  sendMessage({
    type: 'inject_tracked_position',
    data: { position, precisionCircleRadius },
  });
};

const stopPositionSimulation = () => {
  sendMessage({ type: 'stop_position_simulation' });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const injectTrackedPosition = (position, precisionCircleRadius) => {
  if (!view) return
  if (!view.allowTracking) {
    view.allowTracking = true
  }
  view.injectTrackedPosition({ position, precisionCircleRadius })
}

// No dedicated "stop tracking" call exists on the SDK — setting allowTracking
// back to false is what removes the marker and its accuracy circle from the map.
const stopPositionSimulation = () => {
  if (view) {
    view.allowTracking = false
  }
}
```

## Things to know

- `view.injectTrackedPosition(...)` requires `view.allowTracking` to already be `true`, or it throws — set it once, before the first call, not on every tick.
- There is no dedicated "stop" or "clear tracking" method on the SDK. Setting `view.allowTracking = false` is what removes the marker and its accuracy circle from the map.
- A POI has no direct lat/lng field. Its position comes from `poi.markers?.[0]?.position`, falling back to `poi.labels?.[0]?.position`, then `poi.images?.[0]?.position` — if the POI ID is unknown, or none of its markers/labels/images carry a position, treat it as a "POI not found" condition; the SDK gives no error of its own for this case.
- `precisionCircleRadius` is passed fresh on every call to `injectTrackedPosition` — there's no independent "update just the radius" call; a new radius only takes effect on the next injected position, not retroactively on the one already displayed.

## Learn more

- [Go to Place](goto-poi.md) — the same `venue.pois.find(...)` POI-lookup mechanic, reused here to resolve positions.
- [Camera Lock on Position](camera-lock-on-position.md) — builds directly on the tracked position set up here.
- A real-sensor version of this demo (BLE/Wi-Fi/UWB positioning) is out of scope for this repo; see the [VisioOneHub](https://github.com/visioglobe-sas/VisioOneHub) for the broader example catalog.
