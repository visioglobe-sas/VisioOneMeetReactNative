import * as React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const BottomSheet = ({ visible, onClose, children }: BottomSheetProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose} />
        <View style={[styles.panel, { paddingBottom: 16 + insets.bottom }]}>{children}</View>
      </View>
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
    backgroundColor: '#111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
});

export default BottomSheet;
