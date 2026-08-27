# Explore Mode

## Description

Drives the SDK's 3 building-exploration modes from the app — a segmented control (Global / Building / Floor) in the feature's panel — built on a single settable property, `view.currentExploreMode`. The flagship mode, `'building'`, presents every opened building as an exploded "carousel" view: a strong, easy-to-trigger visual for a sales demo or kiosk.

## SDK usage

```ts
// useVisioMap.ts
export type ExploreMode = 'global' | 'building' | 'floor';

const setExploreMode = (mode: ExploreMode) => {
  sendMessage({ type: 'set_explore_mode', data: { mode } });
};
```

```js
// visioOneHtml.ts / visioOne.html
const setExploreMode = (mode) => {
  if (view) {
    view.currentExploreMode = mode
  }
}
```

`view.currentExploreMode: ExploreMode` — a plain settable property, not a method call. Assigning it triggers the mode transition immediately.

The mode also changes on its own from direct camera/map interaction (not just from this app's calls) — e.g. clicking while in `'building'` mode auto-switches to `'floor'` (see "Things to know" below). The app listens for `'exploremodechanged'` to stay in sync with that:

```js
// visioOneHtml.ts / visioOne.html, registered once on the View right after createView()
v.addEventListener('exploremodechanged', (event) => {
  sendToNative({
    type: 'explore_mode_changed',
    data: { currentExploreMode: event.currentExploreMode },
  })
})
```

`addEventListener('exploremodechanged', listener: (event: ExploreModeEvent) => void): void` — `event.currentExploreMode` carries the new mode. Fired for every transition, whichever triggered it: this app's own `setExploreMode` call, a different call that has the side effect of changing it (e.g. `view.goToGlobal()`, which always ends in `'global'`), or direct camera/click interaction.

## Things to know

- **The 3 modes, precisely:**
  - `'global'` — normal outside view. Moving the camera in or out of a building opens or closes it.
  - `'building'` — the outside is hidden; every currently-opened building is shown as an exploded "carousel". The active floor can be changed with the mouse wheel or by sliding vertically. A click switches to `'floor'` mode automatically.
  - `'floor'` — only the current floor is shown.
- **`'building'` mode auto-transitions to `'floor'` on click.** This is the SDK driving the change on its own, not a bug or something this demo added — the app finds out about it the same way it finds out about any other externally-triggered change, through `'exploremodechanged'`.
- **Entering `'building'` mode with no building currently open still works.** The SDK falls back to the venue's first building on its own, so the carousel effect is reachable with a single tap from `'global'` without the app needing to open a building first.
- **Not exclusively driven by this property.** Other calls have `currentExploreMode` as a side effect — e.g. `view.goToGlobal()`'s doc comment states the mode "will be changed to `'global'` at the end of this animation". Anything that can change the mode does so through the same property and fires the same event, so a single listener is enough to stay in sync regardless of the trigger.

## Learn more

- [Floor Selector](floor-selector.md) — the sibling feature this one shares its "SDK event can change state outside the app's own calls" idiom with (`currentfloorchanged` there, `exploremodechanged` here).
