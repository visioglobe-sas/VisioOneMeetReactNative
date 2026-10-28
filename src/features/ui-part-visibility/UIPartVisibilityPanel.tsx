import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { StringKey } from '../../i18n/strings';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { UIPart, useUIPartVisibilityBridge } from './bridge';

// Order and labelKey mirror the SDK's own UIPart union exactly (View/View.d.ts in the
// SDK typings) -- these 5 string values are the only ones it recognizes, case-sensitive.
const UI_PARTS: { part: UIPart; labelKey: StringKey }[] = [
  { part: 'floorSelector', labelKey: 'uiPartVisibility.floorSelector' },
  { part: 'navigation', labelKey: 'uiPartVisibility.navigation' },
  { part: 'poiDetails', labelKey: 'uiPartVisibility.poiDetails' },
  { part: 'search', labelKey: 'uiPartVisibility.search' },
  { part: 'userTracking', labelKey: 'uiPartVisibility.userTracking' },
];

// The switch states live here (mounted for the whole screen), not in the panel, so
// reopening the panel shows what the map actually displays.
const UIPartVisibilityPanel = ({ sheet }: PanelProps) => {
  const { t } = useLocale();
  const { setUIPartVisible } = useUIPartVisibilityBridge();
  // The SDK's own default is all parts visible -- mirrored here rather than querying
  // view.isUIPartVisible(), which would need a round trip through the WebView bridge.
  const [visibility, setVisibility] = React.useState<Record<UIPart, boolean>>({
    floorSelector: true,
    navigation: true,
    poiDetails: true,
    search: true,
    userTracking: true,
  });

  const toggle = (part: UIPart, isVisible: boolean) => {
    setVisibility((prev) => ({ ...prev, [part]: isVisible }));
    setUIPartVisible(part, isVisible);
  };

  return (
    <BottomSheet {...sheet}>
      {UI_PARTS.map(({ part, labelKey }) => (
        <View key={part} style={styles.row}>
          <Text style={styles.label}>{t(labelKey)}</Text>
          <Switch
            testID={`ui-part-${part}`}
            value={visibility[part]}
            onValueChange={(isVisible) => toggle(part, isVisible)}
          />
        </View>
      ))}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
});

export default UIPartVisibilityPanel;
