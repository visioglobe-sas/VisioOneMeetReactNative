import * as React from 'react';
import { View } from 'react-native';

// react-native-webview relies on a native module that isn't available under Jest.
// Stand in with a plain View so components that render a WebView are still testable.
export const WebView = React.forwardRef((props: object, ref: React.Ref<View>) => (
  <View ref={ref} {...props} />
));

export default WebView;
