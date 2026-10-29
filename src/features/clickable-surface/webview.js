// clickable-surface: makes a POI's surfaces interactive. See
// docs/features/clickable-surface.md.
;(function (core) {
  'use strict'

  core.register({
    // Once isInteractive is true, the SDK itself swaps the surface's displayed color
    // on hover/tap using hoverColor/selectionColor -- no click listener is needed on
    // this side for that visual feedback. Passing color: 'initial' when disabling
    // resets the surface to whatever the map bundle originally defined, instead of
    // leaving it stuck on the last custom color.
    set_surface_interactive: ({ placeId, interactive }) => {
      const venue = core.venue
      if (!venue) {
        return
      }
      const poi = core.findPoi(placeId)
      if (!poi) {
        return
      }
      poi.surfaces.forEach((surface) => {
        venue.updateSurface(
          surface,
          interactive
            ? { isInteractive: true, color: '#2ECC71', hoverColor: '#F1C40F', selectionColor: '#E74C3C' }
            : { isInteractive: false, color: 'initial' }
        )
      })
    },
  })
})(window.MapCore)
