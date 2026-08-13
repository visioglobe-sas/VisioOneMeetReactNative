// react-native-localize relies on a native module that isn't available under Jest.
// Re-export the library's own official mock (see react-native-localize/mock).
export * from 'react-native-localize/mock';
