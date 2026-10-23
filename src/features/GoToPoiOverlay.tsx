import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import { GOTO_POI_ID } from '../demoMap';
import { useLocale } from '../i18n/useLocale';
import { FeatureProps } from './types';

const GoToPoiFeature = ({ ctx, sheet }: FeatureProps) => {
  const { t } = useLocale();
  const { bridge, commandError } = ctx;
  const [placeId, setPlaceId] = React.useState(GOTO_POI_ID);
  // An unknown id comes back as a 'command_error' for 'select_place': only show the one
  // answering the last Go.
  const [sentAt, setSentAt] = React.useState(0);
  const error =
    commandError && commandError.command === 'select_place' && commandError.at >= sentAt
      ? commandError.message
      : null;

  const handleGo = () => {
    setSentAt(Date.now());
    bridge.goToPlace(placeId.trim());
  };

  const handleClear = () => {
    setSentAt(Date.now());
    bridge.clearPlace();
  };

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
          style={[styles.button, !placeId.trim() && styles.disabled]}
          disabled={!placeId.trim()}
          onPress={handleGo}>
          <Text style={styles.buttonText}>{t('common.go')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={handleClear}>
          <Text style={styles.buttonText}>{t('common.clear')}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{t('common.commandError', { message: error })}</Text> : null}
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
  error: {
    color: '#E74C3C',
    fontSize: 13,
  },
});

export default GoToPoiFeature;
