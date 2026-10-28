import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { CUSTOM_DATA_KNOWN_POI_IDS, CUSTOM_DATA_POI_ID } from '../../demoMap';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { useCustomDataBridge } from './bridge';

// This screen loads a dedicated map (CUSTOM_DATA_MAP_HASH in demoMap.ts) confirmed to
// carry real, published CustomData on the CUSTOM_DATA_KNOWN_POI_IDS POIs -- unlike the
// app's shared demo map, which has none. Quick-select chips below let a lookup be
// triggered with a single tap instead of typing an id by hand. See
// docs/features/custom-data.md.

const CustomDataPanel = ({ sheet }: PanelProps) => {
  const { t } = useLocale();
  const { refreshCustomData, getPoiCustomData, refresh, lookup } = useCustomDataBridge();
  const [placeId, setPlaceId] = React.useState(CUSTOM_DATA_POI_ID);
  // True from the moment a button is pressed until the matching WebView response
  // ('custom_data_refreshed'/'custom_data_refresh_error' or 'poi_custom_data_result')
  // comes back.
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
  // result is one tap away -- see CUSTOM_DATA_KNOWN_POI_IDS in demoMap.ts.
  const handleQuickSelect = (id: string) => {
    setPlaceId(id);
    handleLookup(id);
  };

  const entries = lookup ? Object.entries(lookup.customData) : [];

  return (
    <BottomSheet {...sheet}>
      <View style={styles.chipsRow}>
        {CUSTOM_DATA_KNOWN_POI_IDS.map((id) => (
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
          placeholder={t('common.placeId')}
          placeholderTextColor="#666"
          value={placeId}
          onChangeText={setPlaceId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.buttonSecondary} onPress={handleRefresh}>
          <Text style={styles.buttonText}>
            {awaitingRefresh ? t('customData.refreshing') : t('customData.refresh')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          disabled={!placeId.trim()}
          onPress={() => handleLookup()}>
          <Text style={styles.buttonText}>
            {awaitingLookup ? t('customData.lookingUp') : t('customData.lookup')}
          </Text>
        </TouchableOpacity>
      </View>

      {refresh && !refresh.ok ? (
        <Text style={styles.error}>{t('customData.refreshFailed', { error: refresh.error ?? '' })}</Text>
      ) : null}
      {refresh?.ok ? <Text style={styles.hint}>{t('customData.refreshed')}</Text> : null}

      {lookup ? (
        <View style={styles.result}>
          {!lookup.found ? (
            <Text style={styles.meta}>{t('customData.notFound', { id: lookup.placeId })}</Text>
          ) : entries.length === 0 ? (
            <Text style={styles.meta}>{t('customData.empty')}</Text>
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
        <Text style={styles.hint}>{t('customData.hint')}</Text>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
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

export default CustomDataPanel;
