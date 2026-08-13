import * as React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { featureRegistry } from '../features/registry';
import { useLocale } from '../i18n/useLocale';
import { RootStackParamList } from '../navigation/RootNavigator';

// Kept in sync with app.json/package.json's "displayName".
const APP_DISPLAY_NAME = 'VisioOneMeetRN';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const { t } = useLocale();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/appIcon.png')} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>{APP_DISPLAY_NAME} by VisioGlobe</Text>
      </View>
      <FlatList
        data={featureRegistry}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Feature', { slug: item.slug })}>
            <Text style={styles.title}>{t(item.titleKey)}</Text>
            <Text style={styles.description}>{t(item.descriptionKey)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },
});

export default HomeScreen;
