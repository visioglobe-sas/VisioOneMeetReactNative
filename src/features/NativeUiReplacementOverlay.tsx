import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import { useLocale } from '../i18n/useLocale';
import { FloorList } from './FloorSelectorOverlay';
import { FeatureProps } from './types';

// Hides the SDK's own floor-selector widget as soon as the map is ready and reuses
// floor-selector's own picker verbatim -- the point of this feature is that the app's
// existing native picker needs no changes to stand in for the SDK's widget, see
// docs/features/native-ui-replacement.md. This component stays mounted for the whole
// screen, so the switch keeps reflecting the map when the panel is reopened.
const NativeUiReplacementFeature = ({ ctx, sheet }: FeatureProps) => {
  const { t } = useLocale();
  const { status, bridge } = ctx;
  const [sdkFloorSelectorVisible, setSdkFloorSelectorVisible] = React.useState(false);

  React.useEffect(() => {
    if (status === 'ready') {
      bridge.setUIPartVisible('floorSelector', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const toggle = (isVisible: boolean) => {
    setSdkFloorSelectorVisible(isVisible);
    bridge.setUIPartVisible('floorSelector', isVisible);
  };

  return (
    <BottomSheet {...sheet}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('nativeUiReplacement.toggleLabel')}</Text>
        <Switch testID="sdk-floor-selector" value={sdkFloorSelectorVisible} onValueChange={toggle} />
      </View>
      <Text style={styles.hint}>{t('nativeUiReplacement.hint')}</Text>
      <FloorList venueLayout={ctx.venueLayout} goToFloor={bridge.goToFloor} goToBuilding={bridge.goToBuilding} />
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
    flexShrink: 1,
    paddingRight: 12,
  },
  hint: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default NativeUiReplacementFeature;
