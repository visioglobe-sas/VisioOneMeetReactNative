import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';

interface Props {
  categories: string[];
  highlightCategory: VisioMapBridge['highlightCategory'];
  clearCategoryHighlight: VisioMapBridge['clearCategoryHighlight'];
}

// Only one category is ever highlighted at a time. This overlay tracks which one
// locally (it's the only thing driving the highlight, so no round trip is needed
// just to know which chip is selected) -- the WebView side separately guarantees
// the previous category's surfaces are reverted before the new one is applied, see
// highlightCategory in visioOneHtml.ts/visioOne.html.
const CategoryHighlightOverlay = ({ categories, highlightCategory, clearCategoryHighlight }: Props) => {
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
    <View style={styles.column}>
      {categories.length === 0 ? (
        <Text style={styles.hint}>Loading categories…</Text>
      ) : (
        <View style={styles.chipsRow}>
          {categories.map((categoryId) => (
            <TouchableOpacity
              key={categoryId}
              style={[styles.chip, selectedCategoryId === categoryId ? styles.chipSelected : null]}
              onPress={() => handleSelect(categoryId)}>
              <Text style={styles.chipText}>{categoryId}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.buttonSecondary}
        disabled={!selectedCategoryId}
        onPress={handleClear}>
        <Text style={styles.buttonText}>Clear</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Tap a category to highlight every place that belongs to it. Not every place
        has a surface to color (some are marker-only), so a few may not visibly
        change.
      </Text>
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
  buttonSecondary: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
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

export default CategoryHighlightOverlay;
