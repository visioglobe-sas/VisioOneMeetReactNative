import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Answer to 'create_dynamic_poi'. `ok: false` covers distinct, non-crash outcomes
// distinguished by `reason` (the anchor id didn't resolve to a POI at all, the anchor
// resolved but has no position to copy, or `newId` is already used in the venue --
// venue.createPOI's POIAlreadyExistsError). `ok: true` carries back the id/text that
// are now tracked.
export interface DynamicPoiCreateResult {
  ok: boolean;
  id?: string;
  text?: string;
  reason?: 'anchor_not_found' | 'no_position' | 'duplicate_id' | 'already_tracked';
  message?: string;
}

export const useDynamicPoiCrudBridge = () => {
  const { send } = useMapBridge();
  const [createResult, setCreateResult] = React.useState<DynamicPoiCreateResult | null>(null);

  useMapEvent<DynamicPoiCreateResult>('dynamic_poi_create_result', setCreateResult);

  return {
    createResult,
    // venue.createPOI + a Label at the position copied from an existing "anchor" POI (a
    // bare POI has no visual footprint of its own). Answered with
    // 'dynamic_poi_create_result'.
    createDynamicPoi: (newId: string, anchorId: string, labelText: string) =>
      send('create_dynamic_poi', { newId, anchorId, labelText }),
    // updatePOI can only ever touch categories, never anything visual -- editing the
    // dynamic POI's visible content means venue.updateLabel on its attached Label.
    updateDynamicPoiLabel: (text: string) => send('update_dynamic_poi_label', { text }),
    // venue.removePOI, which also removes its attached Label.
    removeDynamicPoi: () => send('remove_dynamic_poi'),
  };
};
