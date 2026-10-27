import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import { CLICKABLE_SURFACE_POI_ID } from '../demoMap';
import { useLocale } from '../i18n/useLocale';
import { FeatureProps } from './types';

const ClickableSurfaceFeature = ({ ctx, sheet }: FeatureProps) => {
  const { t } = useLocale();
  const [placeId, setPlaceId] = React.useState(CLICKABLE_SURFACE_POI_ID);
  const id = placeId.trim();

  return (
    <BottomSheet {...sheet}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder={t('common.placeId')}
          placeholderTextColor="#666"
          value={placeId}
          onChangeText={setPlaceId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.button, !id && styles.disabled]}
          disabled={!id}
          onPress={() => ctx.bridge.setSurfaceInteractive(id, true)}>
          <Text style={styles.buttonText}>{t('clickableSurface.enable')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !id && styles.disabled]}
          disabled={!id}
          onPress={() => ctx.bridge.setSurfaceInteractive(id, false)}>
          <Text style={styles.buttonText}>{t('clickableSurface.disable')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ClickableSurfaceFeature;
