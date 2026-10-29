import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

export const useCameraLockBridge = () => {
  const { send } = useMapBridge();
  // Mirror of view.lockCameraPositionOnTracking -- false until tracking starts, then
  // whatever 'camera_lock_changed' reports. The SDK changes it by itself too
  // (allowTracking = true turns it on, a user pan or allowTracking = false turns it
  // off).
  const [locked, setLocked] = React.useState(false);

  useMapEvent('camera_lock_changed', (data) => setLocked(data?.locked === true));

  return {
    locked,
    // view.lockCameraPositionOnTracking = locked. Only has an effect once
    // view.allowTracking is true (a silent no-op before).
    setCameraLockOnPosition: (value: boolean) => send('set_camera_lock_on_position', { locked: value }),
  };
};
