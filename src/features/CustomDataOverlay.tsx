import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  CustomDataLookupResult,
  CustomDataRefreshOutcome,
  VisioMapBridge,
} from '../components/VisioMapView';

interface Props {
  refreshCustomData: VisioMapBridge['refreshCustomData'];
  getPoiCustomData: VisioMapBridge['getPoiCustomData'];
  refresh: CustomDataRefreshOutcome | null;
  lookup: CustomDataLookupResult | null;
}

const CustomDataOverlay = ({ refreshCustomData, getPoiCustomData, refresh, lookup }: Props) => {
  const [placeId, setPlaceId] = React.useState('');
  // True from the moment a button is pressed until the matching WebView response
  // ('custom_data_refreshed'/'custom_data_refresh_error' or 'poi_custom_data_result')
  // comes back -- same idiom as SimulatedPositionOverlay's awaitingResolution.
  const [awaitingRefresh, setAwaitingRefresh] = React.useState(false);
  const [awaitingLookup, setAwaitingLookup] = React.useState(false);

  React.useEffect(() => {
    if (awaitingRefresh && refresh) {
      setAwaitingRefresh(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  React.useEffect(() => {
    if (awaitingLookup && lookup) {
      setAwaitingLookup(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup]);

  const handleRefresh = () => {
    setAwaitingRefresh(true);
    refreshCustomData();
  };

  const handleLookup = () => {
    const trimmed = placeId.trim();
    if (!trimmed) {
      return;
    }
    setAwaitingLookup(true);
    getPoiCustomData(trimmed);
  };

  const entries = lookup ? Object.entries(lookup.customData) : [];

  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Place ID"
          value={placeId}
          onChangeText={setPlaceId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.buttonSecondary} onPress={handleRefresh}>
          <Text style={styles.buttonText}>{awaitingRefresh ? 'Refreshing…' : 'Refresh from server'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          disabled={!placeId.trim()}
          onPress={handleLookup}>
          <Text style={styles.buttonText}>{awaitingLookup ? 'Looking up…' : 'Look up'}</Text>
        </TouchableOpacity>
      </View>

      {refresh && !refresh.ok ? (
        <Text style={styles.error}>Refresh failed: {refresh.error}</Text>
      ) : null}
      {refresh?.ok ? <Text style={styles.hint}>Custom data refreshed from the server.</Text> : null}

      {lookup ? (
        <View style={styles.result}>
          {!lookup.found ? (
            <Text style={styles.meta}>POI not found: {lookup.placeId}</Text>
          ) : entries.length === 0 ? (
            <Text style={styles.meta}>No custom data for this POI.</Text>
          ) : (
            entries.map(([key, value]) => (
              <View key={key} style={styles.entry}>
                <Text style={styles.key}>{key}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))
          )}
        </View>
      ) : (
        <Text style={styles.hint}>
          Refresh loads the latest data from the server, then Look up reads the entered
          place's data.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
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
  buttonSecondary: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#E74C3C',
    fontSize: 13,
  },
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
  result: {
    gap: 6,
  },
  entry: {
    backgroundColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  key: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    color: '#aaa',
    fontSize: 13,
  },
  meta: {
    color: '#aaa',
    fontSize: 13,
  },
});

export default CustomDataOverlay;
