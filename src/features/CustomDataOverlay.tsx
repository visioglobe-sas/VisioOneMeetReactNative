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

// This screen loads a dedicated map (see FeatureScreen.tsx's CUSTOM_DATA_MAP_HASH)
// confirmed to carry real, published CustomData on these 3 POIs -- unlike the app's
// shared demo map, which has none. Quick-select chips below let a lookup be
// triggered with a single tap instead of typing an id by hand. See
// docs/features/custom-data.md.
const KNOWN_POI_IDS = ['B1', 'B3-UL00-ID0065', 'B3-UL00-ID0064'];

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

  const handleLookup = (id?: string) => {
    const trimmed = (id ?? placeId).trim();
    if (!trimmed) {
      return;
    }
    setAwaitingLookup(true);
    getPoiCustomData(trimmed);
  };

  // Fills the field and immediately triggers the lookup, so a real, non-empty
  // result is one tap away -- see KNOWN_POI_IDS above.
  const handleQuickSelect = (id: string) => {
    setPlaceId(id);
    handleLookup(id);
  };

  const entries = lookup ? Object.entries(lookup.customData) : [];

  return (
    <View style={styles.column}>
      <View style={styles.chipsRow}>
        {KNOWN_POI_IDS.map((id) => (
          <TouchableOpacity
            key={id}
            style={[styles.chip, placeId === id ? styles.chipSelected : null]}
            onPress={() => handleQuickSelect(id)}>
            <Text style={styles.chipText}>{id}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
          onPress={() => handleLookup()}>
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
          Tap one of the place IDs above for a real, published example, or type any
          other place ID and hit Look up.
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#444',
  },
  chipSelected: {
    backgroundColor: '#057DBC',
    borderColor: '#057DBC',
  },
  chipText: {
    color: '#fff',
    fontSize: 13,
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
