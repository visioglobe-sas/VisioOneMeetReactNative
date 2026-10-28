import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { DEMO_MAP_HASH } from '../demoMap';
import { useLocale } from '../i18n/useLocale';
import { visioOneHtml } from '../webview/visioOneHtml';
import { CommandError, MapBridge, MapBridgeContext, MapStatus } from './MapBridge';

// The SDK's own default LoadOptions.baseURL, mirrored here so the custom-base-url
// feature can pre-fill its field with the real value instead of a placeholder -- see
// docs/features/custom-base-url.md.
export const DEFAULT_BASE_URL = 'https://mapserver.visioglobe.com/';

// The loadVenue / createView options sent to the page with 'setup'. Every one is
// optional: an unset option keeps the SDK's own default.
export interface MapOptions {
  // Overrides the shared DEMO_MAP_HASH for this screen only -- e.g. the custom-data
  // feature points at a dedicated, already-published map that actually carries
  // CustomData. See docs/features/custom-data.md.
  mapHash?: string;
  // custom-base-url feature: LoadOptions.baseURL. Since it's a loadVenue option (not a
  // live property), changing it requires a full venue reload: the feature changes
  // VisioMapView's `key`, which remounts this component and its WebView. See
  // docs/features/custom-base-url.md.
  baseURL?: string;
  // custom-theme feature: createView's enableShadows option -- view.setTheme() only
  // changes the scene lights, which aren't rendered without it. See
  // docs/features/custom-theme.md.
  enableShadows?: boolean;
  // camera-projection-toggle feature: createView's cameraProjection option.
  // Creation-time only (view.cameraProjection is read-only), so the feature switches it
  // by changing VisioMapView's `key`, same as custom-base-url. See
  // docs/features/camera-projection-toggle.md.
  cameraProjection?: 'perspective' | 'orthographic';
  // auth-token feature: LoadOptions.authorizationToken, for a map hosted on the
  // protected map server (pass that server as baseURL and its protected hash as
  // mapHash). See docs/features/auth-token.md.
  authorizationToken?: string;
}

interface VisioMapViewProps extends MapOptions {
  // auth-token feature: fired when loadVenue rejects with the SDK's UnauthorizedError
  // (token invalid, expired or missing), distinct from any other load error -- e.g. to
  // fetch a fresh token from your backend and remount the map.
  onUnauthorized?: (message: string) => void;
  // Rendered over the map, inside the bridge context: useMapBridge / useMapEvent work
  // there.
  children?: React.ReactNode;
}

// The WebView hosting the page (src/webview), the map status, and the bridge: it sends
// 'setup' once the page listens, handles the page's lifecycle messages ('ready',
// 'error', 'unauthorized', 'command_error') and dispatches every other message to the
// features subscribed to it.
const VisioMapView = ({
  mapHash,
  baseURL,
  enableShadows,
  cameraProjection,
  authorizationToken,
  onUnauthorized,
  children,
}: VisioMapViewProps) => {
  const { t } = useLocale();
  const webRef = React.useRef<WebView>(null);
  const [status, setStatus] = React.useState<MapStatus>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [commandError, setCommandError] = React.useState<CommandError | null>(null);
  const subscribers = React.useRef(new Map<string, Set<(data: any) => void>>());

  const send = React.useCallback((type: string, data?: object) => {
    webRef.current?.postMessage(JSON.stringify(data === undefined ? { type } : { type, data }));
  }, []);

  const subscribe = React.useCallback((type: string, handler: (data: any) => void) => {
    const handlers = subscribers.current.get(type) ?? new Set();
    handlers.add(handler);
    subscribers.current.set(type, handlers);
    return () => {
      handlers.delete(handler);
    };
  }, []);

  const bridge = React.useMemo<MapBridge>(
    () => ({ send, status, commandError, subscribe }),
    [send, status, commandError, subscribe],
  );

  const handleWebMessage = (event: WebViewMessageEvent) => {
    const raw = event.nativeEvent.data;
    const evt = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (evt.type === 'page_ready') {
      // Handshake: the page's message listener is registered, the setup can be sent.
      send('setup', {
        hash: mapHash ?? DEMO_MAP_HASH,
        baseURL,
        enableShadows,
        cameraProjection,
        authorizationToken,
      });
    } else if (evt.type === 'ready') {
      setStatus('ready');
      setErrorMessage(null);
    } else if (evt.type === 'error') {
      setStatus('error');
      setErrorMessage(String(evt.data));
    } else if (evt.type === 'unauthorized') {
      setStatus('error');
      setErrorMessage(t('map.unauthorized', { message: String(evt.data) }));
      onUnauthorized?.(String(evt.data));
    } else if (evt.type === 'command_error') {
      setCommandError({
        command: String(evt.data?.command ?? ''),
        message: String(evt.data?.message ?? ''),
        at: Date.now(),
      });
    }
    // 'ready' included: features read their initial state from its data.
    subscribers.current.get(evt.type)?.forEach((handler) => handler(evt.data));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={['*']}
        // Loaded inline with an explicit baseUrl rather than via require('./x.html') —
        // see docs/SDK_NOTES.md for why this matters in Debug builds connected to Metro.
        source={{ html: visioOneHtml, baseUrl: 'https://cdn.visioglobe.com/' }}
        onMessage={handleWebMessage}
        allowUniversalAccessFromFileURLs
        mixedContentMode="compatibility"
        javaScriptEnabled
        domStorageEnabled
      />

      <View style={styles.statusBadge}>
        <Text style={styles.status}>
          {status === 'loading' && t('map.loading')}
          {status === 'ready' && t('map.ready')}
          {status === 'error' && t('map.error', { message: errorMessage ?? '' })}
        </Text>
      </View>

      <MapBridgeContext.Provider value={bridge}>{children}</MapBridgeContext.Provider>
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
