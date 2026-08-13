import * as React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import VisioMapView from '../components/VisioMapView';
import { featureRegistry } from '../features/registry';
import OccupancySimulatedOverlay from '../features/OccupancySimulatedOverlay';
import ResetViewOverlay from '../features/ResetViewOverlay';
import { useLocale } from '../i18n/useLocale';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Feature'>;

const FeatureScreen = ({ route, navigation }: Props) => {
  const { slug } = route.params;
  const { t } = useLocale();
  const feature = featureRegistry.find((item) => item.slug === slug);

  React.useEffect(() => {
    if (feature) {
      navigation.setOptions({ title: t(feature.titleKey) });
    }
  }, [feature, navigation, t]);

  return (
    <VisioMapView
      renderOverlay={(bridge) => {
        switch (slug) {
          case 'reset-view':
            return <ResetViewOverlay resetMap={bridge.resetMap} />;
          case 'occupancy-simulated':
            return <OccupancySimulatedOverlay updateOccupancy={bridge.updateOccupancy} />;
          default:
            return null;
        }
      }}
    />
  );
};

export default FeatureScreen;
