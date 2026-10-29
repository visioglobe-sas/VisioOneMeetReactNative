import * as React from 'react';

import BottomSheet from '../../components/BottomSheet';
import { TRACKING_FROM, TRACKING_TO } from '../../demoMap';
import SimulatedPositionControls from '../../shared/positionTracking/SimulatedPositionControls';
import { useSimulatedPositionSession } from '../../shared/positionTracking/useSimulatedPositionSession';
import { PanelProps } from '../types';
import { useCameraLockBridge } from './bridge';

// Same tracking UI as simulated-position (a moving tracked position is needed to see
// the camera lock's effect at all) plus the "Recenter camera on position" toggle,
// enabled by passing setCameraLockOnPosition -- see SimulatedPositionControls.tsx.
const CameraLockOnPositionPanel = ({ sheet }: PanelProps) => {
  const { locked, setCameraLockOnPosition } = useCameraLockBridge();
  const session = useSimulatedPositionSession({
    // Same pre-filled pair on the 4 tracking screens (see demoMap.ts).
    initialOriginId: TRACKING_FROM,
    initialDestinationId: TRACKING_TO,
  });

  return (
    <BottomSheet {...sheet}>
      <SimulatedPositionControls
        session={session}
        setCameraLockOnPosition={setCameraLockOnPosition}
        cameraLockOnPosition={locked}
      />
    </BottomSheet>
  );
};

export default CameraLockOnPositionPanel;
