# Clickable Surface

## Description

Makes a place (POI)'s surface(s) interactive, via `venue.updateSurface(surface, { isInteractive: true, ... })`. Once a surface is interactive, the SDK itself swaps its displayed color on hover (desktop) and on tap/selection — no click listener is needed on the app side for that visual feedback.

This is the base building block for any "availability" use case (a free/occupied room, a parking spot): the color swap here is static and manually toggled, but the same `isInteractive` + color options are what a real availability feature would layer real data on top of — see [Simulated Occupancy](occupancy-simulated.md) for the data-driven counterpart, which colors a surface without needing it to be clickable at all.

## SDK usage

```ts
// useVisioMap.ts
const setSurfaceInteractive = (placeId: string, interactive: boolean) => {
  sendMessage({ type: 'set_surface_interactive', data: { placeId, interactive } });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const setSurfaceInteractive = (placeId, interactive) => {
  if (!venue) {
    return
  }
  const poi = venue.pois.find((p) => p.id === placeId)
  if (!poi) {
    return
  }
  poi.surfaces.forEach((surface) => {
    venue.updateSurface(
      surface,
      interactive
        ? { isInteractive: true, color: '#2ECC71', hoverColor: '#F1C40F', selectionColor: '#E74C3C' }
        : { isInteractive: false, color: 'initial' }
    )
  })
}
```

`SurfaceUpdateOptions` (the second argument to `updateSurface`) has four fields relevant here:

- `isInteractive: boolean` — when `true`, the surface becomes pickable: it starts firing pointer/click events and reacting to hover/selection. When `false`, it goes back to a plain, non-interactive shape.
- `color: Color | 'initial'` — the surface's idle color. `'initial'` resets it to whatever the map bundle originally defined, which matters when turning interactivity off so the surface doesn't stay stuck on a previously-set custom color.
- `hoverColor: Color | 'default'` — color while the pointer hovers the surface (desktop only; moot on a touch device, but harmless to set). `'default'` falls back to the view-wide `View.surfaceHoverColor`.
- `selectionColor: Color | 'default'` — color while the surface is in the SDK's clicked/selected state. `'default'` falls back to the view-wide `View.surfaceSelectionColor`. This is the part that's visible on mobile: tapping the surface makes it swap to this color, entirely SDK-managed.

A POI can have multiple surfaces; `updateSurface` is called once per surface so the whole POI's footprint reacts, not just part of it.

## Things to know

- **`isInteractive` gates picking entirely, not just the color swap.** A non-interactive surface never fires a `poiclick` (or any pointer) event in the first place — the SDK's hit-testing skips it. So enabling interactivity is also a precondition for any click-based logic layered on top of this feature, not only for the automatic hover/selection coloring.
- **`hoverColor`/`selectionColor` only take effect while `isInteractive` is `true`.** Setting them alongside `isInteractive: false` (or on a surface that was never made interactive) has no visible effect.
- **`color: 'initial'` and `hoverColor`/`selectionColor: 'default'` are distinct reset values**, not interchangeable: `'initial'` restores the surface's own bundle-defined color, while `'default'` on hover/selection falls back to the view-wide `View.surfaceHoverColor`/`View.surfaceSelectionColor` instead of any per-surface value.
- **`placeId` must be a real POI ID from the loaded venue.** As with [Simulated Occupancy](occupancy-simulated.md), `venue.pois.find((p) => p.id === placeId)` fails silently (no error surfaced) if the ID doesn't match anything — validate against the actual venue data (e.g. via VisioMapEditor).
- The color swap on tap is entirely SDK-managed rendering state; it does not, by itself, produce any application-level notion of "selected" that persists across a screen reload or that the app can read back — read the actual clicked-POI payload from a `poiclick`/pointer event if the app needs to react to the tap itself, not just show the color change.

## Learn more

- [Simulated Occupancy](occupancy-simulated.md) — colors a surface from external data via the same `venue.updateSurface` call, without requiring `isInteractive`.
- [Go to Place](goto-poi.md) — another use of `venue.updateSurface`'s `selectionColor`, driven by app code instead of the SDK's own click handling.
- [Tap a Place](poi-click.md) — reading the actual clicked-POI payload from a pointer event, for building click-driven logic on top of an interactive surface.
