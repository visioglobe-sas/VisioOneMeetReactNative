import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { useCategoryHighlightBridge } from './bridge';

// Only one category is ever highlighted at a time. The selected category is tracked
// here (this component stays mounted for the whole screen, so reopening the panel
// shows it and Clear stays enabled while a highlight is on the map); the WebView side
// separately reverts the previous category's surfaces before applying a new one, see
// 'highlight_category' in webview.js.
const CategoryHighlightPanel = ({ sheet }: PanelProps) => {
  const { t } = useLocale();
  const { categories, highlightCategory, clearCategoryHighlight } = useCategoryHighlightBridge();
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);

  const handleSelect = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      // Tapping the already-selected category again clears it.
      clearCategoryHighlight();
      setSelectedCategoryId(null);
      return;
    }
    highlightCategory(categoryId);
    setSelectedCategoryId(categoryId);
  };

  const handleClear = () => {
    clearCategoryHighlight();
    setSelectedCategoryId(null);
  };

  return (
    <BottomSheet {...sheet}>
      {categories.length === 0 ? (
        <Text style={styles.hint}>{t('categoryHighlight.loading')}</Text>
      ) : (
        <View style={styles.chipsRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.chip, selectedCategoryId === category.id ? styles.chipSelected : null]}
              onPress={() => handleSelect(category.id)}>
              <Text style={styles.chipText}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.buttonSecondary, !selectedCategoryId && styles.disabled]}
        disabled={!selectedCategoryId}
        onPress={handleClear}>
        <Text style={styles.buttonText}>{t('common.clear')}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>{t('categoryHighlight.hint')}</Text>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
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
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
});

export default CategoryHighlightPanel;
