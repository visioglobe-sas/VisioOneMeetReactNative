import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AddLocaleResult, LocaleInfo, VisioMapBridge } from '../components/VisioMapView';

interface Props {
  addLocaleResult: AddLocaleResult | null;
  addLocale: VisioMapBridge['addLocale'];
  localeInfo: LocaleInfo;
  localeError: string | null;
  setLocale: VisioMapBridge['setLocale'];
}

// The same fixed dictionary the WebView side hardcodes in addSpanishLocale
// (visioOneHtml.ts/visioOne.html) -- kept here only for display labels/order, not sent
// over the bridge. 'search-for-anything' is one of the SDK's own predefined UI keys
// (see addLocale's doc comment in Translator.ts); 'welcome-message' is a plain custom
// key the SDK gives no built-in meaning to.
const DEMO_KEYS: { key: string; label: string }[] = [
  { key: 'search-for-anything', label: "'search-for-anything' (SDK UI text)" },
  { key: 'welcome-message', label: "'welcome-message' (custom app key)" },
];

const AddLocaleOverlay = ({ addLocaleResult, addLocale, localeInfo, localeError, setLocale }: Props) => {
  const added = addLocaleResult !== null;
  const isSpanishActive = localeInfo.currentLocale === 'es';

  return (
    <View style={styles.column}>
      <View style={styles.column}>
        {DEMO_KEYS.map(({ key, label }) => (
          <View key={key} style={styles.row}>
            <Text style={styles.key}>{label}</Text>
            <Text style={added ? styles.value : styles.valueMissing}>
              {added ? addLocaleResult.translations[key] ?? '' : '(not added yet)'}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={addLocale}>
        <Text style={styles.buttonText}>
          {added ? "Add Spanish locale again" : "Add Spanish locale"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonSecondary, !added ? styles.buttonDisabled : null]}
        disabled={!added}
        onPress={() => setLocale('es')}>
        <Text style={styles.buttonText}>
          {isSpanishActive ? 'Spanish is active' : 'Switch to Spanish'}
        </Text>
      </TouchableOpacity>

      {localeError ? <Text style={styles.error}>{localeError}</Text> : null}

      <Text style={styles.hint}>
        "Add Spanish locale" calls venue.translator.addLocale('es', {'{'}...{'}'}) then
        immediately reads each key back via translate(key, 'es') -- the values above are
        that proof, regardless of whether any SDK UI text is visible. 'es' was never
        authored in VisioMapEditor for this map: it can never rename places or labels,
        only override the SDK's own predefined UI/nav strings and any custom key like
        the second one. "Switch to Spanish" reuses setCurrentLocale('es') so SDK UI text
        would update live too, if any happens to be shown -- a bonus, not the main proof.
      </Text>
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

export default AddLocaleOverlay;
