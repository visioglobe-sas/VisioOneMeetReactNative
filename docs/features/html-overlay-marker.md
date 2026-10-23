# HTML overlay marker

## Description

Pins an HTML element — here a small "Open now · 12:00–14:00" badge — on the map at a geographic position. Unlike a [Label](custom-text-label.md) or an [Image](3d-icon-marker.md), which live in the 3D scene, an HTML marker is drawn **above** the map: it always faces the screen, is never hidden by walls or 3D geometry, and — the point of this demo — it is **interactive**: tapping it reaches the app (here, React Native counts the taps). Built on three `Venue` methods (SDK `visioone`, see `Venue.ts`):

- `venue.createMarker(options: { poi: POI; position: Position; element: HTMLElement }): Marker` — creates a Marker owned by `poi`, displaying `element` centered on the WGS84 `position`.
- `venue.updateMarker(marker: Marker, options: { position?: Position; isVisible?: boolean }): void` — moves or shows/hides it.
- `venue.removeMarker(marker: Marker): void` — removes it (and detaches `element` from the DOM).

The element is a plain DOM node created by the page hosted in the WebView; it never crosses the bridge. Its own `click` listener forwards each tap to React Native with `postMessage`. The marker is owned by an existing "anchor" POI (no `createPOI` needed) and placed at a position copied from that POI — the same anchor-position lookup as [Dynamic POI](dynamic-poi-crud.md), [3D icon marker](3d-icon-marker.md) and [Custom text label](custom-text-label.md) — offset by about 4 m (`+0.00004` on both latitude and longitude) so the badge doesn't cover the POI's own label. After a successful placement the camera moves to the anchor POI.

## SDK usage

```ts
// useVisioMap.ts
const createHtmlMarker = (markerId: string, anchorId: string, text: string) => {
  sendMessage({ type: 'create_html_marker', data: { markerId, anchorId, text } });
};

const updateHtmlMarkerText = (markerId: string, text: string) => {
  sendMessage({ type: 'update_html_marker_text', data: { markerId, text } });
};

const setHtmlMarkerVisible = (markerId: string, isVisible: boolean) => {
  sendMessage({ type: 'set_html_marker_visible', data: { markerId, isVisible } });
};

const removeHtmlMarker = (markerId: string) => {
  sendMessage({ type: 'remove_html_marker', data: { markerId } });
};

// Called with, e.g.:
createHtmlMarker('html-overlay-marker', 'B4-UL00-ID0009', 'Open now · 12:00–14:00');
updateHtmlMarkerText('html-overlay-marker', 'Closed');
setHtmlMarkerVisible('html-overlay-marker', false);
removeHtmlMarker('html-overlay-marker');

// Incoming messages (WebView onMessage):
//   { type: 'html_marker_create_result', data: { ok, markerId, anchorId, reason?, message? } }
//   { type: 'html_marker_tapped', data: { markerId, tapCount } }
```

```js
// src/assets/visioOne.html

// Shared anchor-position lookup: first label of the POI, else its first marker.
// excludeMarker skips the badge we already attached to that POI (see "Things to know").
const resolveAnchorPoi = (anchorId, excludeLabel, excludeMarker) => {
  const poi = venue.pois.find((p) => p.id === anchorId)
  if (!poi) {
    return { reason: 'anchor_not_found' }
  }
  const ownLabel = poi.labels.find((label) => label !== excludeLabel)
  const ownMarker = poi.markers.find((marker) => marker !== excludeMarker)
  const position = ownLabel?.position ?? ownMarker?.position
  if (!position) {
    return { reason: 'no_position' }
  }
  return { poi, position }
}

// Live Marker objects only exist here, keyed by an id chosen by the app.
const htmlMarkers = new Map() // markerId -> { marker, tapCount }
const OFFSET_DEGREES = 0.00004 // ~4 m

// No transform / translate / position / top / left: the SDK owns those.
const HTML_MARKER_STYLE =
  'background:#0B6BCB;color:#FFFFFF;font:600 14px sans-serif;padding:6px 12px;' +
  'border-radius:14px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer'

const createHtmlMarker = (markerId, anchorId, text) => {
  const fail = (reason, message) =>
    sendToNative({ type: 'html_marker_create_result', data: { ok: false, markerId, anchorId, reason, message } })
  const badgeText = typeof text === 'string' ? text.trim() : ''
  if (!badgeText) {
    fail('empty_text')
    return
  }
  const previous = htmlMarkers.get(markerId)
  const anchor = resolveAnchorPoi(anchorId, undefined, previous?.marker)
  if (anchor.reason) {
    fail(anchor.reason) // the current badge, if any, stays in place
    return
  }
  const position = {
    ...anchor.position,
    latitude: anchor.position.latitude + OFFSET_DEGREES,
    longitude: anchor.position.longitude + OFFSET_DEGREES,
  }
  const element = document.createElement('div')
  element.textContent = badgeText
  element.setAttribute('style', HTML_MARKER_STYLE)
  let marker
  try {
    if (previous) {
      venue.removeMarker(previous.marker)
      htmlMarkers.delete(markerId)
    }
    marker = venue.createMarker({ poi: anchor.poi, position, element })
  } catch (error) {
    fail('sdk_error', error.name + ': ' + error.message)
    return
  }
  element.style.pointerEvents = 'auto' // the SDK set it to 'none'
  const entry = { marker, tapCount: 0 }
  element.addEventListener('click', (event) => {
    event.stopPropagation() // don't let the tap reach the map
    entry.tapCount += 1
    sendToNative({ type: 'html_marker_tapped', data: { markerId, tapCount: entry.tapCount } })
  })
  htmlMarkers.set(markerId, entry)
  view.goToPOI(anchor.poi, {
    orientation: { pitch: 20 },
    padding: { top: 100, bottom: 100, right: 100, left: 100 },
  })
  sendToNative({ type: 'html_marker_create_result', data: { ok: true, markerId, anchorId } })
}

const updateHtmlMarkerText = (markerId, text) => {
  const tracked = htmlMarkers.get(markerId)
  const badgeText = typeof text === 'string' ? text.trim() : ''
  if (tracked && badgeText) {
    tracked.marker.element.textContent = badgeText // plain DOM edit, no SDK call
  }
}

const setHtmlMarkerVisible = (markerId, isVisible) => {
  const tracked = htmlMarkers.get(markerId)
  if (tracked) {
    venue.updateMarker(tracked.marker, { isVisible: isVisible === true })
  }
}

const removeHtmlMarker = (markerId) => {
  const tracked = htmlMarkers.get(markerId)
  if (tracked) {
    venue.removeMarker(tracked.marker)
    htmlMarkers.delete(markerId)
  }
}

// Bridge back to React Native:
const sendToNative = (event) => {
  window.ReactNativeWebView?.postMessage(JSON.stringify(event))
}
```

