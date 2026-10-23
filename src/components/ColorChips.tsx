import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ColorOption {
  value: string;
  label: string;
}

interface Props {
  options: ColorOption[];
  selected: string;
  onSelect: (value: string) => void;
}

// A row of color chips (swatch + name), the selected one outlined. Shared by every
// panel that picks a color.
const ColorChips = ({ options, selected, onSelect }: Props) => (
  <View style={styles.row}>
    {options.map(({ value, label }) => {
      const isActive = value.toLowerCase() === selected.toLowerCase();
      return (
        <TouchableOpacity
          key={value}
          accessibilityLabel={label}
          style={[styles.chip, isActive && styles.chipActive]}
          onPress={() => onSelect(value)}>
          <View style={[styles.swatch, { backgroundColor: value }]} />
          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: '#fff',
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    // Keeps dark swatches visible on the dark panel background.
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
});

export default ColorChips;
