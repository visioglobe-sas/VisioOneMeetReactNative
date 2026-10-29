# Dynamic POI

## Description

Creates, edits and removes a POI at runtime, without republishing the map in VisioMapEditor, using four `Venue` methods (see `Venue/Venue.d.ts` in the SDK typings):

- `venue.createPOI(options: { id: string; floor?: Floor; categories?: Category[] }): POI` — creates a new, bare POI. Throws `POIAlreadyExistsError` if `id` is already used in the venue.
- `venue.createLabel(options: { poi: POI; position: Position; width: number; height?: number; text: string; color?: Color; rotation?: number }): Label` — attaches a text Label to a POI at a WGS84 position.
- `venue.updateLabel(label: Label, options: { position?; width?; height?; text?; color?; isVisible? }): void` — updates an existing Label, here used to change its `text`.
- `venue.removePOI(poi: POI): void` — removes a POI (and, per the SDK's own doc comment, any visual element attached to it).

A bare POI created via `createPOI` has no visual representation by itself — `poi.images`/`.labels`/`.lines`/`.surfaces`/`.markers` are all empty arrays on a freshly created POI. This demo makes it visible by attaching a Label, at a position copied from an existing "anchor" POI (there's no tap-to-place UI here) rather than a hardcoded position.

## SDK usage

```ts
// src/features/dynamic-poi-crud/bridge.ts
export const useDynamicPoiCrudBridge = () => {
  const { send } = useMapBridge();
  const [createResult, setCreateResult] = React.useState<DynamicPoiCreateResult | null>(null);

  useMapEvent<DynamicPoiCreateResult>('dynamic_poi_create_result', setCreateResult);

  return {
    createResult,
    createDynamicPoi: (newId: string, anchorId: string, labelText: string) =>
      send('create_dynamic_poi', { newId, anchorId, labelText }),
    updateDynamicPoiLabel: (text: string) => send('update_dynamic_poi_label', { text }),
    removeDynamicPoi: () => send('remove_dynamic_poi'),
  };
};
```

```js
// src/features/dynamic-poi-crud/webview.js
// Only one dynamically-created POI/Label pair is tracked at a time (this demo's own
// choice, not an SDK limit) -- the live SDK objects only exist here, native only
// holds the display id/text it gets back over the bridge.
let dynamicPoi = null
let dynamicLabel = null

core.register({
  create_dynamic_poi: ({ newId, anchorId, labelText }) => {
    const venue = core.venue
    if (!venue) {
      return
    }
    if (dynamicPoi) {
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

  update_dynamic_poi_label: ({ text }) => {
    if (!core.venue || !dynamicLabel) {
      return
    }
    core.venue.updateLabel(dynamicLabel, { text })
  },

  remove_dynamic_poi: () => {
    if (!core.venue || !dynamicPoi) {
      return
    }
    core.venue.removePOI(dynamicPoi)
    dynamicPoi = null
    dynamicLabel = null
  },
})
```

The anchor's position comes from two helpers shared by every feature that needs "where is this POI":

```js
// src/webview/core.js
// (1) the POI's first Label position, (2) its first Image, then Marker position,
// (3) the centroid of its first Surface's vertices. `exclude` skips objects the app
// itself attached to the POI.
const getPoiDisplayPosition = (poi, exclude = []) => {
  const first = (items) => (items || []).find((item) => !exclude.includes(item) && item.position)
  const position =
    first(poi.labels)?.position ?? first(poi.images)?.position ?? first(poi.markers)?.position
  if (position) {
    return { latitude: position.latitude, longitude: position.longitude, altitude: position.altitude }
  }
  const vertices = poi.surfaces?.[0]?.positions ?? []
  if (vertices.length === 0) {
    return null
  }
  // ...average of the vertices' latitude / longitude / altitude
}

const resolveAnchorPoi = (anchorId, exclude = []) => {
  const poi = findPoi(anchorId)
  if (!poi) {
    return { reason: 'anchor_not_found' }
  }
  const position = getPoiDisplayPosition(poi, exclude)
  if (!position) {
    return { reason: 'no_position' }
  }
  return { poi, position }
}
```

`findPoi(id)` is `venue.pois.find((p) => p.id === id)`.

Creating needs a round trip, the same request/response idiom as [Custom data](custom-data.md): `create_dynamic_poi` goes in, `dynamic_poi_create_result` comes back once the WebView side knows whether it worked — `{ data: { ok: true, id, text } }` on success, or `{ data: { ok: false, reason, message? } }` on one of four normal, non-crash outcomes (`reason`: `'anchor_not_found'`, `'no_position'`, `'duplicate_id'`, or `'already_tracked'`). Updating the label's text and removing the POI are fire-and-forget, one-way messages — like `highlight_category`/`clear_category_highlight` in [Category highlight](category-highlight.md), they only cause a side effect and don't need a reply: both are only ever sent while a dynamic POI is already tracked, so they can't meaningfully fail.

## Things to know

- **A bare POI has no visual footprint at all.** `venue.createPOI({ id })` returns a POI whose `images`, `labels`, `lines`, `surfaces` and `markers` are all empty arrays — nothing appears on the map until something is explicitly attached to it (a Label, Image, Line, Marker or Surface). This demo attaches a Label; any of the others would work just as well to make the POI visible.
- **`venue.updatePOI(poi, options)` can only ever change categories.** `POIUpdateOptions` has exactly one field, `categories: Category[]` — there is no way to move a POI, or to touch anything visual, through `updatePOI`. "Editing" a dynamic POI's visible content in this demo means calling `venue.updateLabel(label, { text })` on its attached Label instead, not `updatePOI`.
- **`venue.removePOI(poi)` cascades to its visual elements.** Per the SDK's own doc comment, removing a POI that has a visual representation also removes that representation from the view — this demo does not separately call `removeLabel` on the Label it attached; removing the POI alone is enough.
- **`createPOI` throws `POIAlreadyExistsError` on a duplicate id**, and that's the only failure mode the SDK documents for it. This demo catches it generically (any error thrown by `createPOI` is reported as `'duplicate_id'`, without checking the error class) since the SDK is loaded from its CDN build here, which doesn't export the SDK's error classes, so `instanceof` isn't available — see the `catch` block above.
- **The new POI's position is copied from an existing "anchor" POI**, not typed in or tapped on the map (out of scope for this demo) — `core.resolveAnchorPoi` above (first Label, else first Image or Marker, else first Surface centroid). An anchor id that doesn't resolve to any POI (`reason: 'anchor_not_found'`) and one that resolves but has nothing giving it a position (`reason: 'no_position'`) are reported as two distinct, non-error outcomes — same idiom as [Custom data](custom-data.md) distinguishing "POI not found" from "POI found but empty."

## Learn more

- [Custom data](custom-data.md) — the sibling feature this one borrows its request/response bridge idiom from.
- [Category highlight](category-highlight.md) — the sibling feature its fire-and-forget update/remove messages borrow their idiom from.
- [Go to place](goto-poi.md) — another feature resolving a POI id via `venue.pois.find(...)`, the same lookup used here for the anchor POI.
