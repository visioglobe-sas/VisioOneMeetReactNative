import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { DEFAULT_BASE_URL } from '../../bridge/VisioMapView';
import BottomSheet from '../../components/BottomSheet';
import { useLocale } from '../../i18n/useLocale';
import FeatureMap from '../../shell/FeatureMap';

interface Props {
  baseURL: string;
  onChangeBaseURL: (value: string) => void;
  onReload: () => void;
}

const CustomBaseUrlControls = ({ baseURL, onChangeBaseURL, onReload }: Props) => {
  const { t } = useLocale();
  return (
    <View style={styles.column}>
      <TextInput
        style={styles.input}
        placeholder={t('customBaseUrl.placeholder')}
        placeholderTextColor="#666"
        value={baseURL}
        onChangeText={onChangeBaseURL}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <TouchableOpacity style={styles.button} onPress={onReload}>
        <Text style={styles.buttonText}>{t('customBaseUrl.reload')}</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>{t('customBaseUrl.hint')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  input: {
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
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
});

// baseURL is a loadVenue option, not a live property, so "Reload" can't just call a
// setter on the already-loaded venue: it bumps the map's key instead, which remounts
// the WebView against the current field value (a fresh loadVenue). The field's state
// lives here, above the map, so it survives that remount. See
// docs/features/custom-base-url.md.
const CustomBaseUrlScreen = () => {
  const [baseURL, setBaseURL] = React.useState(DEFAULT_BASE_URL);
  // The value the current map was loaded with: editing the field alone changes nothing.
  const [loadedBaseURL, setLoadedBaseURL] = React.useState(DEFAULT_BASE_URL);
  const [reloadKey, setReloadKey] = React.useState(0);

  return (
    <FeatureMap mapKey={`custom-base-url-${reloadKey}`} baseURL={loadedBaseURL}>
      {(sheet) => (
        <BottomSheet {...sheet}>
          <CustomBaseUrlControls
            baseURL={baseURL}
            onChangeBaseURL={setBaseURL}
            onReload={() => {
              setLoadedBaseURL(baseURL);
              setReloadKey((key) => key + 1);
            }}
          />
        </BottomSheet>
      )}
    </FeatureMap>
  );
};

export default CustomBaseUrlScreen;
