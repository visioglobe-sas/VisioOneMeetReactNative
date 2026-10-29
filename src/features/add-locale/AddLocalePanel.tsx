import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { StringKey } from '../../i18n/strings';
import { useLocale } from '../../i18n/useLocale';
import { LocaleInfo, useLocalesBridge } from '../runtime-locale/bridge';
import { PanelProps } from '../types';
import { AddLocaleResult, useAddLocaleBridge } from './bridge';

interface Props {
  addLocaleResult: AddLocaleResult | null;
  addLocale: () => void;
  localeInfo: LocaleInfo;
  localeError: string | null;
  setLocale: (locale: string) => void;
}

// The same fixed dictionary the page hardcodes in 'add_locale'
// (webview.js) -- kept here only for display labels/order, not sent
// over the bridge. 'search-for-anything' is one of the SDK's own predefined UI keys
// (see addLocale's doc comment in Content/Translator.d.ts in the SDK typings);
// 'welcome-message' is a plain custom key the SDK gives no built-in meaning to.
const DEMO_KEYS: { key: string; labelKey: StringKey }[] = [
  { key: 'search-for-anything', labelKey: 'addLocale.keySdk' },
  { key: 'welcome-message', labelKey: 'addLocale.keyCustom' },
];

const AddLocaleControls = ({ addLocaleResult, addLocale, localeInfo, localeError, setLocale }: Props) => {
  const { t } = useLocale();
  const added = addLocaleResult !== null;
  const isSpanishActive = localeInfo.currentLocale === 'es';

  return (
    <View style={styles.column}>
      <View style={styles.column}>
        {DEMO_KEYS.map(({ key, labelKey }) => (
          <View key={key} style={styles.row}>
            <Text style={styles.key}>{t(labelKey)}</Text>
            <Text style={added ? styles.value : styles.valueMissing}>
              {added ? addLocaleResult.translations[key] ?? '' : t('addLocale.notAdded')}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={addLocale}>
        <Text style={styles.buttonText}>
          {added ? t('addLocale.addAgain') : t('addLocale.add')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonSecondary, !added ? styles.buttonDisabled : null]}
        disabled={!added}
        onPress={() => setLocale('es')}>
        <Text style={styles.buttonText}>
          {isSpanishActive ? t('addLocale.active') : t('addLocale.switch')}
        </Text>
      </TouchableOpacity>

      {localeError ? <Text style={styles.error}>{localeError}</Text> : null}

      <Text style={styles.hint}>{t('addLocale.hint')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  row: {
    gap: 2,
  },
  key: {
    color: '#aaa',
    fontSize: 12,
  },
  value: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  valueMissing: {
    color: '#666',
    fontSize: 15,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
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
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
});

const AddLocalePanel = ({ sheet }: PanelProps) => {
  const { addLocaleResult, addLocale } = useAddLocaleBridge();
  const { localeInfo, error, setLocale } = useLocalesBridge();
  return (
    <BottomSheet {...sheet}>
      <AddLocaleControls
        addLocaleResult={addLocaleResult}
        addLocale={addLocale}
        localeInfo={localeInfo}
        localeError={error}
        setLocale={setLocale}
      />
    </BottomSheet>
  );
};

export default AddLocalePanel;
