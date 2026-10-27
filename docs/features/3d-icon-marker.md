# 3D icon marker

## Description

Places a custom image (here a small PNG icon) at a precise spot on the 3D map, and lets the user switch how it is oriented relative to the camera — e.g. a product visual above a shelf, or a branded pin on a shop. Built on three `Venue` methods (see `Venue/Venue.d.ts` in the SDK typings):

- `venue.createImage(options: { poi: POI; position: Position; width: number; height?: number; rotation?: number; url: string; orientationType?: OrientationType }): Image` — creates an Image owned by `poi`, at a WGS84 `position`. `width`/`height` are in meters (`height` defaults to `width`); `url` can be a web URL, a URL relative to the venue's `baseURL`, or a `data:` URL.
- `venue.updateImage(image: Image, options: { orientationType?; width?; height?; position?; rotation?; url?; isVisible? }): void` — updates an existing Image live, here its `orientationType`.
- `venue.removeImage(image: Image): void` — removes it from the map.

`OrientationType` is `'fixed' | 'flat' | 'facing'`:

- `'fixed'` — flat on the ground, with a fixed heading (`rotation`, in degrees, relative to the map's orientation).
- `'flat'` — flat on the ground, turning to face the camera.
- `'facing'` — always facing the camera, like a billboard. This is the SDK default when `orientationType` is omitted.

The image is owned by an existing "anchor" POI (no `createPOI` needed) and placed at a position copied from that POI — the same anchor-position lookup as [Dynamic POI](dynamic-poi-crud.md). After a successful placement the camera moves to the anchor POI, otherwise the icon may be on an indoor floor that isn't shown from the default whole-venue view.

## SDK usage

```ts
// useVisioMap.ts
export type ImageOrientationType = 'fixed' | 'flat' | 'facing';

export interface IconMarkerOptions {
  width: number;
  height?: number;
  url: string;
  orientationType: ImageOrientationType;
}

const createIconMarker = (imageId: string, anchorId: string, options: IconMarkerOptions) => {
  sendMessage({ type: 'create_icon_marker', data: { imageId, anchorId, options } });
};

const updateIconMarkerOrientation = (imageId: string, orientationType: ImageOrientationType) => {
  sendMessage({ type: 'update_icon_marker_orientation', data: { imageId, orientationType } });
};

const removeIconMarker = (imageId: string) => {
  sendMessage({ type: 'remove_icon_marker', data: { imageId } });
};

// Called with, e.g.:
createIconMarker('icon-marker', 'B4-UL00-ID0009', {
  width: 6,
  height: 6,
  url: 'data:image/png;base64,iVBORw0KGgo…',
  orientationType: 'facing',
});
```

```js
// src/assets/visioOne.html

// Shared with the Dynamic POI feature: resolves an anchor POI id to the POI plus a
// WGS84 position copied from its first label, or else its first marker.
// Shared by every feature that needs "where is this POI": (1) its first Label
// position, (2) its first Image, then Marker position, (3) the centroid of its first
// Surface's vertices. `exclude` skips objects the app itself attached to the POI.
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
  const poi = venue.pois.find((p) => p.id === anchorId)
  if (!poi) {
    return { reason: 'anchor_not_found' }
  }
  const position = getPoiDisplayPosition(poi, exclude)
  if (!position) {
    return { reason: 'no_position' }
  }
  return { poi, position }
}

// Live Image objects only exist here, keyed by an id chosen by the app.
const iconMarkers = new Map()

const createIconMarker = (imageId, anchorId, options) => {
  const anchor = resolveAnchorPoi(anchorId, [iconMarkers.get(imageId)]) // skip our own previous icon
  if (anchor.reason) {
    sendToNative({ type: 'icon_marker_create_result', data: { ok: false, imageId, anchorId, reason: anchor.reason } })
    return
  }
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
    view.goToPOI(anchor.poi, {
      orientation: { pitch: 20 },
      padding: { top: 100, bottom: 100, right: 100, left: 100 },
    })
    sendToNative({ type: 'icon_marker_create_result', data: { ok: true, imageId, anchorId } })
  } catch (error) {
    sendToNative({
      type: 'icon_marker_create_result',
      data: { ok: false, imageId, anchorId, reason: 'sdk_error', message: error.name + ': ' + error.message },
    })
  }
}

const updateIconMarkerOrientation = (imageId, orientationType) => {
  const tracked = iconMarkers.get(imageId)
  if (tracked) {
    venue.updateImage(tracked, { orientationType })
  }
}

const removeIconMarker = (imageId) => {
  const tracked = iconMarkers.get(imageId)
  if (tracked) {
    venue.removeImage(tracked)
    iconMarkers.delete(imageId)
  }
}
```

Placing needs a round trip: `create_icon_marker` goes in, `icon_marker_create_result` comes back with `{ ok: true, imageId, anchorId }`, or `{ ok: false, reason }` where `reason` is `'anchor_not_found'`, `'no_position'` (both normal outcomes, not crashes) or `'sdk_error'` (`createImage` threw). Updating the orientation and removing are fire-and-forget messages, no-ops on the WebView side if nothing is placed under that id.

## Things to know

- **An Image needs an owner POI.** `createImage` requires `poi` — this demo uses the anchor POI itself rather than creating a new one. The Image is pushed onto `poi.images`, alongside any image the POI already had from the map (e.g. its own category icon); `removeImage` only removes the one you created.
- **`data:` URLs work.** The SDK accepts a `data:` URL for `url`; the icon here is a 96×96 PNG inlined as base64, so no image hosting is needed. An empty `url` throws (`Cannot create Image due to missing URL`), as does an `orientationType` outside `'fixed' | 'flat' | 'facing'` (`Invalid orientation type`) and a non-positive `width`/`height`.
- **`width`/`height` are meters, not pixels.** The image scales with the map like any other 3D element. `height` defaults to `width` when omitted.
- **`updateImage` applies live**, no remove/recreate needed — switching `orientationType` on an already-placed Image takes effect immediately.
- **`'flat'` and `'facing'` require SDK ≥ 1.0.9.** On earlier versions, runtime-created images ignore these two orientations (they lie flat and don't follow the camera); this was an SDK bug fixed in 1.0.9. `'fixed'` works on all versions.
- **Mind the altitude.** The image is placed at `position`, altitude included. A position copied from a label sits right at floor level (altitude 0.5 m on the demo map), so a ground-lying image can z-fight with the floor/label there. Raising `position.altitude` slightly avoids it.
- **A POI has no direct lat/lng field.** Its position comes from the objects it owns: this demo uses its first Label's position, else its first Image's or Marker's, else the centroid of its first Surface (`getPoiDisplayPosition` above, the same helper every feature of this repo uses). Only a POI with none of these (e.g. a POI just created with `createPOI`) has nothing to copy, reported as `'no_position'`.
- **Indoor images are only visible on their floor.** From the default whole-venue view, indoor floors aren't shown, so the camera is moved to the anchor POI after placing (`view.goToPOI`, the same call as [Go to place](goto-poi.md)).

## Learn more

- [Dynamic POI](dynamic-poi-crud.md) — the sibling feature sharing the same anchor-POI position lookup, attaching a Label instead of an Image.
- [Go to place](goto-poi.md) — the camera move reused after placing.
