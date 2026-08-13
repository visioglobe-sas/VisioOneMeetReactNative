module.exports = {
  preset: '@react-native/jest-preset',
  // react-native-webview, @react-navigation, react-native-screens and react-native-localize
  // all ship an ESM entry point; without this they aren't transformed and Jest chokes on
  // the `import`/`export` statements.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-webview|@react-navigation|react-native-screens|react-native-localize)/)',
  ],
};
