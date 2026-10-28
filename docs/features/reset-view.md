# Reset view

## Description

Brings the camera back to the venue's default whole-venue view, whatever the user did since (zoom, pan, floor or POI selection). Built on `view.goToGlobal()`.

## SDK usage

React Native sends `{ type: 'reset_map' }` from the feature's bridge hook:

```ts
// src/features/reset-view/bridge.ts
export const useResetViewBridge = () => {
  const { send } = useMapBridge();
  return {
    resetMap: () => send('reset_map'),
  };
};
```

The page calls the SDK:

```js
// src/features/reset-view/webview.js
core.register({
  reset_map: () => {
    core.view?.goToGlobal()
  },
})
```

## Things to know

- **`goToGlobal()` is an animation**, not an instant jump; it also switches the explore mode back to `'global'` at the end of the animation (see [Explore mode](explore-mode.md)).
- **It needs the view to exist**: only call it after `createView` has resolved.
- It goes back to the venue's own default framing, not to a previous camera position remembered by the app.

## Learn more

- [Go to place](goto-poi.md) — the opposite move, onto a single POI.
