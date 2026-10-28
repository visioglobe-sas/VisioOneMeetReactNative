import * as React from 'react';

import { useMapEvent } from '../../bridge/MapBridge';

// Mirrors the SDK's createView cameraProjection option.
export type CameraProjection = 'perspective' | 'orthographic';

// view.cameraProjection as reported by 'ready' -- null until the view exists. The
// projection itself is a createView option (see CameraProjectionScreen).
export const useReportedCameraProjection = () => {
  const [projection, setProjection] = React.useState<CameraProjection | null>(null);
  useMapEvent('ready', (data) => setProjection(data?.cameraProjection ?? null));
  return projection;
};
