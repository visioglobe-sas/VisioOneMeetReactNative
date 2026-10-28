import * as React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useLocale } from '../../i18n/useLocale';

// auth-token feature screen: a plain text page, no map. The actual sample is
// src/features/auth-token/AuthTokenSample.tsx -- it is deliberately not rendered here, since this
// demo has no protected map to load (see docs/features/auth-token.md).
const AuthTokenInfo = () => {
  const { t } = useLocale();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.text}>{t('authToken.screenText')}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default AuthTokenInfo;
