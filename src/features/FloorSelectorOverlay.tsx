import * as React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge, VenueLayoutInfo } from '../components/VisioMapView';

interface Props {
  venueLayout: VenueLayoutInfo;
  goToFloor: VisioMapBridge['goToFloor'];
  goToBuilding: VisioMapBridge['goToBuilding'];
}

const FloorSelectorOverlay = ({ venueLayout, goToFloor, goToBuilding }: Props) => {
  const { buildings, currentBuildingId, currentFloorId } = venueLayout;

  // Nothing selected yet (e.g. the map isn't 'ready' or the 'ready' message hasn't
  // carried any data): fall back to the venue's first building, per the task's brief.
  const activeBuilding = buildings.find((building) => building.id === currentBuildingId) || buildings[0];

  if (!activeBuilding) {
    return (
      <View style={styles.column}>
        <Text style={styles.hint}>No building found in this venue yet.</Text>
      </View>
    );
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
            <Text style={[styles.floorText, isSelected && styles.floorTextSelected]}>
              {floor.label || floor.id}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
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
  floorTextSelected: {
    color: '#fff',
  },
});

export default FloorSelectorOverlay;
