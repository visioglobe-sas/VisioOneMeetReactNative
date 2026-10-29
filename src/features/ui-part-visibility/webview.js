// ui-part-visibility: shows/hides the SDK's own UI parts. Also used by
// native-ui-replacement. See docs/features/ui-part-visibility.md.
;(function (core) {
  'use strict'

  core.register({
    // uiPart must be one of the SDK's exact, case-sensitive View.UIPart values:
    // 'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking'.
    set_ui_part_visible: ({ uiPart, isVisible }) => {
      core.view?.setUIPartVisible(uiPart, isVisible)
    },
  })
})(window.MapCore)
