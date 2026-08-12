import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { visioOneHtml } from '../assets/visioOneHtml';
import { useVisioMap } from './useVisioMap';

// Replace with a hash of your own venue from https://my.visioglobe.com
// This one points at a Visioglobe demo venue.
const DEMO_MAP_HASH = 'kbae8e6c066cca4b02c2afac2bc963a643d87437a';

// Stand-in for a real occupancy sensor feed: cycles a POI's surface through these
// colors on a timer. See docs/features/occupancy-simulated.md.
const OCCUPANCY_COLORS = ['#2ECC71', '#F1C40F', '#E74C3C']; // free, about to be occupied, occupied
const OCCUPANCY_INTERVAL_MS = 2500;

type Status = 'loading' | 'ready' | 'error';

const MapScreen = () => {
  const [status, setStatus] = React.useState<Status>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [placeId, setPlaceId] = React.useState('');
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [simulateOccupancy, setSimulateOccupancy] = React.useState(false);

  const { webRef, sendSetup, goToPlace, clearPlace, resetMap, startItinerary, updateOccupancy } =
    useVisioMap(DEMO_MAP_HASH);

  React.useEffect(() => {
    const targetPlaceId = placeId.trim();
    if (!simulateOccupancy || !targetPlaceId) {
      return;
    }

    let colorIndex = 0;
    updateOccupancy([{ planId: targetPlaceId, color: OCCUPANCY_COLORS[colorIndex] }]);
    const timer = setInterval(() => {
      colorIndex = (colorIndex + 1) % OCCUPANCY_COLORS.length;
      updateOccupancy([{ planId: targetPlaceId, color: OCCUPANCY_COLORS[colorIndex] }]);
    }, OCCUPANCY_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      // Reset the surface rather than leaving it stuck on the last simulated color.
      updateOccupancy([{ planId: targetPlaceId, color: undefined }]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulateOccupancy, placeId]);

  const handleWebMessage = (event: WebViewMessageEvent) => {
    const raw = event.nativeEvent.data;
    const evt = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (evt.type === 'ready') {
      setStatus('ready');
      setErrorMessage(null);
    } else if (evt.type === 'error') {
      setStatus('error');
      setErrorMessage(String(evt.data));
    } else if (evt.type === 'place') {
      console.log('[VisioMap] place selected:', evt.data);
    } else if (evt.type === 'itinerary_instructions') {
      console.log('[VisioMap] itinerary instructions:', evt.data);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={['*']}
        // Loaded inline with an explicit baseUrl rather than via require('./visioOne.html') —
        // see docs/SDK_NOTES.md for why this matters in Debug builds connected to Metro.
        source={{ html: visioOneHtml, baseUrl: 'https://cdn.visioglobe.com/' }}
        onLoadEnd={sendSetup}
        onMessage={handleWebMessage}
        allowUniversalAccessFromFileURLs
        mixedContentMode="compatibility"
        javaScriptEnabled
        domStorageEnabled
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.panel}>
        <Text style={styles.status}>
          {status === 'loading' && 'Loading venue…'}
          {status === 'ready' && 'Venue ready'}
          {status === 'error' && `Error: ${errorMessage}`}
        </Text>

        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Place ID"
            value={placeId}
            onChangeText={setPlaceId}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={() => goToPlace(placeId)}>
            <Text style={styles.buttonText}>Go</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={clearPlace}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={simulateOccupancy ? styles.button : styles.buttonSecondary}
            disabled={!simulateOccupancy && !placeId.trim()}
            onPress={() => setSimulateOccupancy((prev) => !prev)}>
            <Text style={styles.buttonText}>
              {simulateOccupancy ? 'Stop occupancy simulation' : 'Simulate occupancy on Place ID'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="From (place ID)"
            value={origin}
            onChangeText={setOrigin}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="To (place ID)"
            value={destination}
            onChangeText={setDestination}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => startItinerary(origin, destination, false)}>
            <Text style={styles.buttonText}>Itinerary</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.buttonSecondary} onPress={resetMap}>
          <Text style={styles.buttonText}>Reset view</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  panel: {
    padding: 12,
    gap: 8,
    backgroundColor: '#111',
  },
  status: {
    color: '#fff',
    fontSize: 13,
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
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default MapScreen;
