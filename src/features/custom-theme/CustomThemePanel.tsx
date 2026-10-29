import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ColorChips from '../../components/ColorChips';
import BottomSheet from '../../components/BottomSheet';
import { StringKey } from '../../i18n/strings';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { useCustomThemeBridge } from './bridge';

// The SDK's own default scene theme -- there is no current-theme getter, so the
// selection is tracked app-side starting from this value.
const DEFAULT_THEME = 'day';

const ACCENT_COLORS: { value: string; labelKey: StringKey }[] = [
  { value: '#0094F0', labelKey: 'color.blue' },
  { value: '#E53935', labelKey: 'color.red' },
  { value: '#43A047', labelKey: 'color.green' },
  { value: '#8E24AA', labelKey: 'color.purple' },
];

const TEXT_ACCENT_COLORS: { value: string; labelKey: StringKey }[] = [
  { value: '#FFFFFF', labelKey: 'color.white' },
  { value: '#FFEB3B', labelKey: 'color.yellow' },
  { value: '#212121', labelKey: 'color.black' },
];

interface CustomThemeSelection {
  theme: string;
  accentColor: string;
  textAccentColor: string;
}

const DEFAULT_CUSTOM_THEME_SELECTION: CustomThemeSelection = {
  theme: DEFAULT_THEME,
  accentColor: ACCENT_COLORS[0].value,
  textAccentColor: TEXT_ACCENT_COLORS[0].value,
};

interface Props {
  // view.themes, read from the WebView once the map is ready.
  themes: string[];
  // Owned by the panel component so it survives the bottom sheet being closed/reopened
  // (e.g. to tap a place and see the recolored card).
  selection: CustomThemeSelection;
  onSelectionChange: (selection: CustomThemeSelection) => void;
  setTheme: (theme: string) => void;
  setAccentColors: (colors: { accentColor?: string; textAccentColor?: string }) => void;
}

const CustomThemeControls = ({
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
    options: { value: string; labelKey: StringKey }[],
    current: string,
    onPress: (value: string) => void,
  ) => (
    <ColorChips
      options={options.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
      selected={current}
      onSelect={onPress}
    />
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
        <Text style={styles.meta}>{t('customTheme.loading')}</Text>
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
  label: {
    color: '#aaa',
    fontSize: 13,
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

const CustomThemePanel = ({ sheet }: PanelProps) => {
  const { themes, setTheme, setAccentColors } = useCustomThemeBridge();
  const [selection, setSelection] = React.useState<CustomThemeSelection>(
    DEFAULT_CUSTOM_THEME_SELECTION,
  );
  return (
    <BottomSheet {...sheet}>
      <CustomThemeControls
        themes={themes}
        selection={selection}
        onSelectionChange={setSelection}
        setTheme={setTheme}
        setAccentColors={setAccentColors}
      />
    </BottomSheet>
  );
};

export default CustomThemePanel;
