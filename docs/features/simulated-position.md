# Simulated position

## Description

Animates a simulated tracked position (the SDK's position marker and its accuracy circle) back and forth between two POIs. Built on:

- `view.allowTracking` — must be `true` before injecting a position; setting it back to `false` removes the marker.
- `view.injectTrackedPosition({ position, precisionCircleRadius })` — places the marker; `precisionCircleRadius` (meters) **is** the accuracy circle, there is no separate call to show it.

There is no real positioning source here: a timer on the React Native side interpolates between the two POIs. Replace it with a real indoor positioning feed (BLE / Wi-Fi / UWB) without changing anything on the SDK side.

## SDK usage

1. React Native sends `{ type: 'resolve_poi_positions', data: { originId, destinationId } }`; the page answers `poi_positions_resolved` (`{ origin, destination }`, WGS84 positions) or `position_simulation_error` (`{ message }`):

```js
// src/assets/visioOne.html
const resolvePoiPosition = (placeId) => {
  const poi = venue.pois.find((p) => p.id === placeId)
  return poi ? getPoiDisplayPosition(poi) : null
}
```

`getPoiDisplayPosition(poi)` is the page's single "where is this POI" helper: the POI's first Label position, else its first Image or Marker position, else the centroid of its first Surface's vertices.

2. Every 150 ms, React Native (`src/features/useSimulatedPositionSession.ts`) computes the next interpolated position and sends `{ type: 'inject_tracked_position', data: { position, precisionCircleRadius } }`:

```js
const injectTrackedPosition = (position, precisionCircleRadius) => {
  if (!view) {
    return
  }
  if (!view.allowTracking) {
    view.allowTracking = true
  }
  view.injectTrackedPosition({ position, precisionCircleRadius })
}
```

3. Stop sends `{ type: 'stop_position_simulation' }`:

```js
const stopPositionSimulation = () => {
  if (view) {
    view.allowTracking = false
  }
}
```

## Things to know

- **`injectTrackedPosition` throws unless `view.allowTracking` is `true`.**
- **Set `allowTracking = true` only once** (on the false-to-true transition): every assignment to `true` re-locks the camera on the position, which would undo a user's pan on every tick.
- **There is no "stop tracking" method**: `allowTracking = false` is what removes the marker and its circle.
- **A POI has no position field of its own**; it comes from what the POI owns (see `getPoiDisplayPosition` above). The position shape `{ latitude, longitude, altitude? }` is the one `injectTrackedPosition` expects, no conversion needed.
- **The radius applies from the next injected position**: each call carries its own `precisionCircleRadius`.
- **Run one loop only**, and stop it (with `allowTracking = false`) when leaving the screen.

## Learn more

- [Camera lock on position](camera-lock-on-position.md), [Accuracy circle style](accuracy-circle-style.md), [Geofencing](geofencing.md) — built on the same simulated position.
