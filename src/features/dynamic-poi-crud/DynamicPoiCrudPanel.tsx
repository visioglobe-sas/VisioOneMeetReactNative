import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { ANCHOR_POI_ID, DYNAMIC_POI_NEW_ID } from '../../demoMap';
import { Translate, useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { DynamicPoiCreateResult, useDynamicPoiCrudBridge } from './bridge';

// Only one dynamically-created POI is tracked at a time -- the simplest demo state.
// The live SDK POI/Label objects only exist on the WebView side (see webview.js);
// this component only tracks the display id/text it gets back over the bridge. It
// stays mounted for the whole screen, so after closing and reopening the panel the
// tracked POI can still be updated or removed. See docs/features/dynamic-poi-crud.md.
interface TrackedPoi {
  id: string;
  text: string;
}

const reasonMessage = (result: DynamicPoiCreateResult, t: Translate): string => {
  switch (result.reason) {
    case 'anchor_not_found':
      return t('dynamicPoiCrud.anchorNotFound');
    case 'no_position':
      return t('dynamicPoiCrud.noPosition');
    case 'duplicate_id':
      return t('dynamicPoiCrud.duplicateId', { details: result.message ? ` (${result.message})` : '' });
    case 'already_tracked':
      return t('dynamicPoiCrud.alreadyTracked');
    default:
      return t('dynamicPoiCrud.failed');
  }
};

const DynamicPoiCrudPanel = ({ sheet }: PanelProps) => {
  const { t } = useLocale();
  const { createDynamicPoi, updateDynamicPoiLabel, removeDynamicPoi, createResult } =
    useDynamicPoiCrudBridge();
  const [newId, setNewId] = React.useState(DYNAMIC_POI_NEW_ID);
  const [anchorId, setAnchorId] = React.useState(ANCHOR_POI_ID);
  const [labelText, setLabelText] = React.useState(() => t('dynamicPoiCrud.defaultLabel'));
  const [trackedPoi, setTrackedPoi] = React.useState<TrackedPoi | null>(null);
  const [awaitingCreate, setAwaitingCreate] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!awaitingCreate || !createResult) {
      return;
    }
    setAwaitingCreate(false);
    if (createResult.ok && createResult.id !== undefined && createResult.text !== undefined) {
      setError(null);
      setTrackedPoi({ id: createResult.id, text: createResult.text });
    } else {
      setError(reasonMessage(createResult, t));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createResult]);

  const handleCreate = () => {
    const id = newId.trim();
    const anchor = anchorId.trim();
    const text = labelText.trim();
    if (!id || !anchor || !text || trackedPoi) {
      return;
    }
    setError(null);
    setAwaitingCreate(true);
    createDynamicPoi(id, anchor, text);
  };

  const handleUpdate = () => {
    const text = labelText.trim();
    if (!trackedPoi || !text) {
      return;
    }
    updateDynamicPoiLabel(text);
    setTrackedPoi({ ...trackedPoi, text });
  };

  const handleRemove = () => {
    if (!trackedPoi) {
      return;
    }
    removeDynamicPoi();
    setTrackedPoi(null);
    setError(null);
  };

  return (
    <BottomSheet {...sheet}>
      <TextInput
        style={styles.input}
        placeholder={t('dynamicPoiCrud.newId')}
        placeholderTextColor="#666"
        value={newId}
        onChangeText={setNewId}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!trackedPoi}
      />
      <TextInput
        style={styles.input}
        placeholder={t('dynamicPoiCrud.anchorId')}
        placeholderTextColor="#666"
        value={anchorId}
        onChangeText={setAnchorId}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!trackedPoi}
      />
      <TextInput
        style={styles.input}
        placeholder={t('dynamicPoiCrud.labelText')}
        placeholderTextColor="#666"
        value={labelText}
        onChangeText={setLabelText}
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, (trackedPoi || awaitingCreate) && styles.buttonDisabled]}
          disabled={!!trackedPoi || awaitingCreate}
          onPress={handleCreate}>
          <Text style={styles.buttonText}>
            {awaitingCreate ? t('dynamicPoiCrud.creating') : t('dynamicPoiCrud.create')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !trackedPoi && styles.buttonDisabled]}
          disabled={!trackedPoi}
          onPress={handleUpdate}>
          <Text style={styles.buttonText}>{t('common.updateText')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !trackedPoi && styles.buttonDisabled]}
          disabled={!trackedPoi}
          onPress={handleRemove}>
          <Text style={styles.buttonText}>{t('dynamicPoiCrud.remove')}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.meta}>
        {trackedPoi
          ? t('dynamicPoiCrud.created', { id: trackedPoi.id, text: trackedPoi.text })
          : t('dynamicPoiCrud.none')}
      </Text>

      <Text style={styles.hint}>{t('dynamicPoiCrud.hint')}</Text>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
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
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
});

export default DynamicPoiCrudPanel;
