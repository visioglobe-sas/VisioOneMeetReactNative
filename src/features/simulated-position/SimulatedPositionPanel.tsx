import * as React from 'react';

import BottomSheet from '../../components/BottomSheet';
import { TRACKING_FROM, TRACKING_TO } from '../../demoMap';
import SimulatedPositionControls from '../../shared/positionTracking/SimulatedPositionControls';
import { useSimulatedPositionSession } from '../../shared/positionTracking/useSimulatedPositionSession';
import { PanelProps } from '../types';

// The session (fields, running flag, the single tick loop) lives in this component,
// which stays mounted for the whole screen: closing the sheet (a React Native Modal,
// whose content unmounts) doesn't stop the simulation, and the map can be panned while
// the position keeps moving. Leaving the screen unmounts it, which stops the loop. The
// page side is src/features/simulated-position/webview.js.
const SimulatedPositionPanel = ({ sheet }: PanelProps) => {
  const session = useSimulatedPositionSession({
    // Same pre-filled pair on the 4 tracking screens (see demoMap.ts).
    initialOriginId: TRACKING_FROM,
    initialDestinationId: TRACKING_TO,
  });

  return (
    <BottomSheet {...sheet}>
      <SimulatedPositionControls session={session} />
    </BottomSheet>
  );
};

export default SimulatedPositionPanel;
