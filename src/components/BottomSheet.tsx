import * as React from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLLAPSED_HEIGHT = 44;
const EXPANDED_HEIGHT = 200;
const DRAG_ACTIVATION_THRESHOLD = 4;

interface BottomSheetProps {
  children?: React.ReactNode;
}

const BottomSheet = ({ children }: BottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const collapsedHeight = COLLAPSED_HEIGHT + insets.bottom;
  const expandedHeight = EXPANDED_HEIGHT + insets.bottom;

  const expandedRef = React.useRef(false);
  const height = React.useRef(new Animated.Value(collapsedHeight)).current;

  const snapTo = (expand: boolean) => {
    expandedRef.current = expand;
    Animated.spring(height, {
      toValue: expand ? expandedHeight : collapsedHeight,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dy) > DRAG_ACTIVATION_THRESHOLD,
      onPanResponderMove: (_event, gesture) => {
        const base = expandedRef.current ? expandedHeight : collapsedHeight;
        const next = Math.min(expandedHeight, Math.max(collapsedHeight, base - gesture.dy));
        height.setValue(next);
      },
      onPanResponderRelease: (_event, gesture) => {
        const base = expandedRef.current ? expandedHeight : collapsedHeight;
        const released = base - gesture.dy;
        snapTo(released > (collapsedHeight + expandedHeight) / 2);
      },
    }),
  ).current;

  return (
    <Animated.View style={[styles.container, { height }]}>
      <View {...panResponder.panHandlers} style={styles.handleArea}>
        <View style={styles.handle} />
      </View>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  handleArea: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#555',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
});

export default BottomSheet;
