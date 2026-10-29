// accuracy-circle-style: restyles the tracked position's precision circle. See
// docs/features/accuracy-circle-style.md.
;(function (core) {
  'use strict'

  core.register({
    // color/opacity apply to the precision circle (not the center arrow image). The
    // SDK only stores them -- they're applied on the next injectTrackedPosition call --
    // and resets them to its defaults (#0094f0, 0.3) whenever allowTracking goes back
    // to false, so React Native re-sends the current selection on every Start. Throws
    // on an invalid color or a non-number opacity.
    set_position_tracker_style: ({ color, opacity }) => {
      if (!core.view) {
        return
      }
      try {
        core.view.updatePositionTrackerGraphicOptions({ color, opacity })
      } catch (error) {
        console.error('Updating position tracker graphic options failed', error)
      }
    },
  })
})(window.MapCore)
