import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FeatureSlug, featureRegistry } from '../features/registry';
import FeatureScreen from '../screens/FeatureScreen';
import HomeScreen from '../screens/HomeScreen';
import { strings } from '../i18n/strings';

export type RootStackParamList = {
  Home: undefined;
  Feature: { slug: FeatureSlug };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'VisioOne demos' }} />
    <Stack.Screen
      name="Feature"
      component={FeatureScreen}
      options={({ route }) => {
        const feature = featureRegistry.find((item) => item.slug === route.params.slug);
        return {
          headerBackVisible: true,
          title: feature ? strings.en[feature.titleKey] : 'Feature',
        };
      }}
    />
  </Stack.Navigator>
);

export default RootNavigator;
