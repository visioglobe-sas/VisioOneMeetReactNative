// occupancy-simulated: recolors a POI's surfaces with the color React Native sends on
// every tick of its simulation timer. See docs/features/occupancy-simulated.md.
;(function (core) {
  'use strict'

  core.register({
    update_occupancy: ({ occupancy }) => {
      const venue = core.venue
      if (!venue) {
        return
      }
      occupancy.forEach((entry) => {
        const poi = core.findPoi(entry.planId)
        if (!poi) {
          return
        }
        poi.surfaces.forEach((surface) => {
          venue.updateSurface(surface, { color: entry.color })
        })
      })
    },
  })
})(window.MapCore)
