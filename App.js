import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens'; 
import AlertasScreen from './screens/AlertasScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import UbicacionScreen from './screens/UbicacionScreen';
import SuppliesInUseScreen from './screens/SuppliesInUseScreen';
import InsumosPrestamoScreen from './screens/InsumosPrestamoScreen';

enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, 
          animation: 'none',  
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Ubicacion" component={UbicacionScreen} />
        <Stack.Screen name="Alertas" component={AlertasScreen} />
        <Stack.Screen name="SuppliesInUse" component={SuppliesInUseScreen} />
        <Stack.Screen name="InsumosPrestamo" component={InsumosPrestamoScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
