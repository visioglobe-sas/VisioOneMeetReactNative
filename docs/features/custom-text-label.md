# Custom text label

## Description

Places your own free text on the map — opening hours, a price, a zone name… — next to an existing place, and restyles it live (text, color, size, rotation). The label is independent of the map's own labels: it is added alongside them and never alters them. Built on three `Venue` methods (SDK `visioone`, see `Venue.ts`):

- `venue.createLabel(options: { poi: POI; position: Position; width: number; height?: number; text: string; color?: Color; rotation?: number }): Label` — creates a Label owned by `poi`, at a WGS84 `position`. `width`/`height` are in meters (the text is fitted inside that box); `rotation` is in degrees, relative to the map's orientation; `color` is the font color.
- `venue.updateLabel(label: Label, options: { text?; color?; width?; height?; position?; isVisible? }): void` — updates an existing Label live. Note that `rotation` is **not** part of these options.
- `venue.removeLabel(label: Label): void` — removes it from the map.

The label is owned by an existing "anchor" POI (no `createPOI` needed) and placed at a position copied from that POI — the same anchor-position lookup as [Dynamic POI](dynamic-poi-crud.md) and [3D icon marker](3d-icon-marker.md) — offset by about 4 m (`+0.00004` on both latitude and longitude) so the custom text doesn't sit on top of the POI's own label. After a successful placement the camera moves to the anchor POI.

## SDK usage

```ts
// useVisioMap.ts
export interface TextLabelOptions {
  text: string;
  color: string; // hex, rgb() or hsl()
  width: number; // meters
  height: number; // meters -- always sent, see "Things to know"
  rotation: number; // degrees
}

export type TextLabelUpdate =
  | { text: string }
  | { color: string }
  | { width: number; height: number };

const createTextLabel = (labelId: string, anchorId: string, options: TextLabelOptions, moveCamera = true) => {
  sendMessage({ type: 'create_text_label', data: { labelId, anchorId, options, moveCamera } });
};

const updateTextLabel = (labelId: string, update: TextLabelUpdate) => {
  sendMessage({ type: 'update_text_label', data: { labelId, update } });
};

const removeTextLabel = (labelId: string) => {
  sendMessage({ type: 'remove_text_label', data: { labelId } });
};

// Called with, e.g.:
createTextLabel('custom-text-label', 'B4-UL00-ID0009', {
  text: 'Lunch 12:00–14:00',
  color: '#E53935',
  width: 16,
  height: 3,
  rotation: 0,
});
updateTextLabel('custom-text-label', { color: '#1E88E5' });
updateTextLabel('custom-text-label', { width: 22, height: 4 });
updateTextLabel('custom-text-label', { text: 'Open 9:00–18:00' });
// Changing the rotation = creating again under the same id (replaces the previous label):
createTextLabel('custom-text-label', 'B4-UL00-ID0009', { ...sameValues, rotation: 45 }, false);
removeTextLabel('custom-text-label');
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)

// Shared with Dynamic POI and 3D icon marker: resolves an anchor POI id to the POI plus
// a WGS84 position copied from its first label, or else its first marker.
const resolveAnchorPoi = (anchorId) => {
  const poi = venue.pois.find((p) => p.id === anchorId)
  if (!poi) {
    return { reason: 'anchor_not_found' }
  }
  const position = poi.labels[0]?.position ?? poi.markers[0]?.position
  if (!position) {
    return { reason: 'no_position' }
  }
  return { poi, position }
}

// Live Label objects only exist here, keyed by an id chosen by the app.
const textLabels = new Map()
const TEXT_LABEL_OFFSET_DEGREES = 0.00004 // ~4 m

const createTextLabel = (labelId, anchorId, options, moveCamera) => {
  const fail = (reason, message) =>
    sendToNative({ type: 'text_label_create_result', data: { ok: false, labelId, anchorId, reason, message } })
  const text = typeof options.text === 'string' ? options.text.trim() : ''
  if (!text) {
    fail('empty_text') // createLabel would throw "Cannot create Label, text is required"
    return
  }
  const anchor = resolveAnchorPoi(anchorId)
  if (anchor.reason) {
    fail(anchor.reason)
    return
  }
  const previous = textLabels.get(labelId)
  if (previous) {
    venue.removeLabel(previous)
    textLabels.delete(labelId)
  }
  const position = {
    ...anchor.position,
    latitude: anchor.position.latitude + TEXT_LABEL_OFFSET_DEGREES,
    longitude: anchor.position.longitude + TEXT_LABEL_OFFSET_DEGREES,
  }
  try {
    const created = venue.createLabel({
      poi: anchor.poi,
      position,
      width: options.width,
      height: options.height, // always explicit
      text,
      color: options.color,
      rotation: options.rotation,
    })
    textLabels.set(labelId, created)
    if (moveCamera !== false) {
      view.goToPOI(anchor.poi, {
        orientation: { pitch: 20 },
        padding: { top: 100, bottom: 100, right: 100, left: 100 },
      })
    }
    sendToNative({ type: 'text_label_create_result', data: { ok: true, labelId, anchorId } })
  } catch (error) {
    fail('sdk_error', error.name + ': ' + error.message)
  }
}

const updateTextLabel = (labelId, update) => {
  const tracked = textLabels.get(labelId)
  if (!tracked) {
    return
  }
  const options = {}
  if (typeof update.text === 'string') {
    if (!update.text.trim()) {
      return // updateLabel with an empty text is ignored here, never sent
    }
    options.text = update.text.trim()
  }
  if (update.color !== undefined) {
    options.color = update.color
  }
  if (update.width !== undefined && update.height !== undefined) {
    options.width = update.width // never width alone
    options.height = update.height
  }
  venue.updateLabel(tracked, options)
}

const removeTextLabel = (labelId) => {
  const tracked = textLabels.get(labelId)
  if (tracked) {
    venue.removeLabel(tracked)
    textLabels.delete(labelId)
  }
}
```

