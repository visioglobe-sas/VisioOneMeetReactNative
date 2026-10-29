import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';
import { CAROUSEL_STOP_IDS } from '../../demoMap';

// The tour's state as reported by the page ('camera_carousel_status'), whatever changed
// it -- the Start/Stop buttons, a touch on the map (pause) or the page's own idle timer
// (resume). stopIndex is 0-based, -1 when stopped.
export type CameraCarouselState = 'running' | 'paused' | 'stopped';

export interface CameraCarouselStatus {
  state: CameraCarouselState;
  stopIndex: number;
  stopCount: number;
  poiId: string | null;
  resumeAfterMs: number;
}

const INITIAL_STATUS: CameraCarouselStatus = {
  state: 'stopped',
  stopIndex: -1,
  stopCount: 0,
  poiId: null,
  resumeAfterMs: 0,
};

// The loop itself (goToFloor + goToPOI per stop, dwell, pause on touch, resume after
// idle) runs inside the page (webview.js); React Native only starts/stops it.
export const useCameraCarouselBridge = () => {
  const { send } = useMapBridge();
  const [status, setStatus] = React.useState<CameraCarouselStatus>(INITIAL_STATUS);

  useMapEvent<CameraCarouselStatus>('camera_carousel_status', setStatus);

  return {
    status,
    // The stop list lives in demoMap.ts and travels with the start message.
    startCameraCarousel: () => send('start_camera_carousel', { stopIds: CAROUSEL_STOP_IDS }),
    stopCameraCarousel: () => send('stop_camera_carousel'),
  };
};
