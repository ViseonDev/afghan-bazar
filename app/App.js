import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import FlashMessage from 'react-native-flash-message';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { theme } from './src/theme/theme';
import { navigationRef } from './src/navigation/NavigationService';

// Screens
import SplashScreenComponent from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductListScreen from './src/screens/product/ProductListScreen';
import ProductDetailScreen from './src/screens/product/ProductDetailScreen';
import StoreListScreen from './src/screens/store/StoreListScreen';
import StoreDetailScreen from './src/screens/store/StoreDetailScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import ConversationsScreen from './src/screens/chat/ConversationsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MerchantDashboardScreen from './src/screens/merchant/MerchantDashboardScreen';
import ManageStoresScreen from './src/screens/merchant/ManageStoresScreen';
import ManageProductsScreen from './src/screens/merchant/ManageProductsScreen';
import CreateStoreScreen from './src/screens/merchant/CreateStoreScreen';
import CreateProductScreen from './src/screens/merchant/CreateProductScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import UserManagementScreen from './src/screens/admin/UserManagementScreen';
import ContentModerationScreen from './src/screens/admin/ContentModerationScreen';
import SystemSettingsScreen from './src/screens/admin/SystemSettingsScreen';
import ReportsScreen from './src/screens/admin/ReportsScreen';
import FlaggedContentScreen from './src/screens/admin/FlaggedContentScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Navigation
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import DrawerNavigator from './src/navigation/DrawerNavigator';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user, isLoading, checkAuthState } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          // Add custom fonts if needed
        });
        
        // Check authentication state
        await checkAuthState();
        
        // Artificially delay for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady || isLoading) {
    return <SplashScreenComponent />;
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={onLayoutRootView}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            {user.role === 'merchant' && (
              <>
                <Stack.Screen name="MerchantDashboard" component={MerchantDashboardScreen} />
                <Stack.Screen name="ManageStores" component={ManageStoresScreen} />
                <Stack.Screen name="ManageProducts" component={ManageProductsScreen} />
                <Stack.Screen name="CreateStore" component={CreateStoreScreen} />
                <Stack.Screen name="EditStore" component={CreateStoreScreen} />
                <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
                <Stack.Screen name="EditProduct" component={CreateProductScreen} />
              </>
            )}
            {(user.role === 'admin' || user.role === 'moderator') && (
              <>
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="UserManagement" component={UserManagementScreen} />
                <Stack.Screen name="ContentModeration" component={ContentModerationScreen} />
                <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
                <Stack.Screen name="Reports" component={ReportsScreen} />
                <Stack.Screen name="FlaggedContent" component={FlaggedContentScreen} />
              </>
            )}
          </>
        ) : (
          // Unauthenticated screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="StoreList" component={StoreListScreen} />
            <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <LanguageProvider>
            <AppContent />
            <FlashMessage position="top" />
            <StatusBar style="auto" />
          </LanguageProvider>
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}