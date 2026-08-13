/**
 * Minimal React Native harness embedding the VisioOne SDK in a WebView.
 *
 * @format
 */

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { diagnosticInlineHtml } from './src/assets/diagnosticInlineHtml';
import RootNavigator from './src/navigation/RootNavigator';

// Set to true to check whether react-native-webview itself can load the VisioOne
// SDK from the CDN, bypassing the app's setup()/postMessage choreography entirely.
// Useful to isolate a WebView-layer issue from an application-layer one — see
// docs/SDK_NOTES.md.
const DIAGNOSTIC_MODE = false;

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {DIAGNOSTIC_MODE ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: diagnosticInlineHtml, baseUrl: 'https://cdn.visioglobe.com/' }}
          allowUniversalAccessFromFileURLs
          mixedContentMode="compatibility"
          javaScriptEnabled
          domStorageEnabled
          onMessage={(e) => console.log('[diag]', e.nativeEvent.data)}
        />
      ) : (
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
}

export default App;
