import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { HtmlMarkerCreateResult, HtmlMarkerTap, VisioMapBridge } from '../components/VisioMapView';
import { ANCHOR_POI_ID } from '../demoMap';
import { useLocale } from '../i18n/useLocale';

interface Props {
  createHtmlMarker: VisioMapBridge['createHtmlMarker'];
  updateHtmlMarkerText: VisioMapBridge['updateHtmlMarkerText'];
  setHtmlMarkerVisible: VisioMapBridge['setHtmlMarkerVisible'];
  removeHtmlMarker: VisioMapBridge['removeHtmlMarker'];
  createResult: HtmlMarkerCreateResult | null;
  tap: HtmlMarkerTap | null;
}

// Only one badge is placed at a time in this demo, always under this id -- the live
// SDK Marker object (and its DOM element) is tracked on the WebView side, keyed by it.
const MARKER_ID = 'html-overlay-marker';

interface Status {
  message: string;
  isError: boolean;
}

const reasonMessage = (result: HtmlMarkerCreateResult): string => {
  switch (result.reason) {
    case 'empty_text':
      return 'Text is required';
    case 'anchor_not_found':
      return 'POI not found';
    case 'no_position':
      return 'This POI has no position';
    default:
      return `Could not place the badge${result.message ? ` (${result.message})` : ''}`;
  }
};

const HtmlMarkerOverlay = ({
  createHtmlMarker,
  updateHtmlMarkerText,
  setHtmlMarkerVisible,
  removeHtmlMarker,
  createResult,
  tap,
}: Props) => {
  const { t } = useLocale();
  const [anchorId, setAnchorId] = React.useState(ANCHOR_POI_ID);
  const [text, setText] = React.useState(() => t('htmlOverlayMarker.defaultText'));
  // Anchor id of the badge currently on the map, null when nothing is placed.
  const [placedOn, setPlacedOn] = React.useState<string | null>(null);
  const [isVisible, setIsVisible] = React.useState(true);
  const [status, setStatus] = React.useState<Status | null>(null);

  React.useEffect(() => {
    if (!createResult) {
      return;
    }
    if (createResult.ok) {
      setPlacedOn(createResult.anchorId);
      setIsVisible(true);
      setStatus({ message: `Badge placed on ${createResult.anchorId}`, isError: false });
    } else {
      // A validation failure leaves the current badge (if any) untouched on the
      // WebView side; only an SDK error may have removed it.
      if (createResult.reason === 'sdk_error') {
        setPlacedOn(null);
      }
      setStatus({ message: reasonMessage(createResult), isError: true });
    }
  }, [createResult]);

  // The tap counter lives on the WebView side (it resets on each successful Place),
  // so each forwarded tap already carries the running count.
  React.useEffect(() => {
    if (tap) {
      setStatus({ message: `Badge tapped (${tap.tapCount})`, isError: false });
    }
  }, [tap]);

  const handlePlace = () => {
    const badgeText = text.trim();
    if (!badgeText) {
      setStatus({ message: 'Text is required', isError: true });
      return;
    }
    const anchor = anchorId.trim();
    if (!anchor) {
      setStatus({ message: 'POI not found', isError: true });
      return;
    }
    // No remove here: the WebView side replaces the previous badge only once the new
    // one passes validation, so a failed Place leaves it on the map.
    createHtmlMarker(MARKER_ID, anchor, badgeText);
  };

  const handleUpdateText = () => {
    if (!placedOn) {
      return;
    }
    const badgeText = text.trim();
    if (!badgeText) {
      setStatus({ message: 'Text is required', isError: true });
      return;
    }
    updateHtmlMarkerText(MARKER_ID, badgeText);
    setStatus({ message: 'Badge text updated', isError: false });
  };

  const handleToggleVisible = () => {
    if (!placedOn) {
      return;
    }
    const next = !isVisible;
    setHtmlMarkerVisible(MARKER_ID, next);
    setIsVisible(next);
    setStatus({ message: next ? 'Badge shown' : 'Badge hidden', isError: false });
  };

  const handleRemove = () => {
    if (!placedOn) {
      return;
    }
    removeHtmlMarker(MARKER_ID);
    setPlacedOn(null);
    setIsVisible(true);
    setStatus({ message: 'Badge removed', isError: false });
  };

  const disabledStyle = !placedOn ? styles.buttonDisabled : null;

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

      <Text style={styles.label}>Badge text</Text>
      <TextInput
        style={styles.input}
        placeholder="Badge text"
        placeholderTextColor="#666"
        value={text}
        onChangeText={setText}
        autoCorrect={false}
      />

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handlePlace}>
          <Text style={styles.buttonText}>Place badge</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, disabledStyle]}
          disabled={!placedOn}
          onPress={handleUpdateText}>
          <Text style={styles.buttonText}>Update text</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.buttonSecondary, disabledStyle]}
          disabled={!placedOn}
          onPress={handleToggleVisible}>
          <Text style={styles.buttonText}>{isVisible ? 'Hide badge' : 'Show badge'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, disabledStyle]}
          disabled={!placedOn}
          onPress={handleRemove}>
          <Text style={styles.buttonText}>Remove badge</Text>
        </TouchableOpacity>
      </View>

      <Text style={status?.isError ? styles.error : styles.meta}>
        {status ? status.message : placedOn ? `Badge placed on ${placedOn}` : 'No badge placed'}
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

export default HtmlMarkerOverlay;
