import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Answer to 'create_html_marker'. `ok: false` covers empty text, the anchor id not
// resolving to a POI, the anchor having no position to copy (all normal, non-crash
// outcomes that leave any current badge untouched), or venue.createMarker itself
// throwing ('sdk_error'). `at` is a fresh timestamp so repeating the same outcome still
// updates state.
export interface HtmlMarkerCreateResult {
  ok: boolean;
  markerId: string;
  anchorId: string;
  reason?: 'empty_text' | 'anchor_not_found' | 'no_position' | 'sdk_error';
  message?: string;
  at: number;
}

// A tap on the HTML badge, forwarded from the element's own click listener in the page
// ('html_marker_tapped'). tapCount is counted on the page side and resets to 0 on each
// successful create.
export interface HtmlMarkerTap {
  markerId: string;
  tapCount: number;
  at: number;
}

// The badge element is created by the page and never crosses the bridge; the live
// Marker only exists on the page side, keyed by `markerId`.
export const useHtmlMarkerBridge = () => {
  const { send } = useMapBridge();
  const [createResult, setCreateResult] = React.useState<HtmlMarkerCreateResult | null>(null);
  const [tap, setTap] = React.useState<HtmlMarkerTap | null>(null);

  useMapEvent('html_marker_create_result', (data) => setCreateResult({ ...data, at: Date.now() }));
  useMapEvent('html_marker_tapped', (data) => setTap({ ...data, at: Date.now() }));

  return {
    createResult,
    tap,
    // venue.createMarker with an HTML badge showing `text`, owned by the anchor POI, at
    // its position offset by ~4 m. Creating again under the same id replaces the
    // previous badge.
    createHtmlMarker: (markerId: string, anchorId: string, text: string) =>
      send('create_html_marker', { markerId, anchorId, text }),
    // A plain DOM edit on marker.element, no SDK call.
    updateHtmlMarkerText: (markerId: string, text: string) =>
      send('update_html_marker_text', { markerId, text }),
    // venue.updateMarker(marker, { isVisible }).
    setHtmlMarkerVisible: (markerId: string, isVisible: boolean) =>
      send('set_html_marker_visible', { markerId, isVisible }),
    // venue.removeMarker(marker), which also detaches the element.
    removeHtmlMarker: (markerId: string) => send('remove_html_marker', { markerId }),
  };
};
