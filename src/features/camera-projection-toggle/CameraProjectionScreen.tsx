import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useMapBridge } from '../../bridge/MapBridge';
import BottomSheet, { SheetProps } from '../../components/BottomSheet';
import { StringKey } from '../../i18n/strings';
import { useLocale } from '../../i18n/useLocale';
import FeatureMap from '../../shell/FeatureMap';
import { CameraProjection, useReportedCameraProjection } from './bridge';

interface Props {
  // view.cameraProjection as reported by the page once the view is ready, or null
  // while the map is (re)loading.
  reportedProjection: CameraProjection | null;
  // The projection the current map is being created with -- shown while reloading.
  requestedProjection: CameraProjection;
  loading: boolean;
  onSelect: (projection: CameraProjection) => void;
}

const PROJECTIONS: { projection: CameraProjection; labelKey: StringKey }[] = [
  { projection: 'perspective', labelKey: 'cameraProjection.perspective' },
  { projection: 'orthographic', labelKey: 'cameraProjection.orthographic' },
];

// Segmented control: the view only ever has one projection. The highlight follows the
// SDK's own view.cameraProjection once the view is ready, and the control is disabled
// while the map reloads (switching recreates the whole map, see
// CameraProjectionScreen below).
const CameraProjectionControls = ({
  reportedProjection,
  requestedProjection,
  loading,
  onSelect,
}: Props) => {
  const { t } = useLocale();
  const current = loading ? requestedProjection : reportedProjection ?? requestedProjection;

  return (
    <View style={styles.column}>
      <View style={[styles.segmented, loading && styles.disabled]}>
        {PROJECTIONS.map(({ projection, labelKey }) => {
          const isActive = projection === current;
          return (
            <TouchableOpacity
              key={projection}
              testID={`camera-projection-${projection}`}
              disabled={loading || isActive}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => onSelect(projection)}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>{t('cameraProjection.hint')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  segment: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#057DBC',
  },
  segmentText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#fff',
  },
  hint: {
    color: '#aaa',
    fontSize: 12,
  },
});

interface PanelProps {
  sheet: SheetProps;
  requestedProjection: CameraProjection;
  onSelect: (projection: CameraProjection) => void;
}

const CameraProjectionPanel = ({ sheet, requestedProjection, onSelect }: PanelProps) => {
  const { status } = useMapBridge();
  const reportedProjection = useReportedCameraProjection();
  return (
    <BottomSheet {...sheet}>
      <CameraProjectionControls
        reportedProjection={reportedProjection}
        requestedProjection={requestedProjection}
        loading={status === 'loading'}
        onSelect={onSelect}
      />
    </BottomSheet>
  );
};

// cameraProjection is a createView option only (view.cameraProjection is read-only, no
// runtime switch), so selecting the other projection changes the map's key -- a full
// WebView remount, i.e. a fresh loadVenue + createView({ cameraProjection }) -- same
// idiom as custom-base-url. The selection lives here, above the map, so it survives
// that remount. See docs/features/camera-projection-toggle.md.
const CameraProjectionScreen = () => {
  const [cameraProjection, setCameraProjection] = React.useState<CameraProjection>('perspective');
  return (
    <FeatureMap
      mapKey={`camera-projection-toggle-${cameraProjection}`}
      cameraProjection={cameraProjection}>
      {(sheet) => (
        <CameraProjectionPanel
          sheet={sheet}
          requestedProjection={cameraProjection}
          onSelect={setCameraProjection}
        />
      )}
    </FeatureMap>
  );
};

export default CameraProjectionScreen;
