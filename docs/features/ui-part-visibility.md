# UI visibility

## Description

Shows or hides each of the 5 parts of the map's default UI (`floorSelector`, `navigation`, `poiDetails`, `search`, `userTracking`) individually, with `view.setUIPartVisible(uiPart, isVisible)`. The widgets are drawn by the SDK itself; this feature shows that the host app controls their visibility live — e.g. to hide the SDK's search and replace it with its own.

## SDK usage

React Native sends `{ type: 'set_ui_part_visible', data: { uiPart, isVisible } }`, with `uiPart` typed to mirror the SDK's `UIPart`:

```ts
// src/features/ui-part-visibility/bridge.ts
export type UIPart = 'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking';

export const useUIPartVisibilityBridge = () => {
  const { send } = useMapBridge();
  return {
    setUIPartVisible: (uiPart: UIPart, isVisible: boolean) =>
      send('set_ui_part_visible', { uiPart, isVisible }),
  };
};
```

The page calls the SDK:

```js
// src/features/ui-part-visibility/webview.js
core.register({
  set_ui_part_visible: ({ uiPart, isVisible }) => {
    core.view?.setUIPartVisible(uiPart, isVisible)
  },
})
```

All parts are visible by default; the demo starts its 5 switches on and mirrors each change (the getter `view.isUIPartVisible(uiPart)` also exists).

## Things to know

- **Call it once the view exists** (after `createView` resolved); before that there is nothing to hide.
- **The 5 values are exact and case-sensitive** (`UIPart` in `View/View.d.ts` of the SDK typings). A misspelled value (`floorselector`, `UserTracking`...) is not rejected with an error: it silently changes nothing.
- **Hiding `search` or `navigation` removes the SDK's own entry point** to search or to start a navigation from its UI. If you hide them for good, provide your own entry point for these flows.

## Learn more

- [Native UI replacement](native-ui-replacement.md) — hides the SDK's floor selector and replaces it with the app's own.
