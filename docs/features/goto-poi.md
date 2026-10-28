# Go to place

## Description

Moves the camera onto a place (POI) given its id, and drops a pin image on it. Built on:

- `view.goToPOI(poi, options)` — animates the camera onto the POI (and its floor).
- `venue.createImage(options)` / `venue.removeImage(image)` — the pin, an `Image` owned by the POI, placed at the POI's display position.

## SDK usage

React Native sends `{ type: 'select_place', data: { placeId } }` and `{ type: 'clear_place' }`:

```ts
// src/features/goto-poi/bridge.ts
export const useGoToPoiBridge = () => {
  const { send } = useMapBridge();
  return {
    goToPlace: (placeId: string) => send('select_place', { placeId }),
    clearPlace: () => send('clear_place'),
  };
};
```

The page handles them:

```js
// src/features/goto-poi/webview.js
let gotoPin = null
const GOTO_PIN_URL = 'data:image/png;base64,...' // inline 96x96 PNG, no third-party host

const clearPlace = () => {
  if (core.venue && gotoPin) {
    core.venue.removeImage(gotoPin)
  }
  gotoPin = null
}

core.register({
  select_place: ({ placeId }) => {
    const venue = core.venue
    if (!venue || !core.view) {
      return
    }
    clearPlace()
    const poi = core.findPoi(placeId)
    if (!poi) {
      // Reported to React Native as a 'command_error' by the core.
      throw new Error(`POI not found: ${placeId}`)
    }
    core.moveCameraToPoi(poi)
    const position = core.getPoiDisplayPosition(poi)
    if (position) {
      gotoPin = venue.createImage({
        poi,
        position,
        width: 2,
        height: 2,
        orientationType: 'facing',
        url: GOTO_PIN_URL,
      })
    }
  },
  clear_place: () => {
    clearPlace()
  },
})
```

`core.findPoi(id)` is `venue.pois.find((p) => p.id === id)`. `core.moveCameraToPoi(poi)` is the actual SDK call:

```js
// src/webview/core.js
const moveCameraToPoi = (poi) => {
  view.goToPOI(poi, {
    orientation: { pitch: 20 },
    padding: { top: 100, bottom: 100, right: 100, left: 100 },
  })
}
```

`core.getPoiDisplayPosition(poi)` (also in `src/webview/core.js`) is the page's single "where is this POI" helper: the POI's first Label position, else its first Image or Marker position, else the centroid of its first Surface's vertices.

A command that throws in the page (here an unknown id) comes back as `{ type: 'command_error', data: { command: 'select_place', message } }`; the panel reads it with `useCommandError('select_place', sentAt)` (`src/bridge/MapBridge.ts`) and shows it.

## Things to know

- **A POI has no position field of its own.** It comes from what the POI owns (labels, images, markers, surfaces). Some POIs have no surface at all (marker- or image-only), so never assume `poi.surfaces[0]` exists.
- **`venue.pois.find(...)` returns `undefined` for an unknown id** — the SDK doesn't throw for you; check it before calling `goToPOI`.
- **Remove what you create.** Every `createImage` adds a new Image; keep a reference and `removeImage` it before placing another one, or images pile up on the map.
- **`createImage`'s `url` accepts data: URLs**, so an icon can ship inside the app instead of depending on an external host.

## Learn more

- [Reset view](reset-view.md) — back to the default camera framing.
- [3D icon marker](3d-icon-marker.md) — the Image options (`orientationType`, size) in more detail.
