import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { LocaleInfo, useLocalesBridge } from './bridge';

interface Props {
  localeInfo: LocaleInfo;
  error: string | null;
  setLocale: (locale: string) => void;
}

// Display names for the two locale codes this demo offers -- this mapping is app-side
// knowledge, not something the SDK provides (venue.translator resolves POI/UI text into
// a locale, not the locale code's own display name). Falls back to the raw code for any
// other locale a different venue might expose.
const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'Français',
};

const RuntimeLocaleControls = ({ localeInfo, error, setLocale }: Props) => {
  const { t } = useLocale();
  const { locales, currentLocale } = localeInfo;

  return (
    <View style={styles.column}>
      {locales.length === 0 ? (
        <Text style={styles.hint}>{t('runtimeLocale.loading')}</Text>
      ) : (
        <View style={styles.chipsRow}>
          {locales.map((locale) => (
            <TouchableOpacity
              key={locale}
              style={[styles.chip, currentLocale === locale ? styles.chipSelected : null]}
              onPress={() => setLocale(locale)}>
              <Text style={styles.chipText}>{LOCALE_LABELS[locale] ?? locale}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.hint}>{t('runtimeLocale.hint')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#444',
  },
  chipSelected: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  chipText: {
    color: '#fff',
    fontSize: 13,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
  },
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
});

const RuntimeLocalePanel = ({ sheet }: PanelProps) => {
  const { localeInfo, error, setLocale } = useLocalesBridge();
  return (
    <BottomSheet {...sheet}>
      <RuntimeLocaleControls localeInfo={localeInfo} error={error} setLocale={setLocale} />
    </BottomSheet>
  );
};

export default RuntimeLocalePanel;
