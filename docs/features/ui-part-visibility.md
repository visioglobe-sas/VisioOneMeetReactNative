# UI Visibility

## Description

Shows or hides individual parts of the map's default UI via `view.setUIPartVisible(uiPart, isVisible)`, a method on the `view` returned by `createView()`. A symmetric getter, `view.isUIPartVisible(uiPart)`, also exists but isn't used in this example.

## SDK usage

```ts
// useVisioMap.ts
export type UIPart = 'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking';

const setUIPartVisible = (uiPart: UIPart, isVisible: boolean) => {
  sendMessage({ type: 'set_ui_part_visible', data: { uiPart, isVisible } });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const setUIPartVisible = (uiPart, isVisible) => {
  if (view) {
    view.setUIPartVisible(uiPart, isVisible)
  }
}
```

## Things to know

- `uiPart` accepts exactly five case-sensitive string values: `floorSelector`, `navigation`, `poiDetails`, `search`, `userTracking` — no others exist (see the SDK's `View.UIPart` type). A typo (`floorselector`, `UserTracking`, …) is not rejected with an error; it silently fails to change anything.
- Requires the view to already exist — like other `View` methods, calling it before `createView(...)` resolves is a no-op, not an exception, so guard on `view` being set (or wait for the SDK's `ready` event) if you call it before your UI is otherwise gated on the map being ready.
- All five parts default to visible on a fresh `createView()` — there is no need to call `setUIPartVisible` at all if the SDK's defaults already match what you want.
- Hiding `search` or `navigation` removes the SDK's *only* built-in entry point for those flows — they aren't purely decorative. If you hide either permanently in a real integration, provide your own UI entry point for the equivalent flow before doing so.

## Learn more

- [Floor Selector](floor-selector.md) — another feature that coexists with a default SDK widget (`floorSelector`) rather than replacing it.
