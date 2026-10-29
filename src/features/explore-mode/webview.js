// explore-mode: drives the SDK's 3 building-exploration modes and mirrors the current
// one to React Native. See docs/features/explore-mode.md.
;(function (core) {
  'use strict'

  // The SDK's own default (see ExploreMode.d.ts in the SDK typings) -- 'global' at this
  // point since createView just resolved and nothing has changed it yet.
  core.onReady((view) => ({ currentExploreMode: view.currentExploreMode }))

  core.onViewCreated((view) => {
    // Keeps the native explore-mode UI's highlighted option in sync even when the mode
    // changes from direct camera/map interaction rather than a set_explore_mode
    // message from native -- e.g. a click while in 'building' mode auto-switches to
    // 'floor' on its own (see ExploreMode.d.ts in the SDK typings).
    view.addEventListener('exploremodechanged', (event) => {
      core.sendToNative({
        type: 'explore_mode_changed',
        data: { currentExploreMode: event.currentExploreMode },
      })
    })
  })

  core.register({
    // Just an assignment -- view.currentExploreMode is a plain settable property, not a
    // method (see View.d.ts in the SDK typings). Entering 'building' mode with no
    // building currently open falls back to the venue's first building on its own (the
    // SDK's own behavior, not something this demo has to arrange), so the "carousel"
    // effect is reachable from 'global' with a single tap. The resulting mode -- this
    // call's or a later camera/click-driven change -- is reported back via the
    // 'exploremodechanged' listener above, not from here.
    set_explore_mode: ({ mode }) => {
      if (core.view) {
        core.view.currentExploreMode = mode
      }
    },
  })
})(window.MapCore)
