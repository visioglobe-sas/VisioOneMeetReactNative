module.exports = {
  root: true,
  extends: '@react-native',
  // The WebView page's scripts run in the browser, not in React Native, and are
  // inlined into src/webview/visioOneHtml.ts by scripts/build-webview.mjs.
  ignorePatterns: ['src/webview/*.js', 'src/features/*/webview.js'],
};
