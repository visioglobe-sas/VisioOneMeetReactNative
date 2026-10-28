# Simulated position

## Description

Animates a simulated tracked position (the SDK's position marker and its accuracy circle) back and forth between two POIs. Built on:

- `view.allowTracking` — must be `true` before injecting a position; setting it back to `false` removes the marker.
- `view.injectTrackedPosition({ position, precisionCircleRadius })` — places the marker; `precisionCircleRadius` (meters) **is** the accuracy circle, there is no separate call to show it.

There is no real positioning source here: a timer on the React Native side interpolates between the two POIs. Replace it with a real indoor positioning feed (BLE / Wi-Fi / UWB) without changing anything on the SDK side.

## SDK usage

The React Native side is a shared hook, `useSimulatedPositionSession` (`src/shared/positionTracking/useSimulatedPositionSession.ts`), also used by camera-lock-on-position, accuracy-circle-style and geofencing; the page side is `src/features/simulated-position/webview.js`.

1. Start sends `{ type: 'resolve_poi_positions', data: { originId, destinationId } }`; the page answers `poi_positions_resolved` (`{ origin, destination }`, WGS84 positions) or `position_simulation_error` (`{ message }`):

```ts
// src/shared/positionTracking/useSimulatedPositionSession.ts
send('resolve_poi_positions', { originId: origin, destinationId: destination });
```

```js
// src/features/simulated-position/webview.js
resolve_poi_positions: ({ originId, destinationId }) => {
  if (!core.venue) {
    return
  }
  const resolve = (placeId) => {
    const poi = core.findPoi(placeId)
    return poi ? core.getPoiDisplayPosition(poi) : null
  }
  const origin = resolve(originId)
  const destination = resolve(destinationId)
  if (!origin) {
    core.sendToNative({ type: 'position_simulation_error', data: { message: `POI not found: ${originId}` } })
    return
  }
  if (!destination) {
    core.sendToNative({ type: 'position_simulation_error', data: { message: `POI not found: ${destinationId}` } })
    return
  }
  core.sendToNative({ type: 'poi_positions_resolved', data: { origin, destination } })
},
```

`core.getPoiDisplayPosition(poi)` (`src/webview/core.js`) is the page's single "where is this POI" helper: the POI's first Label position, else its first Image or Marker position, else the centroid of its first Surface's vertices.

2. Every 150 ms (`TICK_MS`), the hook computes the next interpolated position and sends `{ type: 'inject_tracked_position', data: { position, precisionCircleRadius } }`:

```ts
// src/shared/positionTracking/useSimulatedPositionSession.ts
injectTrackedPosition: (position: Position, precisionCircleRadius: number) =>
  send('inject_tracked_position', { position, precisionCircleRadius }),
```

```js
// src/features/simulated-position/webview.js
inject_tracked_position: ({ position, precisionCircleRadius }) => {
  const view = core.view
  if (!view) {
    return
  }
  if (!view.allowTracking) {
    view.allowTracking = true
  }
  view.injectTrackedPosition({ position, precisionCircleRadius })
},
```

3. Stop (or leaving the screen) clears the timer and sends `{ type: 'stop_position_simulation' }`:

```ts
// src/shared/positionTracking/useSimulatedPositionSession.ts
stopSimulation: () => send('stop_position_simulation'),
```

```js
// src/features/simulated-position/webview.js
stop_position_simulation: () => {
  if (core.view) {
    core.view.allowTracking = false
  }
},
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
