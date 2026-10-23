import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import { HtmlMarkerCreateResult } from '../components/VisioMapView';
import { ANCHOR_POI_ID } from '../demoMap';
import { Translate, useLocale } from '../i18n/useLocale';
import { FeatureProps } from './types';

// Only one badge is placed at a time in this demo, always under this id -- the live
// SDK Marker object (and its DOM element) is tracked on the WebView side, keyed by it.
const MARKER_ID = 'html-overlay-marker';

interface Status {
  message: string;
  isError: boolean;
}

const reasonMessage = (result: HtmlMarkerCreateResult, t: Translate): string => {
  switch (result.reason) {
    case 'empty_text':
      return t('common.textRequired');
    case 'anchor_not_found':
      return t('common.poiNotFound');
    case 'no_position':
      return t('common.noPosition');
    default:
      return t('htmlOverlayMarker.failed', { details: result.message ? ` (${result.message})` : '' });
  }
};

// Fields, visibility and what is placed live here (mounted for the whole screen), so
// the panel reflects the badge actually on the map when reopened. Create results are
// only applied while a Place is awaiting its answer.
const HtmlMarkerFeature = ({ ctx, sheet }: FeatureProps) => {
  const { t } = useLocale();
  const { createHtmlMarker, updateHtmlMarkerText, setHtmlMarkerVisible, removeHtmlMarker } = ctx.bridge;
  const { createResult, tap } = ctx.htmlMarker;
  const [anchorId, setAnchorId] = React.useState(ANCHOR_POI_ID);
  const [text, setText] = React.useState(() => t('htmlOverlayMarker.defaultText'));
  // Anchor id of the badge currently on the map, null when nothing is placed.
  const [placedOn, setPlacedOn] = React.useState<string | null>(null);
  const [isVisible, setIsVisible] = React.useState(true);
  const [awaitingCreate, setAwaitingCreate] = React.useState(false);
  const [status, setStatus] = React.useState<Status | null>(null);

  React.useEffect(() => {
    if (!awaitingCreate || !createResult) {
      return;
    }
    setAwaitingCreate(false);
    if (createResult.ok) {
      setPlacedOn(createResult.anchorId);
      setIsVisible(true);
      setStatus({ message: t('htmlOverlayMarker.placedOn', { id: createResult.anchorId }), isError: false });
    } else {
      // A validation failure leaves the current badge (if any) untouched on the
      // WebView side; only an SDK error may have removed it.
      if (createResult.reason === 'sdk_error') {
        setPlacedOn(null);
      }
      setStatus({ message: reasonMessage(createResult, t), isError: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createResult]);

  // The tap counter lives on the WebView side (it resets on each successful Place),
  // so each forwarded tap already carries the running count.
  React.useEffect(() => {
    if (tap) {
      setStatus({ message: t('htmlOverlayMarker.tapped', { count: tap.tapCount }), isError: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tap]);

  const handlePlace = () => {
    const badgeText = text.trim();
    if (!badgeText) {
      setStatus({ message: t('common.textRequired'), isError: true });
      return;
    }
    const anchor = anchorId.trim();
    if (!anchor) {
      setStatus({ message: t('common.poiNotFound'), isError: true });
      return;
    }
    // No remove here: the WebView side replaces the previous badge only once the new
    // one passes validation, so a failed Place leaves it on the map.
    setAwaitingCreate(true);
    createHtmlMarker(MARKER_ID, anchor, badgeText);
  };

  const handleUpdateText = () => {
    if (!placedOn) {
      return;
    }
    const badgeText = text.trim();
    if (!badgeText) {
      setStatus({ message: t('common.textRequired'), isError: true });
      return;
    }
    updateHtmlMarkerText(MARKER_ID, badgeText);
    setStatus({ message: t('htmlOverlayMarker.updated'), isError: false });
  };

  const handleToggleVisible = () => {
    if (!placedOn) {
      return;
    }
    const next = !isVisible;
    setHtmlMarkerVisible(MARKER_ID, next);
    setIsVisible(next);
    setStatus({ message: next ? t('htmlOverlayMarker.shown') : t('htmlOverlayMarker.hidden'), isError: false });
  };

  const handleRemove = () => {
    if (!placedOn) {
      return;
    }
    removeHtmlMarker(MARKER_ID);
    setPlacedOn(null);
    setIsVisible(true);
    setStatus({ message: t('htmlOverlayMarker.removed'), isError: false });
  };

  const disabledStyle = !placedOn ? styles.buttonDisabled : null;

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

      <Text style={styles.label}>{t('htmlOverlayMarker.badgeText')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('htmlOverlayMarker.badgeText')}
        placeholderTextColor="#666"
        value={text}
        onChangeText={setText}
        autoCorrect={false}
      />

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handlePlace}>
          <Text style={styles.buttonText}>{t('htmlOverlayMarker.place')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, disabledStyle]}
          disabled={!placedOn}
          onPress={handleUpdateText}>
          <Text style={styles.buttonText}>{t('common.updateText')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.buttonSecondary, disabledStyle]}
          disabled={!placedOn}
          onPress={handleToggleVisible}>
          <Text style={styles.buttonText}>
            {isVisible ? t('htmlOverlayMarker.hide') : t('htmlOverlayMarker.show')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, disabledStyle]}
          disabled={!placedOn}
          onPress={handleRemove}>
          <Text style={styles.buttonText}>{t('htmlOverlayMarker.remove')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={status?.isError ? styles.error : styles.meta}>
        {status
          ? status.message
          : placedOn
            ? t('htmlOverlayMarker.placedOn', { id: placedOn })
            : t('htmlOverlayMarker.none')}
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

export default HtmlMarkerFeature;
