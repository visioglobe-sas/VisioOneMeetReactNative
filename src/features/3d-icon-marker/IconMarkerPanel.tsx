import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { ANCHOR_POI_ID } from '../../demoMap';
import { StringKey } from '../../i18n/strings';
import { Translate, useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { IconMarkerCreateResult, ImageOrientationType, useIconMarkerBridge } from './bridge';

// A 96x96 PNG (blue disc + white star), inlined as a data URL -- venue.createImage's
// url accepts data: URLs as well as regular web URLs.
const ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACBklEQVR42u3dWW4CMRBFUVbLarOn5JsIqRlsv6FuSfmE0O+IwS7bfbtR1GXdf34/+qMOhg2KcehgGIU+HsMt+DEQ7sHXQqQFXwWRHn4sQkvwkRCt4dsjtAdvDTEtfCuEqeFbIAgv/H/NQzAKfx6CYfhzEIzD70cQf+FFAGxFAEAIEBJ+J4LB7+04gKUIAAgBTEackQBfI4SG34MAgBDAaMIrHuAjBACEAGZTvhUAbyEAIAQwbHrUALyEAAAAcwGMe68V4V8iHAjJHeAI7mqAb0oNcOK1vwYgCP+di1E/334EMcDVRSmewx5gd60COPk6K94Bzy7u1OP4CAqrNQCCQdJ4gAcE0Uh1dPgrASYirB0Ri+dsRoa/A6AdYt+ckNksZn3wpwDSIc7NiprP69cFrwJwBdH3BUo6YLlN+qI2ZGZ7EgAA+AgqD99/ueKA8K0Q0veAxSMk7v+tQnABULQrvQZhQgBVv9gCQb00cXVoUQgOa0MBEALsCitvFlSEMBpAvT9gd0g5TRgATAGMe8Ru/ydul+TJULIBNiGMBlDvlFcE4rkGSISgCsICwOG0FGUIuQDCdaM121ydTs1S/wrJDP8gQN3pu44nJzo1RXLC56h6Ts4FAAROUCd8ELiLBuGDwJ2UCB8E7qhH8BMR4orgQZgdfjJEbRE8ELODd8KgBBjUQRSKuqo/fm7G7BpJ/VcAAAAASUVORK5CYII=';

// Only one icon is placed at a time in this demo, always under this id -- the live SDK
// Image object is tracked on the WebView side, keyed by it.
const IMAGE_ID = 'icon-marker';

// Size in meters, as venue.createImage expects.
const ICON_SIZE_METERS = 6;

const ORIENTATIONS: { value: ImageOrientationType; labelKey: StringKey }[] = [
  { value: 'fixed', labelKey: 'iconMarker.fixed' },
  { value: 'flat', labelKey: 'iconMarker.flat' },
  { value: 'facing', labelKey: 'iconMarker.facing' },
];

const reasonMessage = (result: IconMarkerCreateResult, t: Translate): string => {
  switch (result.reason) {
    case 'anchor_not_found':
      return t('common.poiNotFound');
    case 'no_position':
      return t('common.noPosition');
    default:
      return t('iconMarker.failed', { details: result.message ? ` (${result.message})` : '' });
  }
};

// The anchor field, the orientation and what is placed live here (mounted for the
// whole screen), so the panel reflects the map when reopened. Create results are only
// applied while a Place is awaiting its answer.
const IconMarkerPanel = ({ sheet }: PanelProps) => {
  const { t } = useLocale();
  const { createIconMarker, updateIconMarkerOrientation, removeIconMarker, createResult } =
    useIconMarkerBridge();
  const [anchorId, setAnchorId] = React.useState(ANCHOR_POI_ID);
  const [orientation, setOrientation] = React.useState<ImageOrientationType>('facing');
  // Anchor POI id the icon is currently placed on, null when nothing is placed.
  const [placedOn, setPlacedOn] = React.useState<string | null>(null);
  const [awaitingCreate, setAwaitingCreate] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!awaitingCreate || !createResult) {
      return;
    }
    setAwaitingCreate(false);
    if (createResult.ok) {
      setError(null);
      setPlacedOn(createResult.anchorId);
    } else {
      setError(reasonMessage(createResult, t));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createResult]);

  const handlePlace = () => {
    const anchor = anchorId.trim();
    if (!anchor) {
      return;
    }
    // Only one icon at a time: remove the current one before placing a new one.
    if (placedOn) {
      removeIconMarker(IMAGE_ID);
      setPlacedOn(null);
    }
    setError(null);
    setAwaitingCreate(true);
    createIconMarker(IMAGE_ID, anchor, {
      width: ICON_SIZE_METERS,
      height: ICON_SIZE_METERS,
      url: ICON_DATA_URL,
      orientationType: orientation,
    });
  };

  const handleRemove = () => {
    if (!placedOn) {
      return;
    }
    removeIconMarker(IMAGE_ID);
    setPlacedOn(null);
    setError(null);
  };

  const handleOrientation = (value: ImageOrientationType) => {
    setOrientation(value);
    if (placedOn) {
      updateIconMarkerOrientation(IMAGE_ID, value);
    }
  };

  return (
    <BottomSheet {...sheet}>
      <Text style={styles.label}>{t('common.anchorPoiId')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('common.anchorPoiId')}
        placeholderTextColor="#666"
        value={anchorId}
        onChangeText={setAnchorId}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>{t('iconMarker.orientation')}</Text>
      <View style={styles.segmented}>
        {ORIENTATIONS.map(({ value, labelKey }) => {
          const isActive = value === orientation;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => handleOrientation(value)}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handlePlace}>
          <Text style={styles.buttonText}>{t('iconMarker.place')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !placedOn ? styles.buttonDisabled : null]}
          disabled={!placedOn}
          onPress={handleRemove}>
          <Text style={styles.buttonText}>{t('iconMarker.remove')}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.meta}>
        {placedOn ? t('iconMarker.placedOn', { id: placedOn }) : t('iconMarker.none')}
      </Text>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#057DBC',
  },
  segmentText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#fff',
  },
  button: {
    flex: 1,
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#E74C3C',
    fontSize: 13,
  },
  meta: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default IconMarkerPanel;
