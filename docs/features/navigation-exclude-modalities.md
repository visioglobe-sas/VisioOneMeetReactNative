# Avoid Elevator (Navigation Exclude Modalities)

## Description

Excludes segments carrying a given "particularity" attribute (e.g. an elevator hop) from a route computed by [`compute-navigation`](./compute-navigation.md), via `venue.computeNavigation()`'s optional `excludedAttributes?: string[]` parameter — the same call `start_itinerary` already uses, just given one more field.

## SDK usage

The feature reuses compute-navigation's bridge hook and page handler; `excludedAttributes` is the only field it adds:

```ts
// src/features/compute-navigation/bridge.ts
export const useItineraryBridge = () => {
  const { send } = useMapBridge();
  return {
    startItinerary: (
      origin: string,
      destination: string,
      isAccessible: boolean,
      excludedAttributes?: string[],
    ) => send('start_itinerary', { origin, destination, isAccessible, excludedAttributes }),
  };
};
```

```js
// src/features/compute-navigation/webview.js
core.register({
  start_itinerary: ({ origin, destination, isAccessible, excludedAttributes }) => {
    const venue = core.venue
    const view = core.view
    if (!venue || !view) {
      return
    }
    const navigation = venue.computeNavigation({
      origin,
      destination,
      isAccessible,
      type: 'fastest',
      firstNodeAsIntersection: false,
      mergeFloorChangeInstructions: false,
      excludedAttributes,
    })

    // Kept so custom-navigation-trace can restyle it.
    core.currentNavigationTrace = venue.createNavigationTrace(navigation)
    view.setCurrentNavigationTrace(core.currentNavigationTrace)
  },
})
```

`excludedAttributes` is forwarded as-is into `computeNavigation`'s options object. It's `undefined` for every caller of `startItinerary` other than this feature's panel, which is exactly equivalent to not passing the option at all — `compute-navigation`, `accessible-mode` and `custom-navigation-trace` are unaffected.

On the React Native side, `src/features/navigation-exclude-modalities/NavigationExcludeModalitiesPanel.tsx` reuses the same origin/destination form and "Itinerary" button as `compute-navigation`, plus an "Avoid elevator" `Switch`. The toggle is only read when "Itinerary" is pressed — flipping it alone does not recompute whatever route is already on screen:

```tsx
// src/features/navigation-exclude-modalities/NavigationExcludeModalitiesPanel.tsx
const ELEVATOR_ATTRIBUTE = 'lift';

const handleCompute = () => {
  fields.markSubmitted();
  startItinerary(
    fields.origin.trim(),
    fields.destination.trim(),
    false,
    avoidElevator ? [ELEVATOR_ATTRIBUTE] : undefined,
  );
};
```

## Things to know

- **The attribute string is `'lift'`, not `'elevator'`.** The SDK's own JSDoc comment on `excludedAttributes` (and on `Segment.attributes` in general) suggests `'elevator'`, but that's misleading — it does not match any attribute this demo venue's data actually carries. Confirmed live against this venue: computing `{ origin: 'B1-LL01-ID0013', destination: 'B1-UL02-ID0012' }` with no exclusion returns a route whose elevator-hop instruction carries `attributes: ['lift', 'B1-lift-1']`; excluding `'lift'` produces a genuinely different, longer route through 3 separate stairway segments instead. Don't trust the JSDoc string for this option — read the `attributes` of an unrestricted route's instructions on your own venue to find the real value, since it's venue-data-dependent, not a fixed SDK constant.
- **If no route survives the exclusion, this fails the same way an ordinary unreachable origin/destination pair does** — `computeNavigation` throws, and the page reports it as `{ type: 'command_error', data: { command: 'start_itinerary', message } }`, shown under the itinerary form (see [`compute-navigation`](./compute-navigation.md)'s own "Things to know"); there is no distinct "no route after exclusion" error.
- `excludedAttributes` only prunes segments carrying a matching attribute; it's not the same as `isAccessible`, which asks the SDK for a route already known to avoid stairs/steps where the map data marks that. The two can be combined, but this demo's toggle only exercises `excludedAttributes` — `isAccessible` stays hardcoded to `false`, same as `compute-navigation`.

## Learn more

See [`compute-navigation`](./compute-navigation.md) for the base itinerary call this feature extends, and [`custom-navigation-trace`](./custom-navigation-trace.md) for another feature building on the same `startItinerary` call site.
