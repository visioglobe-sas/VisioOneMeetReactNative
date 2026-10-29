# Floor selector

## Description

Changes the displayed floor or building from the app's own list, kept in sync with the SDK's own floor-selector widget (still shown). Built on:

- `venue.venueLayout.buildings` (each `Building` with its `floors`) and `venue.translator.translateBuilding()` / `translateFloor()` for their display names.
- `view.goToFloor(floor)` / `view.goToBuilding(building)`.
- The View's `currentfloorchanged` event, with `view.currentBuilding` / `view.currentFloor`.

## SDK usage

Once the view is ready, the page adds the layout to the `ready` message:

```js
// src/features/floor-selector/webview.js
core.onReady((view) => {
  const venue = core.venue
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
  return {
    buildings,
    currentBuildingId: view.currentBuilding?.id,
    currentFloorId: view.currentFloor?.id,
  }
})
```

and reports every floor change, whoever caused it:

```js
// src/features/floor-selector/webview.js
core.onViewCreated((view) => {
  view.addEventListener('currentfloorchanged', () => {
    core.sendToNative({
      type: 'floor_changed',
      data: {
        buildingId: view.currentBuilding?.id,
        floorId: view.currentFloor?.id,
      },
    })
  })
})
```

React Native keeps the layout and the current floor from these two messages, and sends `{ type: 'select_floor', data: { buildingId, floorId } }` (`goToFloor`), or without `floorId` (`goToBuilding`):

```ts
// src/features/floor-selector/bridge.ts
export const useFloorSelectorBridge = () => {
  const { send } = useMapBridge();
  const [venueLayout, setVenueLayout] = React.useState<VenueLayoutInfo>({ buildings: [] });

  useMapEvent('ready', (data) =>
    setVenueLayout({
      buildings: data?.buildings ?? [],
      currentBuildingId: data?.currentBuildingId,
      currentFloorId: data?.currentFloorId,
    }),
  );
  useMapEvent('floor_changed', (data) =>
    setVenueLayout((prev) => ({
      ...prev,
      currentBuildingId: data.buildingId,
      currentFloorId: data.floorId,
    })),
  );

  return {
    venueLayout,
    // view.goToFloor(floor) in the page.
    goToFloor: (buildingId: string, floorId: string) => send('select_floor', { buildingId, floorId }),
    // view.goToBuilding(building) in the page.
    goToBuilding: (buildingId: string) => send('select_floor', { buildingId }),
  };
};
```

The page resolves the ids into SDK objects:

```js
// src/features/floor-selector/webview.js
core.register({
  select_floor: ({ buildingId, floorId }) => {
    const view = core.view
    if (!view) {
      return
    }
    const building = core.venue.venueLayout.buildings.find((b) => b.id === buildingId)
    if (!building) {
      return
    }
    if (floorId) {
      const floor = building.floors.find((f) => f.id === floorId)
      if (floor) {
        view.goToFloor(floor)
      }
    } else {
      view.goToBuilding(building)
    }
  },
})
```

## Things to know

- **`Floor` and `Building` have no label field.** Use `venue.translator.translateBuilding/translateFloor(entity, venue.currentLocale).name`, the same source as the SDK's widget, so both selectors show the same names. Raw ids are often technical.
- **Listen to `currentfloorchanged`**: the floor also changes from the SDK's own widget or from camera moves; without the listener, the app's highlight gets out of sync.
- **`view.goToFloor` and `view.goToBuilding` take SDK objects**, not ids: look them up in `venue.venueLayout.buildings` first.
- Sort floors by `levelIndex` (highest first) to match a physical floor selector.

## Learn more

- [Native UI replacement](native-ui-replacement.md) — the same list, with the SDK's widget hidden.
- [Explore mode](explore-mode.md) — how the camera explores buildings and floors.