Placing needs a round trip: `create_text_label` goes in, `text_label_create_result` comes back with `{ ok: true, labelId, anchorId }`, or `{ ok: false, reason }` where `reason` is `'empty_text'`, `'anchor_not_found'`, `'no_position'` (all normal outcomes, not crashes) or `'sdk_error'` (`createLabel` threw). Updating and removing are fire-and-forget messages, no-ops on the WebView side if nothing is placed under that id.

## Things to know

- **Always pass `height`.** It is optional on `createLabel` but **defaults to `width`**, giving a square box in which the text wraps and gets oversized. Same on update: `updateLabel(label, { width })` alone also sets `height = width` (as documented on `LabelUpdateOptions`), and `{ height }` alone has no effect — always send `width` and `height` together.
- **`rotation` can only be set at creation.** It is part of `LabelCreateOptions` but not of `LabelUpdateOptions`. To rotate a placed label, remove it and create it again with the new `rotation`. (Passing `rotation` to `updateLabel` anyway happens to rotate the rendering on SDK 1.0.9, but `label.rotation` keeps reporting the old value — undocumented, don't rely on it.)
- **`text` is required.** An empty string throws `Cannot create Label, text is required`. The text is fitted inside the `width`×`height` box; a long text wraps onto two lines.
- **`color` format.** A hex (`#E53935`), `rgb()` or `hsl()` string; alpha is ignored. Anything else throws `Invalid color format provided…`.
- **A Label needs an owner POI.** `createLabel` requires `poi` — this demo uses the anchor POI itself. The new Label is pushed onto `poi.labels`, after the POI's own label (`poi.labels[0]`, e.g. "Restaurant"), which is left untouched; `removeLabel` only removes the one you created.
- **`removeLabel` / `updateLabel` on a removed label throw** `Provided label is not registered`. Forget your reference once removed (this demo deletes it from its map, so a second remove is a no-op).
- **A POI has no direct lat/lng field.** Its position comes from one of its sub-objects — `poi.labels[0].position` or `poi.markers[0].position` here. A POI with neither (e.g. a surface-only POI) has nothing to copy, reported as `no_position`. The copied position keeps its altitude.
- **Indoor labels are only visible on their floor.** A Label is rendered only while its POI's floor is displayed; from the default whole-venue view indoor floors aren't shown, so the camera is moved to the anchor POI after placing (`view.goToPOI`, the same call as [Go to place](goto-poi.md)).

## Learn more

- [Dynamic POI](dynamic-poi-crud.md) — creates a brand-new POI and attaches a Label to it, sharing the same anchor-position lookup.
- [3D icon marker](3d-icon-marker.md) — the image counterpart (`venue.createImage`), placed the same way.
