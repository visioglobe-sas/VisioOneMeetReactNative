# Tap a place

## Description

Reacts to a tap on a place (POI) of the map by showing its info in a panel. Built on the View's `poiclick` event (`view.addEventListener('poiclick', callback)`). Here the map is the trigger: the page sends the tapped POIs to React Native, which opens the panel.

## SDK usage

In the page (`src/assets/visioOne.html`), right after `createView` resolves:

```js
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

React Native receives `{ type: 'poi_click', data: { pois: [{ id, name, floorId?, categories }] } }` in the WebView's `onMessage` (`src/components/VisioMapView.tsx`) and opens the panel from that event handler.

## Things to know

- **`event.pois` is an array**: one tap can hit several overlapping POIs (e.g. a marker on top of a surface). Handle them all, not only `event.pois[0]`; their ids aren't guaranteed unique within one event.
- **Only serializable fields cross the WebView bridge.** The SDK's POI object (with its surfaces, labels, methods) can't go through `postMessage`: extract plain fields first.
- **A POI has no name field.** The displayed name comes from its first label's `text`, falling back to its id.
- **Open your UI from the message handler**, not while rendering: reacting to the event in a render pass would update another component during render.

## Learn more

- [Go to place](goto-poi.md) — the opposite direction: from a known id to the camera.
