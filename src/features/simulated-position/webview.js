// simulated-position: shows a tracked position moved by React Native. Also used by
// camera-lock-on-position, accuracy-circle-style and geofencing. The ping-pong
// interpolation loop itself lives on the React Native side
// (src/shared/positionTracking). See docs/features/simulated-position.md.
;(function (core) {
  'use strict'

  core.register({
    // Resolves both place IDs to positions (core.getPoiDisplayPosition) and reports
    // them back: a one-shot lookup.
    resolve_poi_positions: ({ originId, destinationId }) => {
      if (!core.venue) {
        return
      }
      const resolve = (placeId) => {
        const poi = core.findPoi(placeId)
        return poi ? core.getPoiDisplayPosition(poi) : null
      }
      const origin = resolve(originId)
      const destination = resolve(destinationId)
      if (!origin) {
        core.sendToNative({ type: 'position_simulation_error', data: { message: `POI not found: ${originId}` } })
        return
      }
      if (!destination) {
        core.sendToNative({ type: 'position_simulation_error', data: { message: `POI not found: ${destinationId}` } })
        return
      }
      core.sendToNative({ type: 'poi_positions_resolved', data: { origin, destination } })
    },

    // Sent on every tick of the native-side interpolation timer. injectTrackedPosition
    // requires allowTracking to already be true, or it throws -- set it once here
    // rather than requiring a separate message from native. Only on the false -> true
    // transition: every allowTracking = true re-locks the camera on the position
    // (lockCameraPositionOnTracking = true), which would undo a user's unlock/pan on
    // the very next tick.
    inject_tracked_position: ({ position, precisionCircleRadius }) => {
      const view = core.view
      if (!view) {
        return
      }
      if (!view.allowTracking) {
        view.allowTracking = true
      }
      view.injectTrackedPosition({ position, precisionCircleRadius })
    },

    // There's no dedicated "stop tracking" call on the SDK -- setting allowTracking
    // back to false is what removes the marker and its accuracy circle from the map.
    stop_position_simulation: () => {
      if (core.view) {
        core.view.allowTracking = false
      }
    },
  })
})(window.MapCore)
