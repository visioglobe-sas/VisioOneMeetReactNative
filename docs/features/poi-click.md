# Tap a Place

## Description

Reacts to a tap on a place (POI) on the map via the SDK's `poiclick` event, `view.addEventListener('poiclick', callback)`. Unlike the other features, the SDK drives this one: the callback fires whenever the user taps a POI on the map, not in response to any app-issued command.

## SDK usage

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand), inside createView(...).then((v) => { ... })
v.addEventListener('poiclick', (event) => {
  const pois = (event.pois || []).map((poi) => ({
    id: poi.id,
    name: poi.labels?.[0]?.text || poi.id,
    floorId: poi.floor?.id,
    categories: (poi.categories || []).map((category) => category.id),
  }))
  sendToNative({ type: 'poi_click', data: { pois } })
})
```

## Things to know

- `event.pois` is an array, not a single POI — one tap can hit several overlapping POIs (e.g. a marker sitting on top of a surface). Handle all of them, not just `event.pois[0]`.
- The live SDK POI object doesn't survive a `postMessage` boundary (it carries methods, surfaces, etc., not plain data) — extract only the serializable fields you need. This example takes `id`, a display `name` (resolved from `poi.labels[0].text`, falling back to `id` if no label exists), `floorId`, and `categories` (just their `id`s).
- A POI's human-readable name is not a top-level field — it lives in `poi.labels`, an array (a POI can have zero or several labels); `poi.labels?.[0]?.text` is a common "first label" convention, not a guarantee that index 0 is the most relevant label for every venue.
- `poi.categories` is also an array of category objects, not strings — map to `category.id` (or resolve a display name via the translator) rather than serializing the objects directly.
- The listener is registered inside the `createView(...).then(...)` callback, i.e. only once `view` exists — add listeners there rather than trying to attach them before the view is created.

## Learn more

- [Go to Place](goto-poi.md) — the symmetric action: start from a known POI ID to center the camera, rather than reacting to a tap on the map.
