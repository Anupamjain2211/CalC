import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalculatorScreen from './CalculatorScreen';
import VaultScreen from './VaultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Calculator" component={CalculatorScreen} />
        <Stack.Screen name="Vault" component={VaultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}