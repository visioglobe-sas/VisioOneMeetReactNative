// custom-navigation-trace: restyles the route compute-navigation last displayed
// (core.currentNavigationTrace). See docs/features/custom-navigation-trace.md.
;(function (core) {
  'use strict'

  core.register({
    // venue.updateNavigationTrace(trace, style), colors only
    // (NavigationTraceUpdateOptions). A no-op if no itinerary has been computed yet.
    // venue.updateNavigationTrace() throws internally on this demo venue (TypeError
    // reading 'material' deep in the SDK's line-rendering pipeline) even though every
    // color is still applied correctly before it throws -- caught here so it doesn't
    // surface as an uncaught WebView error. Not our bug to fix.
    update_navigation_trace: ({ style }) => {
      if (!core.venue || !core.currentNavigationTrace) {
        return
      }
      try {
        core.venue.updateNavigationTrace(core.currentNavigationTrace, style)
      } catch (error) {
        console.warn('updateNavigationTrace threw (trace styling still applied):', error)
      }
    },
  })
})(window.MapCore)
