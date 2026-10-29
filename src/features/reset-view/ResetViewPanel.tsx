import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { useResetViewBridge } from './bridge';

const ResetViewPanel = ({ sheet }: PanelProps) => {
  const { t } = useLocale();
  const { resetMap } = useResetViewBridge();
  return (
    <BottomSheet {...sheet}>
      <TouchableOpacity style={styles.buttonSecondary} onPress={resetMap}>
        <Text style={styles.buttonText}>{t('resetView.title')}</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  buttonSecondary: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ResetViewPanel;
