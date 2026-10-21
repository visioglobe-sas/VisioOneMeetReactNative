import * as React from 'react';

import BottomSheet from '../components/BottomSheet';
import { GeofenceZone, PositionSimulationResolution, VisioMapBridge } from '../components/VisioMapView';
import AccuracyCircleStyleOverlay, {
  DEFAULT_DESTINATION_ID,
  DEFAULT_ORIGIN_ID,
  DEFAULT_POSITION_TRACKER_STYLE,
  DEFAULT_RADIUS,
  PositionTrackerStyle,
} from './AccuracyCircleStyleOverlay';
import GeofencingOverlay, { useGeofenceTracker } from './GeofencingOverlay';
import SimulatedPositionOverlay from './SimulatedPositionOverlay';
import { useSimulatedPositionSession } from './useSimulatedPositionSession';

// The 4 screens driven by a simulated tracked position.
export const TRACKING_FEATURE_SLUGS = [
  'simulated-position',
  'camera-lock-on-position',
  'geofencing',
  'accuracy-circle-style',
] as const;
export type TrackingFeatureSlug = (typeof TRACKING_FEATURE_SLUGS)[number];

export const isTrackingFeatureSlug = (slug: string): slug is TrackingFeatureSlug =>
  (TRACKING_FEATURE_SLUGS as readonly string[]).includes(slug);

interface Props {
  slug: TrackingFeatureSlug;
  bridge: VisioMapBridge;
  positionSimulation: { resolution: PositionSimulationResolution | null; error: string | null };
  geofencing: { zone: GeofenceZone | null; error: string | null };
  cameraLockOnPosition: boolean;
  visible: boolean;
  onClose: () => void;
}

// Rendered by FeatureScreen in the map's always-mounted overlay tree (not inside the
// bottom sheet) for the tracking screens. It owns the simulation session -- fields,
// running flag, the single tick loop -- plus the screen-specific state (geofencing
// zone check, accuracy-circle style), and only hands them to the sheet's content for
// display. So closing the sheet (a React Native Modal, whose content unmounts) doesn't
// stop the simulation and the map can be panned while the position keeps moving;
// reopening it shows the current state; leaving the screen unmounts this host, which
// stops the loop.
const TrackingFeatureHost = ({
  slug,
  bridge,
  positionSimulation,
  geofencing,
  cameraLockOnPosition,
  visible,
  onClose,
}: Props) => {
  const [trackerStyle, setTrackerStyle] = React.useState<PositionTrackerStyle>(
    DEFAULT_POSITION_TRACKER_STYLE,
  );
  const trackerStyleRef = React.useRef(trackerStyle);
  trackerStyleRef.current = trackerStyle;

  const geofenceTracker = useGeofenceTracker(geofencing.zone, bridge.setGeofenceAlert);

  const isAccuracyCircleStyle = slug === 'accuracy-circle-style';
  const session = useSimulatedPositionSession({
    resolvePois: bridge.resolvePositionSimulationPois,
    injectTrackedPosition: bridge.injectTrackedPosition,
    stopSimulation: bridge.stopPositionSimulation,
    resolution: positionSimulation.resolution,
    error: positionSimulation.error,
    onPositionTick: slug === 'geofencing' ? geofenceTracker.onPositionTick : undefined,
    onTrackingStopped: slug === 'geofencing' ? geofenceTracker.onTrackingStopped : undefined,
    // accuracy-circle-style: the SDK resets color/opacity to its defaults on every
    // stop, so re-apply the selection on every start, right before the first
    // injected position.
    onTrackingStarted: isAccuracyCircleStyle
      ? () => bridge.setPositionTrackerStyle(trackerStyleRef.current.color, trackerStyleRef.current.opacity)
      : undefined,
    initialOriginId: isAccuracyCircleStyle ? DEFAULT_ORIGIN_ID : undefined,
    initialDestinationId: isAccuracyCircleStyle ? DEFAULT_DESTINATION_ID : undefined,
    initialRadius: isAccuracyCircleStyle ? DEFAULT_RADIUS : undefined,
  });

  const renderContent = () => {
    switch (slug) {
      case 'simulated-position':
        return <SimulatedPositionOverlay session={session} />;
      case 'camera-lock-on-position':
        // Same tracking UI as simulated-position (a moving tracked position is needed
        // to see the camera lock's effect at all) plus the extra toggle, enabled by
        // passing setCameraLockOnPosition -- see SimulatedPositionOverlay.tsx.
        return (
          <SimulatedPositionOverlay
            session={session}
            setCameraLockOnPosition={bridge.setCameraLockOnPosition}
            cameraLockOnPosition={cameraLockOnPosition}
          />
        );
      case 'geofencing':
        return (
          <GeofencingOverlay
            session={session}
            tracker={geofenceTracker}
            resolveZone={bridge.resolveGeofenceZone}
            zone={geofencing.zone}
            zoneError={geofencing.error}
          />
        );
      case 'accuracy-circle-style':
        // Same tracking UI as simulated-position (pre-filled POIs, 6 m radius) plus
        // color/opacity controls -- see AccuracyCircleStyleOverlay.tsx.
        return (
          <AccuracyCircleStyleOverlay
            session={session}
            setPositionTrackerStyle={bridge.setPositionTrackerStyle}
            style={trackerStyle}
            onStyleChange={setTrackerStyle}
          />
        );
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {renderContent()}
    </BottomSheet>
  );
};

export default TrackingFeatureHost;
