import * as React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { findFeature } from '../features/registry';
import { RootStackParamList } from '../navigation/RootNavigator';
import FeatureMap from './FeatureMap';

type Props = NativeStackScreenProps<RootStackParamList, 'Feature'>;

// One screen for every feature, driven by its entry in the feature table
// (features/registry.ts): either the shared map + FAB + the feature's panel, or the
// feature's own screen when it needs state above the map.
const FeatureScreen = ({ route }: Props) => {
  const feature = findFeature(route.params.slug);
  if (feature?.Screen) {
    return <feature.Screen />;
  }
  const Panel = feature?.Panel;
  if (!Panel) {
    return null;
  }
  return (
    <FeatureMap {...feature.map}>
      {(sheet, openSheet) => <Panel sheet={sheet} openSheet={openSheet} />}
    </FeatureMap>
  );
};

export default FeatureScreen;
