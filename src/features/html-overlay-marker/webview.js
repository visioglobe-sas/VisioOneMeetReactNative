// html-overlay-marker: places a tappable HTML badge owned by an existing POI. See
// docs/features/html-overlay-marker.md.
;(function (core) {
  'use strict'

  // Live SDK Marker objects (venue.createMarker) only exist here, keyed by an id
  // chosen by the app -- native only ever refers to them by that id over the bridge.
  // Each entry is { marker, tapCount }.
  const htmlMarkers = new Map()

  // Inline style of the badge element. Deliberately no transform / translate /
  // position / top / left: the SDK owns those on the marker element (it centers it on
  // the position and moves it every frame).
  const HTML_MARKER_STYLE =
    'background:#0B6BCB;color:#FFFFFF;font:600 14px sans-serif;padding:6px 12px;' +
    'border-radius:14px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer'

  core.register({
    // Creates an HTML marker owned by the anchor POI itself (no createPOI needed), at
    // the position copied from it via core.resolveAnchorPoi, offset like
    // custom-text-label (core.offsetPosition) so the badge doesn't cover the POI's own
    // label. Validates everything BEFORE touching the current badge: a failed create
    // leaves it in place. Replies with 'html_marker_create_result' -- empty text, a
    // missing POI or a POI without a position are normal outcomes, reported with
    // ok: false + reason rather than thrown. A tap on the badge is forwarded as
    // 'html_marker_tapped' (tapCount resets to 0 on each successful create).
    create_html_marker: ({ markerId, anchorId, text }) => {
      const venue = core.venue
      if (!venue) {
        return
      }
      const fail = (reason, message) => {
        core.sendToNative({ type: 'html_marker_create_result', data: { ok: false, markerId, anchorId, reason, message } })
      }
      const badgeText = typeof text === 'string' ? text.trim() : ''
      if (!badgeText) {
        fail('empty_text')
        return
      }
      const previous = htmlMarkers.get(markerId)
      // Skip our own badge (appended to poi.markers) when copying the anchor's position.
      const anchor = core.resolveAnchorPoi(anchorId, [previous?.marker])
      if (anchor.reason) {
        fail(anchor.reason)
        return
      }
      const element = document.createElement('div')
      element.textContent = badgeText
      element.setAttribute('style', HTML_MARKER_STYLE)
      let marker
      try {
        // Only one marker per id: replace any previous one rather than leaking it.
        if (previous) {
          venue.removeMarker(previous.marker)
          htmlMarkers.delete(markerId)
        }
        // element is required (createMarker throws "invalid element provided" without
        // it). The SDK moves it into its own overlay container above the 3D canvas.
        marker = venue.createMarker({ poi: anchor.poi, position: core.offsetPosition(anchor.position), element })
      } catch (error) {
        fail('sdk_error', core.errorMessage(error))
        return
      }
      // The SDK sets pointer-events: none on the element at creation (taps would fall
      // through to the map) and never rewrites it afterwards: opt back in.
      element.style.pointerEvents = 'auto'
      const entry = { marker, tapCount: 0 }
      element.addEventListener('click', (event) => {
        // Keep the tap from also reaching the map (it would open the POI underneath).
        event.stopPropagation()
        entry.tapCount += 1
        core.sendToNative({ type: 'html_marker_tapped', data: { markerId, tapCount: entry.tapCount } })
      })
      htmlMarkers.set(markerId, entry)
      // A marker is only displayed while its POI's floor is displayed, and the default
      // whole-venue view doesn't show indoor floors: move the camera onto the anchor.
      if (core.view) {
        core.moveCameraToPoi(anchor.poi)
      }
      core.sendToNative({ type: 'html_marker_create_result', data: { ok: true, markerId, anchorId } })
    },

    // The marker element is a live DOM node: changing its content is a plain DOM edit,
    // no SDK call. Fire-and-forget: a no-op if nothing is placed or the text is empty.
    update_html_marker_text: ({ markerId, text }) => {
      const tracked = htmlMarkers.get(markerId)
      const badgeText = typeof text === 'string' ? text.trim() : ''
      if (!tracked || !badgeText) {
        return
      }
      tracked.marker.element.textContent = badgeText
    },

    // venue.updateMarker only accepts position and isVisible (isVisible: false sets
    // display:none, the element stays in the DOM). Fire-and-forget.
    set_html_marker_visible: ({ markerId, isVisible }) => {
      const tracked = htmlMarkers.get(markerId)
      if (!core.venue || !tracked) {
        return
      }
      core.venue.updateMarker(tracked.marker, { isVisible: isVisible === true })
    },

    // removeMarker also detaches the element from the DOM. Fire-and-forget: a no-op if
    // nothing is placed (removeMarker itself throws "Provided marker is not registered"
    // on a second call).
    remove_html_marker: ({ markerId }) => {
      const tracked = htmlMarkers.get(markerId)
      if (!core.venue || !tracked) {
        return
      }
      core.venue.removeMarker(tracked.marker)
      htmlMarkers.delete(markerId)
    },
  })
})(window.MapCore)
