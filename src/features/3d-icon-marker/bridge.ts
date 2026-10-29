import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Mirrors the SDK's OrientationType exactly (Venue/OrientationType.d.ts in the SDK
// typings): 'fixed' = flat on the ground with a fixed heading, 'flat' = flat on the
// ground but turning to face the camera, 'facing' = always camera-facing (the SDK
// default).
export type ImageOrientationType = 'fixed' | 'flat' | 'facing';

// Subset of the SDK's ImageCreateOptions that can cross the bridge -- `poi` and
// `position` are resolved on the page side from an anchor POI id instead, since a live
// POI object can't be serialized. width/height are in meters; url can be any image URL,
// including a data: URL.
export interface IconMarkerOptions {
  width: number;
  height?: number;
  url: string;
  orientationType: ImageOrientationType;
}

// Answer to 'create_icon_marker'. `ok: false` covers the anchor id not resolving to a
// POI, the anchor having no position to copy (both normal, non-crash outcomes), or
// venue.createImage itself throwing ('sdk_error', e.g. an invalid option). `at` is a
// fresh timestamp so repeating the same outcome still updates state.
export interface IconMarkerCreateResult {
  ok: boolean;
  imageId: string;
  anchorId: string;
  reason?: 'anchor_not_found' | 'no_position' | 'sdk_error';
  message?: string;
  at: number;
}

// The live Image only exists on the page side, keyed by `imageId`.
export const useIconMarkerBridge = () => {
  const { send } = useMapBridge();
  const [createResult, setCreateResult] = React.useState<IconMarkerCreateResult | null>(null);

  useMapEvent('icon_marker_create_result', (data) => setCreateResult({ ...data, at: Date.now() }));

  return {
    createResult,
    // venue.createImage owned by the anchor POI, at its position. Creating again under
    // the same id replaces the previous image.
    createIconMarker: (imageId: string, anchorId: string, options: IconMarkerOptions) =>
      send('create_icon_marker', { imageId, anchorId, options }),
    // venue.updateImage(image, { orientationType }).
    updateIconMarkerOrientation: (imageId: string, orientationType: ImageOrientationType) =>
      send('update_icon_marker_orientation', { imageId, orientationType }),
    // venue.removeImage(image).
    removeIconMarker: (imageId: string) => send('remove_icon_marker', { imageId }),
  };
};
