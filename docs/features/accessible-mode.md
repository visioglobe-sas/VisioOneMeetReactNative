# Accessible Route

## Description

Requests a wheelchair/stairs-free route from `venue.computeNavigation()`'s `isAccessible?: boolean` parameter (default `false`) — the same call [`compute-navigation`](./compute-navigation.md) and [`navigation-exclude-modalities`](./navigation-exclude-modalities.md) already use via `start_itinerary`, this feature is just the first to actually flip it to `true` from the UI instead of hardcoding `false`.

Per the SDK's own JSDoc on `isAccessible`: "If set to true, computed route will only use accessible route." `startItinerary` already forwarded this parameter end-to-end before this feature existed (RN → WebView → `computeNavigation`) — no bridge or WebView-side change was needed, only a UI control that reads a real value instead of always passing `false`.

## SDK usage

```ts
// useVisioMap.ts -- unchanged by this feature, already had isAccessible as a real param
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
// visioOneHtml.ts / visioOne.html (kept in sync by hand) -- unchanged by this feature
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

On the React Native side, `AccessibleModeOverlay` reuses the same origin/destination fields and "Itinerary" button as `compute-navigation`, plus an "Accessible route" `Switch`. Like the exclude-modalities toggle, it's only read when "Itinerary" is pressed — flipping it alone does not recompute whatever route is already on screen:

```tsx
const handleCompute = () => {
  startItinerary(origin, destination, accessibleRoute);
};
```

## Things to know

- **`isAccessible: true` excludes the venue's own published accessible-route exclusion list**, not a fixed SDK constant. Internally the SDK keeps this per-venue as its `accessibleRouteAttributes`/`accessibleRouteModalities` data, authored in VisioMapEditor — there is no public getter exposing that list at runtime, so which segments it actually avoids is only discoverable empirically (by comparing a route with and without the flag).
- **Confirmed live on this demo venue** (same shared map as the other navigation features) with `{ origin: 'B4-UL00-ID0010', destination: 'B4-UL01-ID0014' }`: with `isAccessible` omitted/`false`, `computeNavigation` returns a route whose floor-change instruction carries `attributes` including `'stairway'`/`'B4-stairs2'`; with `isAccessible: true`, the same origin/destination pair reroutes entirely through a different floor-change instruction carrying `attributes` including `'lift'`/`'B4-lift1'` — a genuinely different route, not just a relabeled one.
- **This is the opposite direction from [`navigation-exclude-modalities`](./navigation-exclude-modalities.md)**: that feature excludes `'lift'` by attribute string to force a route through stairs; this feature asks the SDK itself to avoid stairs (whatever the venue's own accessible-route data marks) and route through a lift or ramp instead. The two options are independent and can in principle be combined, but this demo's toggle only exercises `isAccessible`.
- **If no accessible route exists between the given pair, this fails the same way an ordinary unreachable origin/destination pair does** — see [`compute-navigation`](./compute-navigation.md)'s own "Things to know" for that silent-failure behavior in this demo.
- `origin`/`destination` must be real place IDs from the loaded venue, same precondition as `compute-navigation` and `goto-poi`.

## Learn more

See [`compute-navigation`](./compute-navigation.md) for the base itinerary call this feature extends, and [`navigation-exclude-modalities`](./navigation-exclude-modalities.md) for the opposite-direction feature (forcing a route away from a specific modality instead of toward an accessible one) built on the same `startItinerary` call site.
