// 3d-icon-marker: places an image icon in the 3D scene, owned by an existing POI. See
// docs/features/3d-icon-marker.md.
;(function (core) {
  'use strict'

  // Live SDK Image objects (venue.createImage) only exist here, keyed by an id chosen
  // by the app -- native only ever refers to them by that id over the bridge.
  const iconMarkers = new Map()

  core.register({
    // Creates an Image owned by the anchor POI itself (no createPOI needed), at the
    // position copied from it via core.resolveAnchorPoi. width/height are in meters and
    // url can be any image URL, including a data: URL. Replies with
    // 'icon_marker_create_result' -- a missing POI or a POI without a position are
    // normal outcomes, reported with ok: false + reason rather than thrown.
    create_icon_marker: ({ imageId, anchorId, options }) => {
      const venue = core.venue
      if (!venue) {
        return
      }
      // Skip our own current icon (it lands in the anchor's poi.images).
      const anchor = core.resolveAnchorPoi(anchorId, [iconMarkers.get(imageId)])
      if (anchor.reason) {
        core.sendToNative({ type: 'icon_marker_create_result', data: { ok: false, imageId, anchorId, reason: anchor.reason } })
        return
      }
      // Only one Image per id: replace any previous one rather than leaking it.
      const previous = iconMarkers.get(imageId)
      if (previous) {
        venue.removeImage(previous)
        iconMarkers.delete(imageId)
      }
      try {
        const created = venue.createImage({
          poi: anchor.poi,
          position: anchor.position,
          width: options.width,
          height: options.height,
          url: options.url,
          orientationType: options.orientationType,
        })
        iconMarkers.set(imageId, created)
        // The default whole-venue view doesn't show indoor floors, so the new Image
        // would be invisible without moving the camera onto its anchor POI.
        if (core.view) {
          core.moveCameraToPoi(anchor.poi)
        }
        core.sendToNative({ type: 'icon_marker_create_result', data: { ok: true, imageId, anchorId } })
      } catch (error) {
        core.sendToNative({
          type: 'icon_marker_create_result',
          data: {
            ok: false,
            imageId,
            anchorId,
            reason: 'sdk_error',
            message: core.errorMessage(error),
          },
        })
      }
    },

    // Live update of an already-placed Image -- only orientationType is changed here,
    // but venue.updateImage also accepts width/position/rotation/url/isVisible.
    // Fire-and-forget: a no-op if nothing is placed under that id.
    update_icon_marker_orientation: ({ imageId, orientationType }) => {
      const tracked = iconMarkers.get(imageId)
      if (!core.venue || !tracked) {
        return
      }
      core.venue.updateImage(tracked, { orientationType })
    },

    // Fire-and-forget: a no-op if nothing is placed under that id.
    remove_icon_marker: ({ imageId }) => {
      const tracked = iconMarkers.get(imageId)
      if (!core.venue || !tracked) {
        return
      }
      core.venue.removeImage(tracked)
      iconMarkers.delete(imageId)
    },
  })
})(window.MapCore)
