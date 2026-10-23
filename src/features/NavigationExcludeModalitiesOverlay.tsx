import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import ItineraryForm, { useItineraryFields } from '../components/ItineraryForm';
import { EXCLUDE_MODALITIES_FROM, EXCLUDE_MODALITIES_TO } from '../demoMap';
import { useLocale } from '../i18n/useLocale';
import { FeatureProps } from './types';

// navigation-exclude-modalities feature: the segment-particularity attribute string
// that excludes the elevator on this demo venue. The SDK's own JSDoc comment on
// excludedAttributes suggests 'elevator', but live testing against this venue's data
// (see docs/features/navigation-exclude-modalities.md) confirms the real attribute is
// 'lift' -- the instruction attached to the elevator hop of an unrestricted route
// reads attributes: ['lift', 'B1-lift-1'].
const ELEVATOR_ATTRIBUTE = 'lift';

const NavigationExcludeModalitiesFeature = ({ ctx, sheet }: FeatureProps) => {
  const { t } = useLocale();
  const fields = useItineraryFields(EXCLUDE_MODALITIES_FROM, EXCLUDE_MODALITIES_TO);
  // Read only when Itinerary is pressed -- toggling it alone doesn't recompute
  // whatever route is already on screen.
  const [avoidElevator, setAvoidElevator] = React.useState(false);

  const handleCompute = () => {
    fields.markSubmitted();
    ctx.bridge.startItinerary(
      fields.origin.trim(),
      fields.destination.trim(),
      false,
      avoidElevator ? [ELEVATOR_ATTRIBUTE] : undefined,
    );
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
        <Text style={styles.label}>{t('navigationExcludeModalities.title')}</Text>
        <Switch value={avoidElevator} onValueChange={setAvoidElevator} />
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

export default NavigationExcludeModalitiesFeature;
