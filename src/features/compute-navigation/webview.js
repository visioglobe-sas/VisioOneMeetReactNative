// compute-navigation: computes a route between two POIs and displays it. Also used
// as is by accessible-mode (isAccessible) and navigation-exclude-modalities
// (excludedAttributes). See docs/features/compute-navigation.md.
;(function (core) {
  'use strict'

  core.register({
    // excludedAttributes (navigation-exclude-modalities) is an optional array of
    // segment-particularity attribute strings (Segment.attributes) the computed route
    // must not use -- forwarded as-is into computeNavigation's own excludedAttributes
    // option. On this demo venue the attribute that excludes the elevator hop is
    // 'lift', not 'elevator' as the SDK's own JSDoc comment on excludedAttributes
    // misleadingly suggests -- see docs/features/navigation-exclude-modalities.md.
    // computeNavigation throws on an unknown origin/destination (or when no route
    // exists): the core reports it to React Native as a 'command_error'.
    start_itinerary: ({ origin, destination, isAccessible, excludedAttributes }) => {
      const venue = core.venue
      const view = core.view
      if (!venue || !view) {
        return
      }
      const navigation = venue.computeNavigation({
        origin,
        destination,
        isAccessible,
        type: 'fastest',
        firstNodeAsIntersection: false,
        mergeFloorChangeInstructions: false,
        excludedAttributes,
      })

      // Kept so custom-navigation-trace can restyle it.
      core.currentNavigationTrace = venue.createNavigationTrace(navigation)
      view.setCurrentNavigationTrace(core.currentNavigationTrace)
    },
  })
})(window.MapCore)
