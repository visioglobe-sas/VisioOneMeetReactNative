# Tap a place

## Description

Reacts to a tap on a place (POI) of the map by showing its info in a panel. Built on the View's `poiclick` event (`view.addEventListener('poiclick', callback)`). Here the map is the trigger: the page sends the tapped POIs to React Native, which opens the panel.

## SDK usage

In the page, right after `createView` resolves:

```js
// src/features/poi-click/webview.js
core.onViewCreated((view) => {
  view.addEventListener('poiclick', (event) => {
    const pois = (event.pois || []).map((poi) => ({
      id: poi.id,
      name: poi.labels?.[0]?.text || poi.id,
      floorId: poi.floor?.id,
      categories: (poi.categories || []).map((category) => category.id),
    }))
    core.sendToNative({ type: 'poi_click', data: { pois } })
  })
})
```

React Native receives `{ type: 'poi_click', data: { pois: [{ id, name, floorId?, categories }] } }`; `src/bridge/VisioMapView.tsx` dispatches it to the feature's subscription:

```ts
// src/features/poi-click/bridge.ts
export interface ClickedPoi {
  id: string;
  name: string;
  floorId?: string;
  categories: string[];
}

// Calls `onClick` with every POI under each tap on the map.
export const usePoiClick = (onClick: (pois: ClickedPoi[]) => void) => {
  useMapEvent<{ pois: ClickedPoi[] }>('poi_click', (data) => onClick(data.pois));
};
```

The panel opens itself from that handler:

```tsx
// src/features/poi-click/PoiClickPanel.tsx
usePoiClick((pois) => {
  setClickedPois(pois);
  openSheet();
});
```

## Things to know

- **`event.pois` is an array**: one tap can hit several overlapping POIs (e.g. a marker on top of a surface). Handle them all, not only `event.pois[0]`; their ids aren't guaranteed unique within one event.
- **Only serializable fields cross the WebView bridge.** The SDK's POI object (with its surfaces, labels, methods) can't go through `postMessage`: extract plain fields first.
- **A POI has no name field.** The displayed name comes from its first label's `text`, falling back to its id.
- **Open your UI from the message handler**, not while rendering: reacting to the event in a render pass would update another component during render.

## Learn more

- [Go to place](goto-poi.md) — the opposite direction: from a known id to the camera.
