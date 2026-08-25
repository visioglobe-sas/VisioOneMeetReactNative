# Go to Place

## Description

Centers the camera on a place (POI) given its ID via `view.goToPOI(poi, options)`, and optionally highlights it. `venue.pois.find(...)` resolves the ID to the actual POI object first — the SDK has no "go to POI by ID" shortcut; POI lookup and camera framing are two separate steps.

## SDK usage

```ts
// useVisioMap.ts
const goToPlace = (placeId: string) => {
  sendMessage({ type: 'select_place', data: { placeId } });
};

const clearPlace = () => {
  sendMessage({ type: 'clear_place' });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const goToPlace = (placeId) => {
  if (venue && view) {
    const poi = venue.pois.find((p) => p.id === placeId)
    poiInfo = poi

    if (poi) {
      view.goToPOI(poi, {
        orientation: { pitch: 20 },
        padding: { top: 100, bottom: 100, right: 100, left: 100 },
      })

      poi.surfaces.forEach((surface) => {
        venue.updateSurface(surface, { selectionColor: '#057DBC' })
      })

      const position = { latitude: 0, longitude: 0, altitude: poi.surfaces[0].extrusionHeight }
      poi.surfaces[0].positions.forEach((p) => {
        position.latitude += p.latitude
        position.longitude += p.longitude
      })
      position.latitude /= poi.surfaces[0].positions.length
      position.longitude /= poi.surfaces[0].positions.length

      image = venue.createImage({
        poi,
        position,
        width: 2,
        height: 2,
        orientationType: 'facing',
        url: 'https://cdn-icons-png.flaticon.com/512/731/731582.png',
      })
    }
  }
}

const clearPlace = () => {
  if (venue && image && poiInfo) {
    venue.removeImage(image)
    poiInfo.surfaces.forEach((surface) => {
      venue.updateSurface(surface, { selectionColor: undefined })
    })
    image = null
    poiInfo = null
  }
}
```

## Things to know

- `venue.pois.find((p) => p.id === placeId)` fails silently (returns `undefined`, no thrown error) if the ID doesn't match any POI in the loaded venue — validate IDs against the actual venue data (e.g. via VisioMapEditor) rather than assuming any string works.
- `view.goToPOI(poi, options)` accepts an `orientation` (pitch/heading) and a `padding` (per-side, in pixels) to control the final framing — this example uses a fixed 20° pitch and 100px padding on all sides.
- Highlighting is layered on top of the camera move, not part of `goToPOI` itself: `venue.updateSurface(surface, { selectionColor })` recolors the POI's surfaces, and `venue.createImage(...)` drops a marker image above it, computed as the centroid of the POI's first surface (averaging its `positions`, offset by `extrusionHeight`).
- `clearPlace` reverses both effects: `venue.removeImage(image)` removes the marker, and setting `selectionColor: undefined` resets the surface's appearance — `undefined` is how you clear a color override, not a color value of its own.
- The created `image` and the selected POI need to be tracked somewhere (e.g. module-level variables on the WebView side) so a later `clearPlace` call knows what to remove — calling it without a prior successful `goToPlace` is a no-op.

## Learn more

- [Reset View](reset-view.md) — the symmetric parameterless action that returns the camera to the venue's default framing.
