import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import ItineraryForm, { useItineraryFields } from '../components/ItineraryForm';
import { ACCESSIBLE_FROM, ACCESSIBLE_TO } from '../demoMap';
import { useLocale } from '../i18n/useLocale';
import { FeatureProps } from './types';

const AccessibleModeFeature = ({ ctx, sheet }: FeatureProps) => {
  const { t } = useLocale();
  const fields = useItineraryFields(ACCESSIBLE_FROM, ACCESSIBLE_TO);
  // Read only when Itinerary is pressed -- toggling it alone doesn't recompute
  // whatever route is already on screen.
  const [accessibleRoute, setAccessibleRoute] = React.useState(false);

  const handleCompute = () => {
    fields.markSubmitted();
    ctx.bridge.startItinerary(fields.origin.trim(), fields.destination.trim(), accessibleRoute);
  };

  return (
    <BottomSheet {...sheet}>
      <ItineraryForm
        origin={fields.origin}
        destination={fields.destination}
        onChangeOrigin={fields.setOrigin}
        onChangeDestination={fields.setDestination}
        onSubmit={handleCompute}
        commandError={ctx.commandError}
        submittedAt={fields.submittedAt}
      />
      <View style={styles.toggleRow}>
        <Text style={styles.label}>{t('accessibleMode.title')}</Text>
        <Switch value={accessibleRoute} onValueChange={setAccessibleRoute} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
});

export default AccessibleModeFeature;
