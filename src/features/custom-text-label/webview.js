// custom-text-label: places a styled text label owned by an existing POI. See
// docs/features/custom-text-label.md.
;(function (core) {
  'use strict'

  // Live SDK Label objects (venue.createLabel) only exist here, keyed by an id chosen
  // by the app -- native only ever refers to them by that id over the bridge.
  const textLabels = new Map()

  core.register({
    // Creates a Label owned by the anchor POI itself (no createPOI needed), at the
    // position copied from it via core.resolveAnchorPoi, slightly offset
    // (core.offsetPosition). Always passes height explicitly: createLabel defaults
    // height to width otherwise (a square box in which the text wraps and scales
    // oddly). Replies with 'text_label_create_result' -- empty text, a missing POI or a
    // POI without a position are normal outcomes, reported with ok: false + reason
    // rather than thrown. moveCamera is false when the app only recreates the label to
    // change its rotation (rotation can't be changed with updateLabel).
    create_text_label: ({ labelId, anchorId, options, moveCamera }) => {
      const venue = core.venue
      if (!venue) {
        return
      }
      const fail = (reason, message) => {
        core.sendToNative({ type: 'text_label_create_result', data: { ok: false, labelId, anchorId, reason, message } })
      }
      const text = typeof options.text === 'string' ? options.text.trim() : ''
      if (!text) {
        // createLabel would throw "Cannot create Label, text is required".
        fail('empty_text')
        return
      }
      // Skip our own currently tracked label when copying the anchor's position.
      const anchor = core.resolveAnchorPoi(anchorId, [textLabels.get(labelId)])
      if (anchor.reason) {
        fail(anchor.reason)
        return
      }
      // Only one Label per id: replace any previous one rather than leaking it.
      const previous = textLabels.get(labelId)
      if (previous) {
        venue.removeLabel(previous)
        textLabels.delete(labelId)
      }
      try {
        const created = venue.createLabel({
          poi: anchor.poi,
          position: core.offsetPosition(anchor.position),
          width: options.width,
          height: options.height,
          text,
          color: options.color,
          rotation: options.rotation,
        })
        textLabels.set(labelId, created)
        // A Label is only rendered while its POI's floor is displayed, and the default
        // whole-venue view doesn't show indoor floors: move the camera onto the anchor.
        if (core.view && moveCamera !== false) {
          core.moveCameraToPoi(anchor.poi)
        }
        core.sendToNative({ type: 'text_label_create_result', data: { ok: true, labelId, anchorId } })
      } catch (error) {
        fail('sdk_error', core.errorMessage(error))
      }
    },

    // Live update of an already-placed Label: any of text / color / width+height. width
    // and height are always sent together by the app -- updateLabel with width alone
    // also sets height = width. rotation is deliberately not accepted here: it isn't
    // part of LabelUpdateOptions (the app recreates the label instead).
    // Fire-and-forget: a no-op if nothing is placed under that id.
    update_text_label: ({ labelId, update }) => {
      const tracked = textLabels.get(labelId)
      if (!core.venue || !tracked) {
        return
      }
      const options = {}
      if (typeof update.text === 'string') {
        const text = update.text.trim()
        if (!text) {
          return
        }
        options.text = text
      }
      if (update.color !== undefined) {
        options.color = update.color
      }
      if (update.width !== undefined && update.height !== undefined) {
        options.width = update.width
        options.height = update.height
      }
      try {
        core.venue.updateLabel(tracked, options)
      } catch (error) {
        console.error('updateLabel failed', error)
      }
    },

    // Fire-and-forget: a no-op if nothing is placed under that id (removeLabel itself
    // throws "Provided label is not registered" on a second call).
    remove_text_label: ({ labelId }) => {
      const tracked = textLabels.get(labelId)
      if (!core.venue || !tracked) {
        return
      }
      core.venue.removeLabel(tracked)
      textLabels.delete(labelId)
    },
  })
})(window.MapCore)
