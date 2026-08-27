# Dynamic POI

## Description

Creates, edits and removes a POI at runtime, without republishing the map in VisioMapEditor, using four `Venue` methods (SDK `visioone`, see `Venue.ts` in the `visioone` repo):

- `venue.createPOI(options: { id: string; floor?: Floor; categories?: Category[] }): POI` — creates a new, bare POI. Throws `POIAlreadyExistsError` if `id` is already used in the venue.
- `venue.createLabel(options: { poi: POI; position: Position; width: number; height?: number; text: string; color?: Color; rotation?: number }): Label` — attaches a text Label to a POI at a WGS84 position.
- `venue.updateLabel(label: Label, options: { position?; width?; height?; text?; color?; isVisible? }): void` — updates an existing Label, here used to change its `text`.
- `venue.removePOI(poi: POI): void` — removes a POI (and, per the SDK's own doc comment, any visual element attached to it).

A bare POI created via `createPOI` has no visual representation by itself — `poi.images`/`.labels`/`.lines`/`.surfaces`/`.markers` are all empty arrays on a freshly created POI. This demo makes it visible by attaching a Label, at a position copied from an existing "anchor" POI (there's no tap-to-place UI here) rather than a hardcoded position.

## SDK usage

```ts
// useVisioMap.ts
const createDynamicPoi = (newId: string, anchorId: string, labelText: string) => {
  sendMessage({
    type: 'create_dynamic_poi',
    data: { newId, anchorId, labelText },
  });
};

const updateDynamicPoiLabel = (text: string) => {
  sendMessage({
    type: 'update_dynamic_poi_label',
    data: { text },
  });
};

const removeDynamicPoi = () => {
  sendMessage({ type: 'remove_dynamic_poi' });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
// Only one dynamically-created POI/Label pair is tracked at a time (this demo's own
// choice) -- the live SDK objects only exist here, native only holds the display
// id/text it gets back over the bridge.
let dynamicPoi = null
let dynamicLabel = null

const createDynamicPoi = (newId, anchorId, labelText) => {
  if (!venue) {
    return
  }
  if (dynamicPoi) {
    sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: 'already_tracked' } })
    return
  }
  const anchorPoi = venue.pois.find((p) => p.id === anchorId)
  if (!anchorPoi) {
    sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: 'anchor_not_found' } })
    return
  }
  const position = anchorPoi.labels[0]?.position ?? anchorPoi.markers[0]?.position
  if (!position) {
    sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: 'no_position' } })
    return
  }
  let poi
  try {
    poi = venue.createPOI({ id: newId })
  } catch (error) {
    sendToNative({
      type: 'dynamic_poi_create_result',
      data: {
        ok: false,
        reason: 'duplicate_id',
        message: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      },
    })
    return
  }
  const label = venue.createLabel({ poi, position, width: 2, text: labelText })
  dynamicPoi = poi
  dynamicLabel = label
  sendToNative({ type: 'dynamic_poi_create_result', data: { ok: true, id: newId, text: labelText } })
}

const updateDynamicPoiLabel = (text) => {
  if (!venue || !dynamicLabel) {
    return
  }
  venue.updateLabel(dynamicLabel, { text })
}

const removeDynamicPoi = () => {
  if (!venue || !dynamicPoi) {
    return
  }
  venue.removePOI(dynamicPoi)
  dynamicPoi = null
  dynamicLabel = null
}
```

Creating needs a round trip, the same request/response idiom as [Custom data](custom-data.md): `create_dynamic_poi` goes in, `dynamic_poi_create_result` comes back once the WebView side knows whether it worked — `{ data: { ok: true, id, text } }` on success, or `{ data: { ok: false, reason, message? } }` on one of four normal, non-crash outcomes (`reason`: `'anchor_not_found'`, `'no_position'`, `'duplicate_id'`, or `'already_tracked'`). Updating the label's text and removing the POI are fire-and-forget, one-way messages — like `highlight_category`/`clear_category_highlight` in [Category highlight](category-highlight.md), they only cause a side effect and don't need a reply: both are only ever sent while a dynamic POI is already tracked, so they can't meaningfully fail.

## Things to know

- **A bare POI has no visual footprint at all.** `venue.createPOI({ id })` returns a POI whose `images`, `labels`, `lines`, `surfaces` and `markers` are all empty arrays — nothing appears on the map until something is explicitly attached to it (a Label, Image, Line, Marker or Surface). This demo attaches a Label; any of the others would work just as well to make the POI visible.
- **`venue.updatePOI(poi, options)` can only ever change categories.** `POIUpdateOptions` has exactly one field, `categories: Category[]` — there is no way to move a POI, or to touch anything visual, through `updatePOI`. "Editing" a dynamic POI's visible content in this demo means calling `venue.updateLabel(label, { text })` on its attached Label instead, not `updatePOI`.
- **`venue.removePOI(poi)` cascades to its visual elements.** Per the SDK's own doc comment, removing a POI that has a visual representation also removes that representation from the view — this demo does not separately call `removeLabel` on the Label it attached; removing the POI alone is enough.
- **`createPOI` throws `POIAlreadyExistsError` on a duplicate id**, and that's the only failure mode the SDK documents for it. This demo catches it generically (by message, not by `instanceof`/error class) since the SDK is loaded as a minified CDN bundle here, which doesn't reliably preserve constructor names for that kind of check — see the `catch` block above.
- **The new POI's position is copied from an existing "anchor" POI**, not typed in or tapped on the map (out of scope for this demo) — `anchorPoi.labels[0]?.position ?? anchorPoi.markers[0]?.position`. An anchor id that doesn't resolve to any POI (`reason: 'anchor_not_found'`) and one that resolves but has neither a label nor a marker to copy a position from (`reason: 'no_position'`, e.g. a surface-only POI) are reported as two distinct, non-error outcomes — same idiom as [Custom data](custom-data.md) distinguishing "POI not found" from "POI found but empty."

## Learn more

- [Custom data](custom-data.md) — the sibling feature this one borrows its request/response bridge idiom from.
- [Category highlight](category-highlight.md) — the sibling feature its fire-and-forget update/remove messages borrow their idiom from.
- [Go to place](goto-poi.md) — another feature resolving a POI id via `venue.pois.find(...)`, the same lookup used here for the anchor POI.