Placing needs a round trip: `create_html_marker` goes in, `html_marker_create_result` comes back with `{ ok: true, markerId, anchorId }`, or `{ ok: false, reason }` where `reason` is `'empty_text'`, `'anchor_not_found'`, `'no_position'` (normal outcomes, not crashes — any badge already placed is left untouched) or `'sdk_error'` (`createMarker` threw). Each tap on the badge then arrives as `html_marker_tapped`, with a running `tapCount` that restarts at 0 on every successful placement. Updating the text, showing/hiding and removing are fire-and-forget messages, no-ops on the WebView side if nothing is placed under that id.

## Things to know

- **`element` is required.** `createMarker` without it throws `Cannot createMarker, invalid element provided, options.element is missing`.
- **The SDK owns the element's layout.** It moves the element into its own overlay container and sets `position: absolute; top: 0; left: 0; translate: -50% -50%` (the element is **centered** on the position), a `z-index`, and a `transform: translate(x, y)` rewritten every frame. Don't set any of these on the element yourself — wrap your content in a child element if you need your own transforms or animations.
- **It is not tappable by default.** The SDK sets `pointer-events: none` on the element at creation, so taps go straight through to the map (and open the POI card underneath). Set `element.style.pointerEvents = 'auto'` right after `createMarker` — the SDK doesn't rewrite it afterwards, camera moves included.
- **Stop the event in your handler.** Call `event.stopPropagation()` in the element's `click` listener, otherwise the same tap also reaches the map (`poiclick` fires for the POI under the badge).
- **Drawn above the 3D scene.** The element is never occluded by walls or buildings and stays readable at any camera pitch — that's the difference with a Label/Image.
- **Only shown on its POI's floor.** While another floor is displayed, the SDK sets `display: none` on the element. From the default whole-venue view indoor floors aren't shown, so the camera is moved to the anchor POI after placing (`view.goToPOI`, the same call as [Go to place](goto-poi.md)).
- **`updateMarker` only accepts `position` and `isVisible`.** `isVisible: false` sets `display: none`; the element stays in the DOM. To change what the marker shows, edit `marker.element` directly — it is a live DOM node.
- **`removeMarker` detaches the element.** Calling `removeMarker` or `updateMarker` again on a removed marker throws `Provided marker is not registered` — forget your reference once removed (this demo deletes it from its map, so a second remove is a no-op).
- **Your marker joins `poi.markers`.** The Marker is owned by the anchor POI and appended to its `markers` array. If you copy "the POI's first marker position" again later (e.g. to re-place the badge on a POI without a label of its own), skip your own marker, or you'll copy your already-offset position and the offset will build up.
- **A POI has no direct lat/lng field.** Its position comes from one of its sub-objects — `poi.labels[0].position` or `poi.markers[0].position` here. A POI with neither (e.g. a surface-only POI) has nothing to copy, reported as `no_position`.

## Learn more

- [Custom text label](custom-text-label.md) and [3D icon marker](3d-icon-marker.md) — the in-scene counterparts (`venue.createLabel`, `venue.createImage`), placed the same way.
- The SDK also supports "foreign" markers (`isForeignMarker`), meant for native views positioned by the host app from the `foreignmarkerupdated` event. Not demonstrated here.
