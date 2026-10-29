// geofencing: a "zone" is just an existing POI's Surface polygon -- there's no separate
// geofence concept on the SDK. The point-in-polygon check itself happens on the React
// Native side, piggybacked on simulated-position's tick loop. See
// docs/features/geofencing.md.
;(function (core) {
  'use strict'

  core.register({
    // Reports every surface's WGS84 boundary vertices back to native (a POI can have
    // more than one Surface).
    resolve_geofence_zone: ({ placeId }) => {
      if (!core.venue) {
        return
      }
      const poi = core.findPoi(placeId)
      if (!poi) {
        core.sendToNative({ type: 'geofence_zone_error', data: { message: `POI not found: ${placeId}` } })
        return
      }
      if (!poi.surfaces || poi.surfaces.length === 0) {
        core.sendToNative({
          type: 'geofence_zone_error',
          data: { message: `Zone POI has no surface geometry: ${placeId}` },
        })
        return
      }
      core.sendToNative({
        type: 'geofence_zone_resolved',
        data: {
          placeId,
          surfaces: poi.surfaces.map((surface) =>
            surface.positions.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
          ),
        },
      })
    },

    // Flags the zone POI's surfaces as "alert" (entered) or back to their
    // bundle-defined color (left) -- 'initial' is the same SurfaceUpdateOptions
    // sentinel used by clickable-surface/category-highlight.
    set_geofence_alert: ({ placeId, active }) => {
      const venue = core.venue
      if (!venue) {
        return
      }
      const poi = core.findPoi(placeId)
      if (!poi) {
        return
      }
      poi.surfaces.forEach((surface) => {
        venue.updateSurface(surface, { color: active ? '#E74C3C' : 'initial' })
      })
    },
  })
})(window.MapCore)
