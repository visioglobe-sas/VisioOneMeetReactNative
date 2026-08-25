# Floor Selector

## Description

Switches the displayed floor or building via `view.goToFloor(floor)` / `view.goToBuilding(building)`, reading the venue's floor/building structure from `venue.venueLayout.buildings`. The SDK already renders its own default floor-selector widget (the `floorSelector` UI part, on by default — see [UI Visibility](ui-part-visibility.md)); this is for driving floor/building changes from your own UI, instead of or alongside that widget.

## SDK usage

```ts
// useVisioMap.ts
const goToFloor = (buildingId: string, floorId: string) => {
  sendMessage({ type: 'select_floor', data: { buildingId, floorId } });
};

const goToBuilding = (buildingId: string) => {
  sendMessage({ type: 'select_floor', data: { buildingId } });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const goToFloor = (buildingId, floorId) => {
  if (view) {
    const building = venue.venueLayout.buildings.find((b) => b.id === buildingId)
    if (building) {
      if (floorId) {
        const floor = building.floors.find((f) => f.id === floorId)
        if (floor) {
          view.goToFloor(floor)
        }
      } else {
        view.goToBuilding(building)
      }
    }
  }
}
```

Reading the venue's structure to build a floor/building list, e.g. to send to the app once ready:

```js
const buildings = venue.venueLayout.buildings.map((building) => ({
  id: building.id,
  label: venue.translator.translateBuilding(building, venue.currentLocale).name,
  defaultFloorID: building.defaultFloorID,
  floors: building.floors.map((floor) => ({
    id: floor.id,
    label: venue.translator.translateFloor(floor, venue.currentLocale).name,
    levelIndex: floor.levelIndex,
  })),
}))
```

Keeping an app-side floor/building selector in sync with the SDK's own widget (or any other trigger of a floor change):

```js
v.addEventListener('currentfloorchanged', () => {
  sendToNative({
    type: 'floor_changed',
    data: { buildingId: v.currentBuilding?.id, floorId: v.currentFloor?.id },
  })
})
```

## Things to know

- `Floor` and `Building` objects have no `label` field of their own (only `id`, and for `Floor`, `altitude`/`levelIndex`). Human-readable names come from `venue.translator.translateBuilding(building, locale)` / `translateFloor(floor, locale)` — the same source the SDK's own floor-selector widget uses, so labels stay consistent between a custom selector and the default one. Don't display raw `id`s as labels; venue IDs aren't guaranteed to be human-readable (e.g. `bldg_a3f1`).
- `view.goToFloor(floor)` and `view.goToBuilding(building)` both take the actual `Floor`/`Building` object, not an ID — resolve the ID against `venue.venueLayout.buildings` first.
- The `currentfloorchanged` event on `View` fires for *any* floor/building change, including ones triggered by the SDK's own default widget, not just ones your code initiated. Listen for it if you're keeping your own UI's "current floor" highlight in sync, or it will drift whenever the user taps the SDK's built-in selector instead of your controls.
- `venue.venueLayout.buildings` is the full structure (all buildings/floors of the venue) — resolve `buildingId`/`floorId` against it rather than assuming a fixed number of floors or buildings; some venues have only one of each.

## Learn more

- [Go to Place](goto-poi.md) — the equivalent bridge pattern for POI selection (`select_place`/`clear_place`).
- [UI Visibility](ui-part-visibility.md) — for hiding the SDK's own default floor-selector widget if you replace it entirely.
