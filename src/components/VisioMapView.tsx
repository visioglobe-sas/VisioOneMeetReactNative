import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { visioOneHtml } from '../assets/visioOneHtml';
import { ClickedPoi, useVisioMap, VenueBuilding } from '../screens/useVisioMap';

// Replace with a hash of your own venue from https://my.visioglobe.com
// This one points at a Visioglobe demo venue.
const DEMO_MAP_HASH = 'kbae8e6c066cca4b02c2afac2bc963a643d87437a';

type Status = 'loading' | 'ready' | 'error';

export type VisioMapBridge = ReturnType<typeof useVisioMap>;

// Forwarded from the WebView's 'ready'/'floor_changed' messages -- see the buildings
// mapping and the 'currentfloorchanged' listener in visioOneHtml.ts/visioOne.html.
export interface VenueLayoutInfo {
  buildings: VenueBuilding[];
  currentBuildingId?: string;
  currentFloorId?: string;
}

interface VisioMapViewProps {
  renderOverlay?: (
    bridge: VisioMapBridge,
    status: Status,
    clickedPois: ClickedPoi[],
    venueLayout: VenueLayoutInfo,
  ) => React.ReactNode;
  // Fired from the WebView's onMessage handler (an event, not during render) so the
  // parent can safely react -- e.g. open its own controls -- without the "setState
  // during a different component's render" pitfall a render-phase call would hit.
  onPoiClick?: (pois: ClickedPoi[]) => void;
}

const VisioMapView = ({ renderOverlay, onPoiClick }: VisioMapViewProps) => {
  const [status, setStatus] = React.useState<Status>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [clickedPois, setClickedPois] = React.useState<ClickedPoi[]>([]);
  const [venueLayout, setVenueLayout] = React.useState<VenueLayoutInfo>({ buildings: [] });

  const bridge = useVisioMap(DEMO_MAP_HASH);
  const { webRef, sendSetup } = bridge;

  const handleWebMessage = (event: WebViewMessageEvent) => {
    const raw = event.nativeEvent.data;
    const evt = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (evt.type === 'ready') {
      setStatus('ready');
      setErrorMessage(null);
      setVenueLayout({
        buildings: evt.data?.buildings ?? [],
        currentBuildingId: evt.data?.currentBuildingId,
        currentFloorId: evt.data?.currentFloorId,
      });
    } else if (evt.type === 'error') {
      setStatus('error');
      setErrorMessage(String(evt.data));
    } else if (evt.type === 'poi_click') {
      setClickedPois(evt.data.pois);
      onPoiClick?.(evt.data.pois);
    } else if (evt.type === 'floor_changed') {
      // Also fires when the SDK's own default floor-selector widget (not this app's UI)
      // is the one driving the change -- see the 'currentfloorchanged' listener in
      // visioOneHtml.ts/visioOne.html. Keeps the app's own selector highlight in sync either way.
      setVenueLayout((prev) => ({
        ...prev,
        currentBuildingId: evt.data.buildingId,
        currentFloorId: evt.data.floorId,
      }));
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

      {renderOverlay?.(bridge, status, clickedPois, venueLayout)}
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
