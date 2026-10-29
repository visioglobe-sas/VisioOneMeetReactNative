import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useCommandError } from '../bridge/MapBridge';
import { useLocale } from '../i18n/useLocale';

interface Props {
  origin: string;
  destination: string;
  onChangeOrigin: (value: string) => void;
  onChangeDestination: (value: string) => void;
  onSubmit: () => void;
  // Date.now() of the last submit: the page's error for the 'start_itinerary' sent
  // then (e.g. an unknown place ID) is shown under the fields.
  submittedAt: number;
}

// The From / To / Itinerary form shared by every itinerary screen.
const ItineraryForm = ({
  origin,
  destination,
  onChangeOrigin,
  onChangeDestination,
  onSubmit,
  submittedAt,
}: Props) => {
  const { t } = useLocale();
  const error = useCommandError('start_itinerary', submittedAt);

  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder={t('common.from')}
          placeholderTextColor="#666"
          value={origin}
          onChangeText={onChangeOrigin}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder={t('common.to')}
          placeholderTextColor="#666"
          value={destination}
          onChangeText={onChangeDestination}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.button, (!origin.trim() || !destination.trim()) && styles.disabled]}
          disabled={!origin.trim() || !destination.trim()}
          onPress={onSubmit}>
          <Text style={styles.buttonText}>{t('common.itinerary')}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{t('common.commandError', { message: error })}</Text> : null}
    </View>
  );
};

// State of an itinerary form, owned by the feature component (outside the sheet).
export const useItineraryFields = (initialOrigin: string, initialDestination: string) => {
  const [origin, setOrigin] = React.useState(initialOrigin);
  const [destination, setDestination] = React.useState(initialDestination);
  // Time of the last submit: an error older than this belongs to a previous request.
  const [submittedAt, setSubmittedAt] = React.useState(0);
  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    submittedAt,
    markSubmitted: () => setSubmittedAt(Date.now()),
  };
};

const styles = StyleSheet.create({
  column: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#E74C3C',
    fontSize: 13,
  },
});

export default ItineraryForm;
