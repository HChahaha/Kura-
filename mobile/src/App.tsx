import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { initializeNotifications } from '@/services/notificationService';
import { initializeOfflineDB } from '@/services/offlineService';
import HomeScreen from '@/screens/HomeScreen';
import PantryScreen from '@/screens/PantryScreen';
import RecipesScreen from '@/screens/RecipesScreen';
import ShoppingListScreen from '@/screens/ShoppingListScreen';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function PantryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PantryList" component={PantryScreen} />
    </Stack.Navigator>
  );
}

function RecipesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RecipesList" component={RecipesScreen} />
    </Stack.Navigator>
  );
}

function ShoppingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ShoppingListMain" component={ShoppingListScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize offline database
    initializeOfflineDB();
    // Initialize push notifications
    initializeNotifications();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Pantry') {
              iconName = focused ? 'archive' : 'archive-outline';
            } else if (route.name === 'Recipes') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'Shopping') {
              iconName = focused ? 'list' : 'list-outline';
            } else {
              iconName = 'alert';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#9ca3af',
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Dashboard' }}
        />
        <Tab.Screen
          name="Pantry"
          component={PantryStack}
          options={{ title: 'Pantry', headerShown: false }}
        />
        <Tab.Screen
          name="Recipes"
          component={RecipesStack}
          options={{ title: 'Recipes', headerShown: false }}
        />
        <Tab.Screen
          name="Shopping"
          component={ShoppingStack}
          options={{ title: 'Shopping', headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
