import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';
import { useLocale } from '../i18n/useLocale';

// The SDK's own default scene theme -- there is no current-theme getter, so the
// selection is tracked app-side starting from this value.
export const DEFAULT_THEME = 'day';

const ACCENT_COLORS: { value: string; label: string }[] = [
  { value: '#0094F0', label: 'Blue' },
  { value: '#E53935', label: 'Red' },
  { value: '#43A047', label: 'Green' },
  { value: '#8E24AA', label: 'Purple' },
];

const TEXT_ACCENT_COLORS: { value: string; label: string }[] = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#FFEB3B', label: 'Yellow' },
  { value: '#212121', label: 'Black' },
];

export interface CustomThemeSelection {
  theme: string;
  accentColor: string;
  textAccentColor: string;
}

export const DEFAULT_CUSTOM_THEME_SELECTION: CustomThemeSelection = {
  theme: DEFAULT_THEME,
  accentColor: ACCENT_COLORS[0].value,
  textAccentColor: TEXT_ACCENT_COLORS[0].value,
};

interface Props {
  // view.themes, read from the WebView once the map is ready.
  themes: string[];
  // Owned by the parent screen so it survives the bottom sheet being closed/reopened.
  selection: CustomThemeSelection;
  onSelectionChange: (selection: CustomThemeSelection) => void;
  setTheme: VisioMapBridge['setTheme'];
  setAccentColors: VisioMapBridge['setAccentColors'];
}

const CustomThemeOverlay = ({
  themes,
  selection,
  onSelectionChange,
  setTheme,
  setAccentColors,
}: Props) => {
  const { t } = useLocale();

  const handleTheme = (theme: string) => {
    setTheme(theme);
    onSelectionChange({ ...selection, theme });
  };

  const handleAccentColor = (accentColor: string) => {
    setAccentColors({ accentColor });
    onSelectionChange({ ...selection, accentColor });
  };

  const handleTextAccentColor = (textAccentColor: string) => {
    setAccentColors({ textAccentColor });
    onSelectionChange({ ...selection, textAccentColor });
  };

  const handleReset = () => {
    setTheme(DEFAULT_CUSTOM_THEME_SELECTION.theme);
    setAccentColors({
      accentColor: DEFAULT_CUSTOM_THEME_SELECTION.accentColor,
      textAccentColor: DEFAULT_CUSTOM_THEME_SELECTION.textAccentColor,
    });
    onSelectionChange(DEFAULT_CUSTOM_THEME_SELECTION);
  };

  const renderChips = (
    options: { value: string; label: string }[],
    current: string,
    onPress: (value: string) => void,
  ) => (
    <View style={styles.row}>
      {options.map(({ value, label }) => {
        const isActive = value === current;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onPress(value)}>
            <View style={[styles.swatch, { backgroundColor: value }]} />
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.column}>
      <Text style={styles.label}>{t('customTheme.theme')}</Text>
      {themes.length > 0 ? (
        <View style={styles.segmented}>
          {themes.map((theme) => {
            const isActive = theme === selection.theme;
            return (
              <TouchableOpacity
                key={theme}
                style={[styles.segment, isActive && styles.segmentActive]}
                onPress={() => handleTheme(theme)}>
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{theme}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Text style={styles.meta}>Loading themes…</Text>
      )}

      <Text style={styles.label}>{t('customTheme.accentColor')}</Text>
      {renderChips(ACCENT_COLORS, selection.accentColor, handleAccentColor)}

      <Text style={styles.label}>{t('customTheme.textAccentColor')}</Text>
      {renderChips(TEXT_ACCENT_COLORS, selection.textAccentColor, handleTextAccentColor)}

      <TouchableOpacity style={styles.buttonSecondary} onPress={handleReset}>
        <Text style={styles.buttonText}>{t('customTheme.reset')}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>{t('customTheme.hint')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#222',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: '#fff',
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    // Keeps the Black (#212121) swatch visible on the dark panel background.
    borderWidth: 1,
    borderColor: '#888',
  },
  chipText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#057DBC',
  },
  segmentText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  meta: {
    color: '#fff',
    fontSize: 14,
  },
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
});

export default CustomThemeOverlay;
