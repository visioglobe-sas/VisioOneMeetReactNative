import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FeatureSlug, featureRegistry } from '../features/registry';
import FeatureScreen from '../shell/FeatureScreen';
import HomeScreen from '../screens/HomeScreen';
import { resolveLocale } from '../i18n/useLocale';
import { strings } from '../i18n/strings';

export type RootStackParamList = {
  Home: undefined;
  Feature: { slug: FeatureSlug };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <Stack.Navigator>
    {/* HomeScreen draws its own header (app icon + name). */}
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="Feature"
      component={FeatureScreen}
      options={({ route }) => {
        const feature = featureRegistry.find((item) => item.slug === route.params.slug);
        const locale = resolveLocale();
        return {
          headerBackVisible: true,
          title: feature ? strings[locale][feature.titleKey] : '',
        };
      }}
    />
  </Stack.Navigator>
);

export default RootNavigator;
