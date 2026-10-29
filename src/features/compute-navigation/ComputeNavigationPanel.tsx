import * as React from 'react';

import BottomSheet from '../../components/BottomSheet';
import ItineraryForm, { useItineraryFields } from '../../components/ItineraryForm';
import { ITINERARY_FROM, ITINERARY_TO } from '../../demoMap';
import { PanelProps } from '../types';
import { useItineraryBridge } from './bridge';

const ComputeNavigationPanel = ({ sheet }: PanelProps) => {
  const { startItinerary } = useItineraryBridge();
  const fields = useItineraryFields(ITINERARY_FROM, ITINERARY_TO);

  const handleCompute = () => {
    fields.markSubmitted();
    startItinerary(fields.origin.trim(), fields.destination.trim(), false);
  };

  return (
    <BottomSheet {...sheet}>
      <ItineraryForm
        origin={fields.origin}
        destination={fields.destination}
        onChangeOrigin={fields.setOrigin}
        onChangeDestination={fields.setDestination}
        onSubmit={handleCompute}
        submittedAt={fields.submittedAt}
      />
    </BottomSheet>
  );
};

export default ComputeNavigationPanel;
