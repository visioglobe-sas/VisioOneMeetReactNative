import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { DynamicPoiCreateResult, VisioMapBridge } from '../components/VisioMapView';

interface Props {
  createDynamicPoi: VisioMapBridge['createDynamicPoi'];
  updateDynamicPoiLabel: VisioMapBridge['updateDynamicPoiLabel'];
  removeDynamicPoi: VisioMapBridge['removeDynamicPoi'];
  createResult: DynamicPoiCreateResult | null;
}

// Only one dynamically-created POI is tracked at a time -- the simplest demo state.
// The live SDK POI/Label objects only exist on the WebView side (see
// visioOneHtml.ts/visioOne.html); this overlay only tracks the display id/text it
// gets back over the bridge. See docs/features/dynamic-poi-crud.md.
interface TrackedPoi {
  id: string;
  text: string;
}

const reasonMessage = (result: DynamicPoiCreateResult): string => {
  switch (result.reason) {
    case 'anchor_not_found':
      return "Anchor POI not found -- check that ID exists on this venue.";
    case 'no_position':
      return 'This anchor POI has no position to copy (no label or marker on it).';
    case 'duplicate_id':
      return `That POI ID is already used in this venue.${result.message ? ` (${result.message})` : ''}`;
    case 'already_tracked':
      return 'A dynamic POI is already tracked -- remove it first.';
    default:
      return 'Could not create the POI.';
  }
};

const DynamicPoiCrudOverlay = ({
  createDynamicPoi,
  updateDynamicPoiLabel,
  removeDynamicPoi,
  createResult,
}: Props) => {
  const [newId, setNewId] = React.useState('');
  const [anchorId, setAnchorId] = React.useState('');
  const [labelText, setLabelText] = React.useState('');
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
      setError(reasonMessage(createResult));
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
    <View style={styles.column}>
      <View style={styles.column}>
        <TextInput
          style={styles.input}
          placeholder="New POI ID"
          value={newId}
          onChangeText={setNewId}
          autoCapitalize="none"
          editable={!trackedPoi}
        />
        <TextInput
          style={styles.input}
          placeholder="Anchor POI ID (copy its position)"
          value={anchorId}
          onChangeText={setAnchorId}
          autoCapitalize="none"
          editable={!trackedPoi}
        />
        <TextInput
          style={styles.input}
          placeholder="Label text"
          value={labelText}
          onChangeText={setLabelText}
        />
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, trackedPoi ? styles.buttonDisabled : null]}
          disabled={!!trackedPoi}
          onPress={handleCreate}>
          <Text style={styles.buttonText}>{awaitingCreate ? 'Creating…' : 'Create'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !trackedPoi ? styles.buttonDisabled : null]}
          disabled={!trackedPoi}
          onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, !trackedPoi ? styles.buttonDisabled : null]}
          disabled={!trackedPoi}
          onPress={handleRemove}>
          <Text style={styles.buttonText}>Remove</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.meta}>
        {trackedPoi
          ? `Created: ${trackedPoi.id} — “${trackedPoi.text}”`
          : 'No dynamic POI created yet.'}
      </Text>

      <Text style={styles.hint}>
        Create makes up a new POI ID and copies the position of an existing "anchor" POI
        (a bare POI has no visual footprint of its own). Only one dynamic POI is tracked
        at a time in this demo -- remove it before creating another.
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
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
});

export default DynamicPoiCrudOverlay;
