// dynamic-poi-crud: creates, edits and removes a POI at runtime. See
// docs/features/dynamic-poi-crud.md.
;(function (core) {
  'use strict'

  // Only one dynamically-created POI/Label pair is tracked at a time (this demo's own
  // choice, not an SDK limit) -- the live SDK objects only exist here, native only
  // holds the display id/text it gets back over the bridge.
  let dynamicPoi = null
  let dynamicLabel = null

  core.register({
    // A bare POI created via venue.createPOI() has no visual representation of its
    // own -- its images/labels/lines/surfaces/markers arrays all start empty -- so this
    // demo makes it visible by attaching a Label at a position copied from an existing
    // "anchor" POI (there's no tap-to-place UI here), see core.resolveAnchorPoi.
    create_dynamic_poi: ({ newId, anchorId, labelText }) => {
      const venue = core.venue
      if (!venue) {
        return
      }
      if (dynamicPoi) {
        // The app disables Create while a dynamic POI is tracked -- this is only a
        // backstop.
        core.sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: 'already_tracked' } })
        return
      }
      const anchor = core.resolveAnchorPoi(anchorId)
      if (anchor.reason) {
        core.sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: anchor.reason } })
        return
      }
      const { position } = anchor
      let poi
      try {
        // The SDK's own doc comment documents exactly one failure mode here:
        // POIAlreadyExistsError when newId is already used in the venue. Reported as a
        // normal outcome without checking the error class: the CDN build doesn't
        // export the SDK's error classes, so instanceof isn't available here.
        poi = venue.createPOI({ id: newId })
      } catch (error) {
        core.sendToNative({
          type: 'dynamic_poi_create_result',
          data: {
            ok: false,
            reason: 'duplicate_id',
            message: core.errorMessage(error),
          },
        })
        return
      }
      const label = venue.createLabel({ poi, position, width: 2, text: labelText })
      dynamicPoi = poi
      dynamicLabel = label
      core.sendToNative({ type: 'dynamic_poi_create_result', data: { ok: true, id: newId, text: labelText } })
    },

    // updatePOI (POIUpdateOptions) can only ever change categories, never anything
    // visual -- so "editing" the dynamic POI's visible content means updating its
    // attached Label's text instead. Fire-and-forget: always valid while a dynamic POI
    // is tracked, since the app disables this control otherwise.
    update_dynamic_poi_label: ({ text }) => {
      if (!core.venue || !dynamicLabel) {
        return
      }
      core.venue.updateLabel(dynamicLabel, { text })
    },

    // removePOI cascades: removing the POI also removes its attached Label from the
    // view, no separate removeLabel call needed.
    remove_dynamic_poi: () => {
      if (!core.venue || !dynamicPoi) {
        return
      }
      core.venue.removePOI(dynamicPoi)
      dynamicPoi = null
      dynamicLabel = null
    },
  })
})(window.MapCore)
