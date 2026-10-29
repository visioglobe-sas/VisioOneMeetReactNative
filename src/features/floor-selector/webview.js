// floor-selector: reports the venue's buildings/floors and the current floor, and
// moves the camera to a floor or building on request. Also used as is by
// native-ui-replacement. See docs/features/floor-selector.md.
;(function (core) {
  'use strict'

  core.onReady((view) => {
    const venue = core.venue
    // Only plain serializable fields survive the WebView postMessage boundary -- labels
    // are resolved through venue.translator so they match whatever the SDK's own
    // floor-selector widget displays, rather than raw (often non human-readable)
    // floor/building ids.
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

  core.onViewCreated((view) => {
    // Keeps the native floor-selector UI's highlighted floor in sync even when the
    // SDK's own default floor-selector widget (visible by default) is the one driving
    // the change -- e.g. the user taps it directly instead of the app's own control.
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

  core.register({
    // With a floorId: view.goToFloor(floor). Without: view.goToBuilding(building).
    // Unknown ids are a silent no-op.
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
})(window.MapCore)
