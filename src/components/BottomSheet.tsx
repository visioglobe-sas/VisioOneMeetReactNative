import * as React from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
}

interface BottomSheetProps extends SheetProps {
  children?: React.ReactNode;
}

// A downward drag longer than this (or a fast downward fling) closes the sheet.
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.8;

// Modal panel sliding up from the bottom over a scrim. Closed by tapping the scrim,
// by the system back action, or by swiping it down (from the grab handle, or from
// anywhere on the panel while its content is scrolled to the top).
//
// Its content unmounts when it closes (a React Native Modal): feature state therefore
// lives in the feature component that renders this sheet, never in the content.
const BottomSheet = ({ visible, onClose, children }: BottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const dragY = React.useRef(new Animated.Value(0)).current;
  const scrollTop = React.useRef(true);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      scrollTop.current = true;
    }
  }, [visible, dragY]);

  const panResponder = React.useMemo(() => {
    const isDownSwipe = (dx: number, dy: number) => dy > 8 && dy > Math.abs(dx) * 1.5;
    const springBack = () => Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => scrollTop.current && isDownSwipe(g.dx, g.dy),
      onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          onCloseRef.current();
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: springBack,
    });
  }, [dragY]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose} />
        <Animated.View
          testID="bottom-sheet"
          style={[
            styles.panel,
            { maxHeight: height * 0.75, paddingBottom: 16 + insets.bottom },
            { transform: [{ translateY: dragY }] },
          ]}
          {...panResponder.panHandlers}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onScroll={(event) => {
              scrollTop.current = event.nativeEvent.contentOffset.y <= 0;
            }}
            contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    // Opaque on purpose: the panel must stay readable over the map.
    backgroundColor: '#111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#555',
  },
  content: {
    gap: 8,
  },
});

export default BottomSheet;
