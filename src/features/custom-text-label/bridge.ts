import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Subset of the SDK's LabelCreateOptions that can cross the bridge -- `poi` and
// `position` are resolved on the page side from an anchor POI id instead (a live POI
// object can't be serialized). width/height are in meters and always both sent:
// createLabel defaults height to width when omitted. rotation is in degrees, relative
// to the map's orientation. color is a hex / rgb() / hsl() string.
export interface TextLabelOptions {
  text: string;
  color: string;
  width: number;
  height: number;
  rotation: number;
}

// Mirrors the subset of the SDK's LabelUpdateOptions this demo uses. width and height
// go together (updateLabel with width alone also sets height = width); rotation is
// absent on purpose -- it isn't part of LabelUpdateOptions.
export type TextLabelUpdate = { text: string } | { color: string } | { width: number; height: number };

// Answer to 'create_text_label'. `ok: false` covers empty text (createLabel would
// throw "Cannot create Label, text is required"), the anchor id not resolving to a POI,
// the anchor having no position to copy (all normal, non-crash outcomes), or
// venue.createLabel itself throwing ('sdk_error', e.g. an invalid color). `at` is a
// fresh timestamp so repeating the same outcome still updates state.
export interface TextLabelCreateResult {
  ok: boolean;
  labelId: string;
  anchorId: string;
  reason?: 'empty_text' | 'anchor_not_found' | 'no_position' | 'sdk_error';
  message?: string;
  at: number;
}

// The live Label only exists on the page side, keyed by `labelId`.
export const useTextLabelBridge = () => {
  const { send } = useMapBridge();
  const [createResult, setCreateResult] = React.useState<TextLabelCreateResult | null>(null);

  useMapEvent('text_label_create_result', (data) => setCreateResult({ ...data, at: Date.now() }));

  return {
    createResult,
    // venue.createLabel owned by the anchor POI, at its position offset by ~4 m.
    // Creating again under the same id replaces the previous label. `moveCamera: false`
    // skips the camera move -- used when only recreating the label to change its
    // rotation.
    createTextLabel: (labelId: string, anchorId: string, options: TextLabelOptions, moveCamera = true) =>
      send('create_text_label', { labelId, anchorId, options, moveCamera }),
    // venue.updateLabel(label, update).
    updateTextLabel: (labelId: string, update: TextLabelUpdate) =>
      send('update_text_label', { labelId, update }),
    // venue.removeLabel(label).
    removeTextLabel: (labelId: string) => send('remove_text_label', { labelId }),
  };
};
