# Itinerary

## Description

Computes a route between two places (POIs) and displays it on the map. Built on:

- `venue.computeNavigation(request)` — computes the route (`Navigation`, with its `instructions`).
- `venue.createNavigationTrace(navigation)` — builds the drawable trace.
- `view.setCurrentNavigationTrace(trace)` — displays it, replacing any trace already shown.

## SDK usage

React Native sends `{ type: 'start_itinerary', data: { origin, destination, isAccessible, excludedAttributes } }` (`startItinerary` in `src/screens/useVisioMap.ts`); the page computes and displays the route:

```js
// src/assets/visioOne.html
const startItinerary = (origin, destination, isAccessible, excludedAttributes) => {
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
  currentNavigationTrace = venue.createNavigationTrace(navigation)
  view.setCurrentNavigationTrace(currentNavigationTrace)
}
```

`origin` and `destination` are POI ids. This screen always passes `isAccessible: false` and no `excludedAttributes` (see [Accessible route](accessible-mode.md) and [Avoid elevator](navigation-exclude-modalities.md)).

## Things to know

- **`computeNavigation` throws on an unknown POI id** (e.g. "Cannot compute Navigation as origin is an unknown POI."). The page catches it and reports `{ type: 'command_error', data: { command: 'start_itinerary', message } }`, which the panel shows.
- **Computing a new route needs no cleanup**: `setCurrentNavigationTrace(newTrace)` replaces the trace currently displayed. Don't also call `venue.removeNavigationTrace(previousTrace)` on a trace that was replaced or removed with `view.removeCurrentNavigationTrace()`: it is already unregistered, and the SDK throws "Cannot remove Navigation as it is unregistered".
- **`navigation.instructions`** holds the step-by-step instructions; this demo doesn't display them.

## Learn more

- [Custom navigation trace](custom-navigation-trace.md) — restyle the displayed trace.
- [Accessible route](accessible-mode.md), [Avoid elevator](navigation-exclude-modalities.md) — the other request options.
