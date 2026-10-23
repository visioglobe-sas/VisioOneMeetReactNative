import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { IconMarkerCreateResult, VisioMapBridge } from '../components/VisioMapView';
import { ANCHOR_POI_ID } from '../demoMap';
import { ImageOrientationType } from '../screens/useVisioMap';

interface Props {
  createIconMarker: VisioMapBridge['createIconMarker'];
  updateIconMarkerOrientation: VisioMapBridge['updateIconMarkerOrientation'];
  removeIconMarker: VisioMapBridge['removeIconMarker'];
  createResult: IconMarkerCreateResult | null;
}

// A 96x96 PNG (blue disc + white star), inlined as a data URL -- venue.createImage's
// url accepts data: URLs as well as regular web URLs.
const ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACBklEQVR42u3dWW4CMRBFUVbLarOn5JsIqRlsv6FuSfmE0O+IwS7bfbtR1GXdf34/+qMOhg2KcehgGIU+HsMt+DEQ7sHXQqQFXwWRHn4sQkvwkRCt4dsjtAdvDTEtfCuEqeFbIAgv/H/NQzAKfx6CYfhzEIzD70cQf+FFAGxFAEAIEBJ+J4LB7+04gKUIAAgBTEackQBfI4SG34MAgBDAaMIrHuAjBACEAGZTvhUAbyEAIAQwbHrUALyEAAAAcwGMe68V4V8iHAjJHeAI7mqAb0oNcOK1vwYgCP+di1E/334EMcDVRSmewx5gd60COPk6K94Bzy7u1OP4CAqrNQCCQdJ4gAcE0Uh1dPgrASYirB0Ri+dsRoa/A6AdYt+ckNksZn3wpwDSIc7NiprP69cFrwJwBdH3BUo6YLlN+qI2ZGZ7EgAA+AgqD99/ueKA8K0Q0veAxSMk7v+tQnABULQrvQZhQgBVv9gCQb00cXVoUQgOa0MBEALsCitvFlSEMBpAvT9gd0g5TRgATAGMe8Ru/ydul+TJULIBNiGMBlDvlFcE4rkGSISgCsICwOG0FGUIuQDCdaM121ydTs1S/wrJDP8gQN3pu44nJzo1RXLC56h6Ts4FAAROUCd8ELiLBuGDwJ2UCB8E7qhH8BMR4orgQZgdfjJEbRE8ELODd8KgBBjUQRSKuqo/fm7G7BpJ/VcAAAAASUVORK5CYII=';

// Only one icon is placed at a time in this demo, always under this id -- the live SDK
// Image object is tracked on the WebView side, keyed by it.
const IMAGE_ID = 'icon-marker';

// Size in meters, as venue.createImage expects.
const ICON_SIZE_METERS = 6;

const ORIENTATIONS: { value: ImageOrientationType; label: string }[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'flat', label: 'Flat' },
  { value: 'facing', label: 'Facing camera' },
];

const reasonMessage = (result: IconMarkerCreateResult): string => {
  switch (result.reason) {
    case 'anchor_not_found':
      return 'POI not found';
    case 'no_position':
      return 'This POI has no position';
    default:
      return `Could not place the icon${result.message ? ` (${result.message})` : ''}`;
  }
};

const IconMarkerOverlay = ({
  createIconMarker,
  updateIconMarkerOrientation,
  removeIconMarker,
  createResult,
}: Props) => {
  const [anchorId, setAnchorId] = React.useState(ANCHOR_POI_ID);
  const [orientation, setOrientation] = React.useState<ImageOrientationType>('facing');
  // Anchor POI id the icon is currently placed on, null when nothing is placed.
  const [placedOn, setPlacedOn] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!createResult) {
      return;
    }
    if (createResult.ok) {
      setError(null);
      setPlacedOn(createResult.anchorId);
    } else {
      setError(reasonMessage(createResult));
    }
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
    <View style={styles.column}>
      <Text style={styles.label}>Anchor POI ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Anchor POI ID"
        value={anchorId}
        onChangeText={setAnchorId}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Orientation</Text>
      <View style={styles.segmented}>
        {ORIENTATIONS.map(({ value, label }) => {
          const isActive = value === orientation;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => handleOrientation(value)}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handlePlace}>
          <Text style={styles.buttonText}>Place icon</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !placedOn ? styles.buttonDisabled : null]}
          disabled={!placedOn}
          onPress={handleRemove}>
          <Text style={styles.buttonText}>Remove icon</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.meta}>{placedOn ? `Icon placed on ${placedOn}` : 'No icon placed'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
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

export default IconMarkerOverlay;
