import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { visioOneHtml } from '../assets/visioOneHtml';
import { useVisioMap } from '../screens/useVisioMap';

// Replace with a hash of your own venue from https://my.visioglobe.com
// This one points at a Visioglobe demo venue.
const DEMO_MAP_HASH = 'kbae8e6c066cca4b02c2afac2bc963a643d87437a';

type Status = 'loading' | 'ready' | 'error';

export type VisioMapBridge = ReturnType<typeof useVisioMap>;

interface VisioMapViewProps {
  renderOverlay?: (bridge: VisioMapBridge, status: Status) => React.ReactNode;
}

const VisioMapView = ({ renderOverlay }: VisioMapViewProps) => {
  const [status, setStatus] = React.useState<Status>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const bridge = useVisioMap(DEMO_MAP_HASH);
  const { webRef, sendSetup } = bridge;

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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

      <View style={styles.statusBadge}>
        <Text style={styles.status}>
          {status === 'loading' && 'Loading venue…'}
          {status === 'ready' && 'Venue ready'}
          {status === 'error' && `Error: ${errorMessage}`}
        </Text>
      </View>

      {renderOverlay?.(bridge, status)}
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  status: {
    color: '#fff',
    fontSize: 13,
  },
});

export default VisioMapView;
