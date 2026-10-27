import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import ColorChips from '../components/ColorChips';
import { TextLabelCreateResult } from '../components/VisioMapView';
import { ANCHOR_POI_ID } from '../demoMap';
import { StringKey } from '../i18n/strings';
import { Translate, useLocale } from '../i18n/useLocale';
import { FeatureProps } from './types';

// Only one label is placed at a time in this demo, always under this id -- the live
// SDK Label object is tracked on the WebView side, keyed by it.
const LABEL_ID = 'custom-text-label';

const COLORS: { value: string; labelKey: StringKey }[] = [
  { value: '#E53935', labelKey: 'color.red' },
  { value: '#43A047', labelKey: 'color.green' },
  { value: '#1E88E5', labelKey: 'color.blue' },
  { value: '#212121', labelKey: 'color.dark' },
];

type SizeKey = 'small' | 'medium' | 'large';

// Text box size in meters. Width and height are always sent together: createLabel
// defaults height to width, and updateLabel with width alone sets height = width.
const SIZES: { value: SizeKey; labelKey: StringKey; width: number; height: number }[] = [
  { value: 'small', labelKey: 'customTextLabel.small', width: 10, height: 2 },
  { value: 'medium', labelKey: 'customTextLabel.medium', width: 16, height: 3 },
  { value: 'large', labelKey: 'customTextLabel.large', width: 22, height: 4 },
];

const ROTATIONS = [0, 45, 90];

interface Status {
  message: string;
  isError: boolean;
}

const reasonMessage = (result: TextLabelCreateResult, t: Translate): string => {
  switch (result.reason) {
    case 'empty_text':
      return t('common.textRequired');
    case 'anchor_not_found':
      return t('common.poiNotFound');
    case 'no_position':
      return t('common.noPosition');
    default:
      return t('customTextLabel.failed', { details: result.message ? ` (${result.message})` : '' });
  }
};

const sizeOf = (key: SizeKey) => SIZES.find((item) => item.value === key) ?? SIZES[1];

// Fields, style selections and what is placed live here (mounted for the whole
// screen), so reopening the panel shows the label actually on the map and a later
// rotation change re-creates it with its real text.
const TextLabelFeature = ({ ctx, sheet }: FeatureProps) => {
  const { t } = useLocale();
  const { createTextLabel, updateTextLabel, removeTextLabel } = ctx.bridge;
  const createResult = ctx.textLabelCreateResult;
  const [anchorId, setAnchorId] = React.useState(ANCHOR_POI_ID);
  const [text, setText] = React.useState(() => t('customTextLabel.defaultText'));
  const [color, setColor] = React.useState(COLORS[0].value);
  const [size, setSize] = React.useState<SizeKey>('medium');
  const [rotation, setRotation] = React.useState(0);
  // What is currently placed (anchor + text actually on the map), null when nothing is.
  // Needed to recreate the label with the same values when only the rotation changes.
  const [placed, setPlaced] = React.useState<{ anchorId: string; text: string } | null>(null);
  // Anchor/text of the create request in flight, confirmed by the next createResult;
  // null when no create is awaiting its answer.
  const pending = React.useRef<{ anchorId: string; text: string } | null>(null);
  const [status, setStatus] = React.useState<Status | null>(null);

  React.useEffect(() => {
    const request = pending.current;
    if (!createResult || !request) {
      return;
    }
    pending.current = null;
    if (createResult.ok) {
      setPlaced({ anchorId: createResult.anchorId, text: request.text });
      setStatus({ message: t('customTextLabel.placedOn', { id: createResult.anchorId }), isError: false });
    } else {
      setPlaced(null);
      setStatus({ message: reasonMessage(createResult, t), isError: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setStatus({ message: t('common.textRequired'), isError: true });
      return;
    }
    const anchor = anchorId.trim();
    if (!anchor) {
      setStatus({ message: t('common.poiNotFound'), isError: true });
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
      setStatus({ message: t('common.textRequired'), isError: true });
      return;
    }
    updateTextLabel(LABEL_ID, { text: labelText });
    setPlaced({ ...placed, text: labelText });
    setStatus({ message: t('customTextLabel.updated'), isError: false });
  };

  const handleRemove = () => {
    if (!placed) {
      return;
    }
    removeTextLabel(LABEL_ID);
    setPlaced(null);
    setStatus({ message: t('customTextLabel.removed'), isError: false });
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

      <Text style={styles.label}>{t('common.text')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('common.text')}
        placeholderTextColor="#666"
        value={text}
        onChangeText={setText}
        autoCorrect={false}
      />

      <Text style={styles.label}>{t('common.color')}</Text>
      <ColorChips
        options={COLORS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
        selected={color}
        onSelect={handleColor}
      />

      <Text style={styles.label}>{t('customTextLabel.size')}</Text>
      <View style={styles.segmented}>
        {SIZES.map(({ value, labelKey }) => {
          const isActive = value === size;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => handleSize(value)}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>{t('customTextLabel.rotation')}</Text>
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
          <Text style={styles.buttonText}>{t('customTextLabel.place')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !placed ? styles.buttonDisabled : null]}
          disabled={!placed}
          onPress={handleUpdateText}>
          <Text style={styles.buttonText}>{t('common.updateText')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !placed ? styles.buttonDisabled : null]}
          disabled={!placed}
          onPress={handleRemove}>
          <Text style={styles.buttonText}>{t('customTextLabel.remove')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={status?.isError ? styles.error : styles.meta}>
        {status
          ? status.message
          : placed
            ? t('customTextLabel.placedOn', { id: placed.anchorId })
            : t('customTextLabel.none')}
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

export default TextLabelFeature;
