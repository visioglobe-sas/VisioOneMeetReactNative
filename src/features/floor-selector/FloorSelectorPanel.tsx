import * as React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { useFloorSelectorBridge, VenueLayoutInfo } from './bridge';

interface FloorListProps {
  venueLayout: VenueLayoutInfo;
  goToFloor: (buildingId: string, floorId: string) => void;
  goToBuilding: (buildingId: string) => void;
}

// The app's own floor/building picker, driven by venueLayout (reported by the page and
// kept current by its 'currentfloorchanged' listener, see useFloorSelectorBridge). Also
// reused as is by native-ui-replacement.
export const FloorList = ({ venueLayout, goToFloor, goToBuilding }: FloorListProps) => {
  const { t } = useLocale();
  const { buildings, currentBuildingId, currentFloorId } = venueLayout;

  // No current building reported yet: fall back to the venue's first building.
  const activeBuilding = buildings.find((building) => building.id === currentBuildingId) || buildings[0];

  if (!activeBuilding) {
    return <Text style={styles.hint}>{t('floorSelector.empty')}</Text>;
  }

  // Top floor first, like most physical floor-selector widgets (and the SDK's own).
  const floors = [...activeBuilding.floors].sort((a, b) => b.levelIndex - a.levelIndex);

  return (
    <View style={styles.column}>
      {buildings.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buildingRow}>
          {buildings.map((building) => {
            const isActive = building.id === activeBuilding.id;
            return (
              <TouchableOpacity
                key={building.id}
                style={[styles.buildingChip, isActive && styles.buildingChipActive]}
                onPress={() => goToBuilding(building.id)}>
                <Text style={styles.buildingChipText}>{building.label || building.id}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {floors.map((floor) => {
        const isSelected = floor.id === currentFloorId && activeBuilding.id === currentBuildingId;
        return (
          <TouchableOpacity
            key={floor.id}
            style={[styles.floorButton, isSelected && styles.floorButtonSelected]}
            onPress={() => goToFloor(activeBuilding.id, floor.id)}>
            <Text style={styles.floorText}>{floor.label || floor.id}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const FloorSelectorPanel = ({ sheet }: PanelProps) => {
  const { venueLayout, goToFloor, goToBuilding } = useFloorSelectorBridge();
  return (
    <BottomSheet {...sheet}>
      <FloorList venueLayout={venueLayout} goToFloor={goToFloor} goToBuilding={goToBuilding} />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 8,
  },
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
  buildingRow: {
    flexGrow: 0,
    marginBottom: 4,
  },
  buildingChip: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  buildingChipActive: {
    backgroundColor: '#057DBC',
  },
  buildingChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  floorButton: {
    backgroundColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  floorButtonSelected: {
    backgroundColor: '#057DBC',
  },
  floorText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default FloorSelectorPanel;
