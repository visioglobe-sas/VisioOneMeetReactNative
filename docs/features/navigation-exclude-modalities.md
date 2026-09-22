# Avoid Elevator (Navigation Exclude Modalities)

## Description

Excludes segments carrying a given "particularity" attribute (e.g. an elevator hop) from a route computed by [`compute-navigation`](./compute-navigation.md), via `venue.computeNavigation()`'s optional `excludedAttributes?: string[]` parameter — the same call `start_itinerary` already uses, just given one more field.

## SDK usage

```ts
// useVisioMap.ts
const startItinerary = (
  origin: string,
  destination: string,
  isAccessible: boolean,
  excludedAttributes?: string[],
) => {
  sendMessage({
    type: 'start_itinerary',
    data: { origin, destination, isAccessible, excludedAttributes },
  });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const startItinerary = (origin, destination, isAccessible, excludedAttributes) => {
  const navigation = venue.computeNavigation({
    origin,
    destination,
    isAccessible,
    type: 'fastest',
    firstNodeAsIntersection: false,
    mergeFloorChangeInstructions: false,
    excludedAttributes,
  })

  currentNavigationTrace = venue.createNavigationTrace(navigation)
  view.setCurrentNavigationTrace(currentNavigationTrace)

  sendToNative({ type: 'itinerary_instructions', data: navigation.instructions })
}
```

`excludedAttributes` is forwarded as-is into `computeNavigation`'s options object. It's `undefined` for every caller of `startItinerary` other than this feature's overlay, which is exactly equivalent to not passing the option at all — `compute-navigation` and `custom-navigation-trace` are unaffected.

On the React Native side, `NavigationExcludeModalitiesOverlay` reuses the same origin/destination fields and "Itinerary" button as `compute-navigation`, plus an "Avoid elevator" `Switch`. The toggle is only read when "Itinerary" is pressed — flipping it alone does not recompute whatever route is already on screen:

```tsx
const handleCompute = () => {
  startItinerary(origin, destination, false, avoidElevator ? ['lift'] : undefined);
};
```

## Things to know

- **The attribute string is `'lift'`, not `'elevator'`.** The SDK's own JSDoc comment on `excludedAttributes` (and on `Segment.attributes` in general) suggests `'elevator'`, but that's misleading — it does not match any attribute this demo venue's data actually carries. Confirmed live against this venue: computing `{ origin: 'B1-LL01-ID0013', destination: 'B1-UL02-ID0012' }` with no exclusion returns a route whose elevator-hop instruction carries `attributes: ['lift', 'B1-lift-1']`; excluding `'lift'` produces a genuinely different, longer route through 3 separate stairway segments instead. Don't trust the JSDoc string for this option — read the `attributes` of an unrestricted route's instructions on your own venue to find the real value, since it's venue-data-dependent, not a fixed SDK constant.
- **If no route survives the exclusion, this fails the same way an ordinary unreachable origin/destination pair does** — `compute-navigation` already fails silently in that case in this demo (see [`compute-navigation`](./compute-navigation.md)'s own "Things to know"); excluding every viable path with `excludedAttributes` hits that exact same path, not a distinct "no route after exclusion" error.
- `excludedAttributes` only prunes segments carrying a matching attribute; it's not the same as `isAccessible`, which asks the SDK for a route already known to avoid stairs/steps where the map data marks that. The two can be combined, but this demo's toggle only exercises `excludedAttributes` — `isAccessible` stays hardcoded to `false`, same as `compute-navigation`.

## Learn more

See [`compute-navigation`](./compute-navigation.md) for the base itinerary call this feature extends, and [`custom-navigation-trace`](./custom-navigation-trace.md) for another feature building on the same `startItinerary` call site.
