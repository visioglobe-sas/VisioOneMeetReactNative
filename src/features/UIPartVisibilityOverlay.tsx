import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';
import { UIPart } from '../screens/useVisioMap';
import { StringKey } from '../i18n/strings';
import { useLocale } from '../i18n/useLocale';

interface Props {
  setUIPartVisible: VisioMapBridge['setUIPartVisible'];
}

// Order and labelKey mirror the SDK's own View.UIPart union exactly (View.ts in visioone) --
// these 5 string values are the only ones it recognizes, case-sensitive, no others exist.
const UI_PARTS: { part: UIPart; labelKey: StringKey }[] = [
  { part: 'floorSelector', labelKey: 'uiPartVisibility.floorSelector' },
  { part: 'navigation', labelKey: 'uiPartVisibility.navigation' },
  { part: 'poiDetails', labelKey: 'uiPartVisibility.poiDetails' },
  { part: 'search', labelKey: 'uiPartVisibility.search' },
  { part: 'userTracking', labelKey: 'uiPartVisibility.userTracking' },
];

const UIPartVisibilityOverlay = ({ setUIPartVisible }: Props) => {
  const { t } = useLocale();
  // The SDK's own default is all parts visible -- mirror that here rather than querying
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
    <View style={styles.column}>
      {UI_PARTS.map(({ part, labelKey }) => (
        <View key={part} style={styles.row}>
          <Text style={styles.label}>{t(labelKey)}</Text>
          <Switch value={visibility[part]} onValueChange={(isVisible) => toggle(part, isVisible)} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
});

export default UIPartVisibilityOverlay;
