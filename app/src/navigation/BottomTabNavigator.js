import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProductListScreen from '../screens/product/ProductListScreen';
import StoreListScreen from '../screens/store/StoreListScreen';
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Stores') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('navigation.home'),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductListScreen}
        options={{
          title: t('navigation.products'),
        }}
      />
      <Tab.Screen
        name="Stores"
        component={StoreListScreen}
        options={{
          title: t('navigation.stores'),
        }}
      />
      {user && (
        <>
          <Tab.Screen
            name="Chat"
            component={ConversationsScreen}
            options={{
              title: t('navigation.chat'),
            }}
          />
          <Tab.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{
              title: t('navigation.favorites'),
            }}
          />
        </>
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile'),
        }}
      />
    </Tab.Navigator>
  );
}