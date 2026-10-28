import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

export const useCustomThemeBridge = () => {
  const { send } = useMapBridge();
  // view.themes, from 'ready'.
  const [themes, setThemes] = React.useState<string[]>([]);

  useMapEvent('ready', (data) => setThemes(data?.themes ?? []));

  return {
    themes,
    // view.setTheme(theme). `theme` must be one of view.themes -- setTheme throws on any
    // other id.
    setTheme: (theme: string) => send('set_theme', { theme }),
    // view.accentColor / view.textAccentColor recolor the SDK's own UI buttons (e.g. the
    // place card's "Go" button) live. Either field can be omitted.
    setAccentColors: (colors: { accentColor?: string; textAccentColor?: string }) =>
      send('set_accent_colors', colors),
  };
};
