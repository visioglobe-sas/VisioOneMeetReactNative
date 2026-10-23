import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { TextLabelCreateResult, VisioMapBridge } from '../components/VisioMapView';
import { ANCHOR_POI_ID } from '../demoMap';
import { useLocale } from '../i18n/useLocale';

interface Props {
  createTextLabel: VisioMapBridge['createTextLabel'];
  updateTextLabel: VisioMapBridge['updateTextLabel'];
  removeTextLabel: VisioMapBridge['removeTextLabel'];
  createResult: TextLabelCreateResult | null;
}

// Only one label is placed at a time in this demo, always under this id -- the live
// SDK Label object is tracked on the WebView side, keyed by it.
const LABEL_ID = 'custom-text-label';

const COLORS: { value: string; label: string }[] = [
  { value: '#E53935', label: 'Red' },
  { value: '#43A047', label: 'Green' },
  { value: '#1E88E5', label: 'Blue' },
  { value: '#212121', label: 'Dark' },
];

type SizeKey = 'small' | 'medium' | 'large';

// Text box size in meters. Width and height are always sent together: createLabel
// defaults height to width, and updateLabel with width alone sets height = width.
const SIZES: { value: SizeKey; label: string; width: number; height: number }[] = [
  { value: 'small', label: 'Small', width: 10, height: 2 },
  { value: 'medium', label: 'Medium', width: 16, height: 3 },
  { value: 'large', label: 'Large', width: 22, height: 4 },
];

const ROTATIONS = [0, 45, 90];

interface Status {
  message: string;
  isError: boolean;
}

const reasonMessage = (result: TextLabelCreateResult): string => {
  switch (result.reason) {
    case 'empty_text':
      return 'Text is required';
    case 'anchor_not_found':
      return 'POI not found';
    case 'no_position':
      return 'This POI has no position';
    default:
      return `Could not place the label${result.message ? ` (${result.message})` : ''}`;
  }
};

const TextLabelOverlay = ({ createTextLabel, updateTextLabel, removeTextLabel, createResult }: Props) => {
  const { t } = useLocale();
  const [anchorId, setAnchorId] = React.useState(ANCHOR_POI_ID);
  const [text, setText] = React.useState(() => t('customTextLabel.defaultText'));
  const [color, setColor] = React.useState(COLORS[0].value);
  const [size, setSize] = React.useState<SizeKey>('medium');
  const [rotation, setRotation] = React.useState(0);
  // What is currently placed (anchor + text actually on the map), null when nothing is.
  // Needed to recreate the label with the same values when only the rotation changes.
  const [placed, setPlaced] = React.useState<{ anchorId: string; text: string } | null>(null);
  // Anchor/text of the create request in flight, confirmed by the next createResult.
  const pending = React.useRef<{ anchorId: string; text: string } | null>(null);
  const [status, setStatus] = React.useState<Status | null>(null);

  const sizeOf = (key: SizeKey) => SIZES.find((item) => item.value === key) ?? SIZES[1];

  React.useEffect(() => {
    if (!createResult) {
      return;
    }
    if (createResult.ok) {
      const request = pending.current;
      setPlaced({ anchorId: createResult.anchorId, text: request?.text ?? '' });
      setStatus({ message: `Label placed on ${createResult.anchorId}`, isError: false });
    } else {
      setPlaced(null);
      setStatus({ message: reasonMessage(createResult), isError: true });
    }
    pending.current = null;
  }, [createResult]);

  const sendCreate = (
    anchor: string,
    labelText: string,
    values: { color: string; size: SizeKey; rotation: number },
    moveCamera: boolean,
  ) => {
    const { width, height } = sizeOf(values.size);
    pending.current = { anchorId: anchor, text: labelText };
    createTextLabel(
      LABEL_ID,
      anchor,
      { text: labelText, color: values.color, width, height, rotation: values.rotation },
      moveCamera,
    );
  };

  const handlePlace = () => {
    const labelText = text.trim();
    if (!labelText) {
      setStatus({ message: 'Text is required', isError: true });
      return;
    }
    const anchor = anchorId.trim();
    if (!anchor) {
      setStatus({ message: 'POI not found', isError: true });
      return;
    }
    // Only one label at a time: remove the current one before placing a new one.
    if (placed) {
      removeTextLabel(LABEL_ID);
      setPlaced(null);
    }
    setStatus(null);
    sendCreate(anchor, labelText, { color, size, rotation }, true);
  };

  const handleUpdateText = () => {
    if (!placed) {
      return;
    }
    const labelText = text.trim();
    if (!labelText) {
      setStatus({ message: 'Text is required', isError: true });
      return;
    }
    updateTextLabel(LABEL_ID, { text: labelText });
    setPlaced({ ...placed, text: labelText });
    setStatus({ message: 'Label text updated', isError: false });
  };

  const handleRemove = () => {
    if (!placed) {
      return;
    }
    removeTextLabel(LABEL_ID);
    setPlaced(null);
    setStatus({ message: 'Label removed', isError: false });
  };

  const handleColor = (value: string) => {
    setColor(value);
    if (placed) {
      updateTextLabel(LABEL_ID, { color: value });
    }
  };

  const handleSize = (value: SizeKey) => {
    setSize(value);
    if (placed) {
      const { width, height } = sizeOf(value);
      updateTextLabel(LABEL_ID, { width, height });
    }
  };

  // rotation isn't part of LabelUpdateOptions: recreate the label (same anchor, text,
  // color and size) with the new rotation instead, without moving the camera again.
  const handleRotation = (value: number) => {
    setRotation(value);
    if (placed) {
      sendCreate(placed.anchorId, placed.text, { color, size, rotation: value }, false);
    }
  };

  return (
    <View style={styles.column}>
      <Text style={styles.label}>Anchor POI ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Anchor POI ID"
        placeholderTextColor="#666"
        value={anchorId}
        onChangeText={setAnchorId}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Text</Text>
      <TextInput
        style={styles.input}
        placeholder="Text"
        placeholderTextColor="#666"
        value={text}
        onChangeText={setText}
        autoCorrect={false}
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        {COLORS.map(({ value, label }) => {
          const isActive = value === color;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => handleColor(value)}>
              <View style={[styles.swatch, { backgroundColor: value }]} />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Size</Text>
      <View style={styles.segmented}>
        {SIZES.map(({ value, label }) => {
          const isActive = value === size;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => handleSize(value)}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Rotation</Text>
      <View style={styles.segmented}>
        {ROTATIONS.map((value) => {
          const isActive = value === rotation;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => handleRotation(value)}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{`${value}°`}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handlePlace}>
          <Text style={styles.buttonText}>Place label</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !placed ? styles.buttonDisabled : null]}
          disabled={!placed}
          onPress={handleUpdateText}>
          <Text style={styles.buttonText}>Update text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !placed ? styles.buttonDisabled : null]}
          disabled={!placed}
          onPress={handleRemove}>
          <Text style={styles.buttonText}>Remove label</Text>
        </TouchableOpacity>
      </View>

      <Text style={status?.isError ? styles.error : styles.meta}>
        {status ? status.message : placed ? `Label placed on ${placed.anchorId}` : 'No label placed'}
      </Text>
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
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#222',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: '#fff',
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    // Keeps the Dark (#212121) swatch visible on the dark panel background.
    borderWidth: 1,
    borderColor: '#888',
  },
  chipText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
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
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 8,
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
    textAlign: 'center',
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

export default TextLabelOverlay;
