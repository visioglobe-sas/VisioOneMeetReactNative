import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  baseURL: string;
  onChangeBaseURL: (value: string) => void;
  onReload: () => void;
}

const CustomBaseUrlOverlay = ({ baseURL, onChangeBaseURL, onReload }: Props) => {
  return (
    <View style={styles.column}>
      <TextInput
        style={styles.input}
        placeholder="Base URL"
        value={baseURL}
        onChangeText={onChangeBaseURL}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <TouchableOpacity style={styles.button} onPress={onReload}>
        <Text style={styles.buttonText}>Reload venue</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Reloads the whole venue against this URL as LoadOptions.baseURL. The default value
        above is the SDK's own — clearing the field or typing an unreachable URL both
        demonstrate the parameter is genuinely wired through (see the status badge above the
        map for the load outcome).
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
});

export default CustomBaseUrlOverlay;
