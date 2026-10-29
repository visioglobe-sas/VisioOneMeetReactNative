import * as React from 'react';

import { Position, useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Stand-in for a real positioning feed: linearly interpolates between two resolved POI
// positions and ping-pongs back and forth on a timer, calling injectTrackedPosition on
// every tick. See docs/features/simulated-position.md. The timer lives on the React
// Native side, not in the WebView.
//
// The page side is src/features/simulated-position/webview.js: 'resolve_poi_positions'
// resolves both POIs once (answered with 'poi_positions_resolved' or
// 'position_simulation_error'), then every tick sends 'inject_tracked_position'
// (view.injectTrackedPosition), and stopping sends 'stop_position_simulation'
// (view.allowTracking = false).
//
// This hook is used by the feature's panel component, NOT by the bottom sheet's
// content: the sheet is a React Native Modal whose content unmounts when it closes,
// and the simulation must keep running while the sheet is closed (so the map can be
// panned/zoomed during tracking). Exactly one loop per screen; leaving the screen
// unmounts the panel, which stops it.
const TICK_MS = 150;
const STEP_PER_TICK = 0.02; // fraction of the origin->destination leg advanced per tick
export const RADIUS_MIN = 1;
export const RADIUS_MAX = 20;
const RADIUS_DEFAULT = 5;

// Both POIs of the run, resolved to positions by the page.
interface PositionSimulationResolution {
  origin: Position;
  destination: Position;
}

interface SimulatedPositionSessionOptions {
  // geofencing: fires with the freshly-interpolated position on every tick while
  // running; onTrackingStopped fires once when the loop stops (Stop pressed, or the
  // screen is left) so it can revert its own "inside zone" alert.
  onPositionTick?: (position: Position) => void;
  onTrackingStopped?: () => void;
  // accuracy-circle-style: fires once per Start, right before the first
  // injectTrackedPosition of the run -- the SDK resets the tracker's color/opacity
  // whenever tracking stops, so that feature re-applies its selected style here.
  onTrackingStarted?: () => void;
  initialOriginId?: string;
  initialDestinationId?: string;
  initialRadius?: number;
}

export interface SimulatedPositionSession {
  originId: string;
  setOriginId: (value: string) => void;
  destinationId: string;
  setDestinationId: (value: string) => void;
  radius: number;
  adjustRadius: (delta: number) => void;
  running: boolean;
  // True from the moment Start is pressed until the WebView's async POI-lookup
  // response ('poi_positions_resolved' or 'position_simulation_error') comes back.
  awaitingResolution: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
}

export const useSimulatedPositionSession = ({
  onPositionTick,
  onTrackingStopped,
  onTrackingStarted,
  initialOriginId = '',
  initialDestinationId = '',
  initialRadius = RADIUS_DEFAULT,
}: SimulatedPositionSessionOptions): SimulatedPositionSession => {
  const [originId, setOriginId] = React.useState(initialOriginId);
  const [destinationId, setDestinationId] = React.useState(initialDestinationId);
  const [radius, setRadius] = React.useState(initialRadius);
  const [running, setRunning] = React.useState(false);
  const [awaitingResolution, setAwaitingResolution] = React.useState(false);
  const [resolution, setResolution] = React.useState<PositionSimulationResolution | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { send } = useMapBridge();
  const awaitingResolutionRef = React.useRef(awaitingResolution);
  awaitingResolutionRef.current = awaitingResolution;

  // Answers to 'resolve_poi_positions'. Only one request is in flight at a time (Start
  // is disabled while awaiting), so an answer arriving while awaiting is the one for
  // the latest request.
  useMapEvent<PositionSimulationResolution>('poi_positions_resolved', (data) => {
    if (awaitingResolutionRef.current) {
      setResolution(data);
      setAwaitingResolution(false);
      setRunning(true);
    }
  });
  useMapEvent('position_simulation_error', (data) => {
    if (awaitingResolutionRef.current) {
      setError(String(data?.message ?? data));
      setAwaitingResolution(false);
    }
  });

  // Read by the interpolation loop below without being dependencies of it -- so moving
  // the radius stepper while the simulation is running changes the radius used on the
  // next tick without restarting the loop (and without resetting the ping-pong
  // progress), and the latest callbacks/bridge functions are always the ones called.
  const radiusRef = React.useRef(radius);
  radiusRef.current = radius;
  const callbacksRef = React.useRef({
    injectTrackedPosition: (position: Position, precisionCircleRadius: number) =>
      send('inject_tracked_position', { position, precisionCircleRadius }),
    stopSimulation: () => send('stop_position_simulation'),
    onPositionTick,
    onTrackingStopped,
    onTrackingStarted,
  });
  callbacksRef.current = {
    ...callbacksRef.current,
    onPositionTick,
    onTrackingStopped,
    onTrackingStarted,
  };

  // The loop only ever runs on the resolution it started with: Start is disabled while
  // running, so `resolution` can't change underneath a running loop.
  const runResolution = running ? resolution : null;

  React.useEffect(() => {
    if (!runResolution) {
      return;
    }

    const { origin, destination } = runResolution;
    let progress = 0;
    let direction = 1;

    const tick = () => {
      const hasAltitude = origin.altitude != null && destination.altitude != null;
      const position = {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * progress,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * progress,
        altitude: hasAltitude
          ? origin.altitude! + (destination.altitude! - origin.altitude!) * progress
          : undefined,
      };
      callbacksRef.current.injectTrackedPosition(position, radiusRef.current);
      callbacksRef.current.onPositionTick?.(position);

      progress += direction * STEP_PER_TICK;
      if (progress >= 1) {
        progress = 1;
        direction = -1;
      } else if (progress <= 0) {
        progress = 0;
        direction = 1;
      }
    };

    callbacksRef.current.onTrackingStarted?.();
    tick(); // place the marker at the origin immediately instead of waiting a full tick
    const timer = setInterval(tick, TICK_MS);

    return () => {
      clearInterval(timer);
      // No dedicated stop call on the SDK -- this is what removes the marker/circle.
      // It also turns the camera lock off on the SDK side, which reports it back
      // through cameraLockOnPosition -- no app-side reset needed.
      callbacksRef.current.stopSimulation();
      callbacksRef.current.onTrackingStopped?.();
    };
  }, [runResolution]);

  const start = () => {
    const origin = originId.trim();
    const destination = destinationId.trim();
    if (running || awaitingResolution || !origin || !destination) {
      return;
    }
    setResolution(null);
    setError(null);
    setAwaitingResolution(true);
    send('resolve_poi_positions', { originId: origin, destinationId: destination });
  };

  const stop = () => {
    setAwaitingResolution(false);
    setRunning(false);
  };

  const adjustRadius = (delta: number) => {
    setRadius((prev) => Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, prev + delta)));
  };

  return {
    originId,
    setOriginId,
    destinationId,
    setDestinationId,
    radius,
    adjustRadius,
    running,
    awaitingResolution,
    error,
    start,
    stop,
  };
};
