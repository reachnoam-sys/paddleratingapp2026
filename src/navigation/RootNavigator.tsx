import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { colors } from '../theme/colors';
import { linking } from './linking';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        {/* Add more screens here as you build them */}
        {/* <Stack.Screen name="Court" component={CourtScreen} /> */}
        {/* <Stack.Screen name="CourtsMap" component={CourtsMapScreen} /> */}
        {/* <Stack.Screen name="Profile" component={ProfileScreen} /> */}
        {/* <Stack.Screen name="Settings" component={SettingsScreen} /> */}
        {/* <Stack.Screen name="MatchHistory" component={MatchHistoryScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
