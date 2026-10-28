import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Mirrors the SDK's ExploreMode type exactly (View/ExploreMode.d.ts in the SDK
// typings).
export type ExploreMode = 'global' | 'building' | 'floor';

export const useExploreModeBridge = () => {
  const { send } = useMapBridge();
  // The SDK's own default is 'global' -- mirrored here until 'ready' reports the real
  // value.
  const [exploreMode, setExploreModeState] = React.useState<ExploreMode>('global');

  useMapEvent('ready', (data) => setExploreModeState(data?.currentExploreMode ?? 'global'));
  // Also fires when the mode changes from direct camera/map interaction (e.g. a click
  // in 'building' mode auto-switches to 'floor') rather than setExploreMode below.
  useMapEvent('explore_mode_changed', (data) =>
    setExploreModeState(data?.currentExploreMode ?? 'global'),
  );

  return {
    exploreMode,
    // Sets view.currentExploreMode. Fire-and-forget: the resulting mode comes back as
    // 'explore_mode_changed'.
    setExploreMode: (mode: ExploreMode) => send('set_explore_mode', { mode }),
  };
};
