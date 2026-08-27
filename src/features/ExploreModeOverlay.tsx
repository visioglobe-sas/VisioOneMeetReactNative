import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';
import { ExploreMode } from '../screens/useVisioMap';
import { StringKey } from '../i18n/strings';
import { useLocale } from '../i18n/useLocale';

interface Props {
  exploreMode: ExploreMode;
  setExploreMode: VisioMapBridge['setExploreMode'];
}

// Order mirrors the SDK's own ExploreMode union (ExploreMode.ts in visioone) exactly --
// 'global' (outside), 'building' (exploded/"carousel" view), 'floor' (single floor).
const EXPLORE_MODES: { mode: ExploreMode; labelKey: StringKey; hintKey: StringKey }[] = [
  { mode: 'global', labelKey: 'exploreMode.global', hintKey: 'exploreMode.globalHint' },
  { mode: 'building', labelKey: 'exploreMode.building', hintKey: 'exploreMode.buildingHint' },
  { mode: 'floor', labelKey: 'exploreMode.floor', hintKey: 'exploreMode.floorHint' },
];

// Segmented control, not independent toggles -- the SDK only ever has one active
// ExploreMode at a time. `exploreMode` comes down from VisioMapView's 'ready'/
// 'exploremodechanged'-driven state, so the highlighted option stays correct even when
// the mode changes from map interaction rather than a tap here (e.g. clicking while in
// 'building' mode auto-switches to 'floor') -- same idiom as FloorSelectorOverlay's
// currentFloorId highlight.
const ExploreModeOverlay = ({ exploreMode, setExploreMode }: Props) => {
  const { t } = useLocale();
  const active = EXPLORE_MODES.find((entry) => entry.mode === exploreMode) ?? EXPLORE_MODES[0];

  return (
    <View style={styles.column}>
      <View style={styles.segmented}>
        {EXPLORE_MODES.map(({ mode, labelKey }) => {
          const isActive = mode === exploreMode;
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => setExploreMode(mode)}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>{t(active.hintKey)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
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
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#057DBC',
  },
  segmentText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#fff',
  },
  hint: {
    color: '#aaa',
    fontSize: 12,
  },
});

export default ExploreModeOverlay;
