import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FeatureSlug } from '../features/registry';
import FeatureScreen from '../screens/FeatureScreen';
import HomeScreen from '../screens/HomeScreen';

export type RootStackParamList = {
  Home: undefined;
  Feature: { slug: FeatureSlug };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'VisioOne demos' }} />
    <Stack.Screen name="Feature" component={FeatureScreen} />
  </Stack.Navigator>
);

export default RootNavigator;
