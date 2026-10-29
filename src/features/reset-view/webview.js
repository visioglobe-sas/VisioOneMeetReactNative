// reset-view: back to the whole-venue view. See docs/features/reset-view.md.
;(function (core) {
  'use strict'

  core.register({
    reset_map: () => {
      core.view?.goToGlobal()
    },
  })
})(window.MapCore)
