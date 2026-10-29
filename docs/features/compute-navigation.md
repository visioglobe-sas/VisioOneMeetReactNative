# Itinerary

## Description

Computes a route between two places (POIs) and displays it on the map. Built on:

- `venue.computeNavigation(request)` — computes the route (`Navigation`, with its `instructions`).
- `venue.createNavigationTrace(navigation)` — builds the drawable trace.
- `view.setCurrentNavigationTrace(trace)` — displays it, replacing any trace already shown.

## SDK usage

React Native sends `{ type: 'start_itinerary', data: { origin, destination, isAccessible, excludedAttributes } }`:

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

The page computes and displays the route:

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

`origin` and `destination` are POI ids. This screen always passes `isAccessible: false` and no `excludedAttributes` (see [Accessible route](accessible-mode.md) and [Avoid elevator](navigation-exclude-modalities.md)):

```tsx
// src/features/compute-navigation/ComputeNavigationPanel.tsx
startItinerary(fields.origin.trim(), fields.destination.trim(), false);
```

## Things to know

- **`computeNavigation` throws on an unknown POI id** (e.g. "Cannot compute Navigation as origin is an unknown POI."). The page's message dispatcher (`src/webview/core.js`) catches it and reports `{ type: 'command_error', data: { command: 'start_itinerary', message } }`, which the form shows (`useCommandError('start_itinerary', submittedAt)` from `src/bridge/MapBridge.ts`).
- **Computing a new route needs no cleanup**: `setCurrentNavigationTrace(newTrace)` replaces the trace currently displayed. Don't also call `venue.removeNavigationTrace(previousTrace)` on a trace that was replaced or removed with `view.removeCurrentNavigationTrace()`: it is already unregistered, and the SDK throws "Cannot remove Navigation as it is unregistered".
- **`navigation.instructions`** holds the step-by-step instructions; this demo doesn't display them.

## Learn more

- [Custom navigation trace](custom-navigation-trace.md) — restyle the displayed trace.
- [Accessible route](accessible-mode.md), [Avoid elevator](navigation-exclude-modalities.md) — the other request options.
