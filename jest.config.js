module.exports = {
  preset: '@react-native/jest-preset',
  // react-native-webview ships an ESM entry point; without this it isn't
  // transformed and Jest chokes on the `import` statement.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-webview)/)',
  ],
};
