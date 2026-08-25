# Itinerary

## Description

Computes and displays a route between two places (POIs) via `venue.computeNavigation(options)`, then renders it on the map with `venue.createNavigationTrace(navigation)` and `view.setCurrentNavigationTrace(navigationTrace)`.

## SDK usage

```ts
// useVisioMap.ts
const startItinerary = (origin: string, destination: string, isAccessible: boolean) => {
  sendMessage({
    type: 'start_itinerary',
    data: { origin, destination, isAccessible },
  });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const startItinerary = (origin, destination, isAccessible) => {
  const navigation = venue.computeNavigation({
    origin,
    destination,
    isAccessible,
    type: 'fastest',
    firstNodeAsIntersection: false,
    mergeFloorChangeInstructions: false,
  })

  const navigationTrace = venue.createNavigationTrace(navigation)
  view.setCurrentNavigationTrace(navigationTrace)

  sendToNative({
    type: 'itinerary_instructions',
    data: navigation.instructions,
  })
}
```

## Things to know

- `origin`/`destination` are POI IDs (strings), not coordinates — `computeNavigation` resolves them internally; an unknown ID fails without a descriptive error on the SDK side, so validate IDs against the loaded venue first.
- `isAccessible: true` requests a route avoiding stairs/steps, provided the venue data carries accessibility information for its paths — on venues without that data the option has no visible effect.
- `type: 'fastest'` is one of several route-computation strategies the SDK supports; `firstNodeAsIntersection` and `mergeFloorChangeInstructions` control how the returned `instructions` are segmented (e.g. whether a floor change is folded into the surrounding instruction or kept separate).
- `computeNavigation` returns a `navigation` object with turn-by-turn `instructions`; drawing the route on the map is a separate step (`createNavigationTrace` + `view.setCurrentNavigationTrace`) — computing a route does not draw it automatically.
- `navigation.instructions` is plain, serializable data — safe to forward across the WebView bridge as-is if you want to render turn-by-turn steps natively.

## Learn more

- [Go to Place](goto-poi.md) — the POI-ID resolution this feature's `origin`/`destination` parameters share.
