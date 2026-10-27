import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useLocale } from '../i18n/useLocale';

interface Props {
  baseURL: string;
  onChangeBaseURL: (value: string) => void;
  onReload: () => void;
}

const CustomBaseUrlOverlay = ({ baseURL, onChangeBaseURL, onReload }: Props) => {
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

export default CustomBaseUrlOverlay;
