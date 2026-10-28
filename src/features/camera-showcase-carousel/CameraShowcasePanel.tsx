import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useMapBridge } from '../../bridge/MapBridge';
import BottomSheet from '../../components/BottomSheet';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { CameraCarouselStatus, useCameraCarouselBridge } from './bridge';

interface Props {
  // Reported by the page on every state change, including the ones this panel
  // didn't trigger (a touch on the map pauses, the idle timer resumes).
  status: CameraCarouselStatus;
  ready: boolean;
  onStart: () => void;
  onStop: () => void;
}

// Display + Start/Stop only: the tour loop itself lives in the page, so it
// keeps running while this panel (a Modal whose content unmounts on close) is closed,
// and reopening the panel shows the current state.
const CameraShowcaseControls = ({ status, ready, onStart, onStop }: Props) => {
  const { t } = useLocale();
  const isStopped = status.state === 'stopped';

  let statusText: string;
  if (status.state === 'running' && status.stopIndex >= 0) {
    statusText = t('cameraShowcase.statusRunning')
      .replace('{index}', String(status.stopIndex + 1))
      .replace('{count}', String(status.stopCount))
      .replace('{poi}', status.poiId ?? '');
  } else if (status.state === 'paused') {
    statusText = t('cameraShowcase.statusPaused').replace(
      '{seconds}',
      String(Math.round(status.resumeAfterMs / 1000)),
    );
  } else {
    statusText = t('cameraShowcase.statusStopped');
  }

  return (
    <View style={styles.column}>
      <TouchableOpacity
        testID="camera-showcase-toggle"
        disabled={!ready}
        style={[styles.button, isStopped ? styles.start : styles.stop, !ready && styles.disabled]}
        onPress={isStopped ? onStart : onStop}>
        <Text style={styles.buttonText}>
          {isStopped ? t('cameraShowcase.start') : t('cameraShowcase.stop')}
        </Text>
      </TouchableOpacity>
      <Text testID="camera-showcase-status" style={styles.status}>
        {statusText}
      </Text>
      <Text style={styles.hint}>{t('cameraShowcase.hint')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  start: {
    backgroundColor: '#057DBC',
  },
  stop: {
    backgroundColor: '#C0392B',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  status: {
    color: '#fff',
    fontSize: 14,
  },
  hint: {
    color: '#aaa',
    fontSize: 12,
  },
});

const CameraShowcasePanel = ({ sheet }: PanelProps) => {
  const { status: mapStatus } = useMapBridge();
  const { status, startCameraCarousel, stopCameraCarousel } = useCameraCarouselBridge();
  return (
    <BottomSheet {...sheet}>
      <CameraShowcaseControls
        status={status}
        ready={mapStatus === 'ready'}
        onStart={startCameraCarousel}
        onStop={stopCameraCarousel}
      />
    </BottomSheet>
  );
};

export default CameraShowcasePanel;
