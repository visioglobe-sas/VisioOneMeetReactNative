# Native UI Replacement

## Description

Hides the SDK's own floor-selector widget and drives floor/building changes entirely from the app's existing native picker — the same one built for [Floor Selector](floor-selector.md), reused here without changes. Where the floor-selector feature keeps the SDK's widget and the app's own list on screen at once (each staying in sync with the other), this feature demonstrates the opposite case: an app can fully white-label that part of the UI, showing only its own control, with no visual duplication.

This is built on a single call already introduced by [UI Visibility](ui-part-visibility.md) — `view.setUIPartVisible('floorSelector', false)` — applied specifically to the `floorSelector` part rather than exposed as one of five generic switches.

## SDK usage

```ts
// useVisioMap.ts (unchanged — the same setUIPartVisible already added for ui-part-visibility)
const setUIPartVisible = (uiPart: UIPart, isVisible: boolean) => {
  sendMessage({ type: 'set_ui_part_visible', data: { uiPart, isVisible } });
};
```

```js
// visioOneHtml.ts / visioOne.html (unchanged — same handler as ui-part-visibility)
const setUIPartVisible = (uiPart, isVisible) => {
  if (view) {
    view.setUIPartVisible(uiPart, isVisible)
  }
}
```

`view.setUIPartVisible(uiPart: UIPart, isVisible: boolean): void` — `uiPart` must be one of the SDK's exact, case-sensitive `View.UIPart` values (`'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking'`); this feature only ever passes `'floorSelector'`. Requires the view to already exist (called only after the venue's `ready` state, once `createView(...)` has resolved).

This screen calls `setUIPartVisible('floorSelector', false)` once, as soon as the map reports ready — the SDK widget starts hidden, not merely hidden-after-first-interaction. A toggle then lets it be shown again (`setUIPartVisible('floorSelector', true)`), so a visitor can compare the SDK's own widget and the app's native picker side by side, live, rather than take the replacement on faith. Regardless of the toggle, floor/building changes themselves keep going through `goToFloor`/`goToBuilding` (`view.goToFloor(floor)` / `view.goToBuilding(building)`), exactly as in [Floor Selector](floor-selector.md) — the app's picker never depends on the SDK widget's visibility to work.

## Things to know

- **This is a one-line variation on `ui-part-visibility`, not a new SDK capability.** The only difference from that feature is *which* `UIPart` gets toggled and what replaces it visually — `setUIPartVisible`'s behavior, preconditions, and gotchas (must be called after `ready`, exact case-sensitive part names, silent no-op on a bad value) are documented once in [UI Visibility](ui-part-visibility.md) and apply here unchanged.
- **Hiding a default UI part never disables the underlying data or API it exposes.** `venue.venueLayout.buildings`, `view.goToFloor`/`goToBuilding`, and the `currentfloorchanged` event all keep working exactly as they do in [Floor Selector](floor-selector.md) whether or not the SDK's own widget is visible — `setUIPartVisible` only ever affects rendering, never capability. That's what makes a full native replacement possible at all: nothing about the app's own picker changes when the SDK widget is hidden.

## Learn more

- [UI Visibility](ui-part-visibility.md) — the general-purpose `setUIPartVisible` feature this one specializes, covering all 5 `UIPart` values and their individual gotchas.
- [Floor Selector](floor-selector.md) — the native floor/building picker reused as-is here, including why floor/building labels come from `venue.translator` rather than raw IDs.
