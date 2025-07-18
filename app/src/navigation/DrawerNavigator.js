import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Avatar, Title, Caption, Drawer, Switch, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

import BottomTabNavigator from './BottomTabNavigator';
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';

const DrawerNav = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { t, isRTL } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <View style={styles.userInfoSection}>
          <View style={styles.userInfo}>
            <Avatar.Text
              size={60}
              label={user?.name?.substring(0, 2).toUpperCase() || 'U'}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Title style={styles.title}>{user?.name || 'Guest'}</Title>
              <Caption style={styles.caption}>{user?.email || 'Welcome'}</Caption>
              <Caption style={styles.caption}>
                {user?.role === 'merchant' && t('merchant.dashboard')}
                {user?.role === 'admin' && t('admin.dashboard')}
                {user?.role === 'moderator' && t('admin.moderation')}
                {user?.role === 'shopper' && t('common.shopper')}
              </Caption>
            </View>
          </View>
        </View>

        <Drawer.Section style={styles.drawerSection}>
          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            )}
            label={t('navigation.home')}
            onPress={() => props.navigation.navigate('Tabs')}
          />
          
          {user && (
            <DrawerItem
              icon={({ color, size }) => (
                <Ionicons name="time-outline" color={color} size={size} />
              )}
              label={t('navigation.history')}
              onPress={() => props.navigation.navigate('History')}
            />
          )}

          {user?.role === 'merchant' && (
            <DrawerItem
              icon={({ color, size }) => (
                <Ionicons name="business-outline" color={color} size={size} />
              )}
              label={t('merchant.dashboard')}
              onPress={() => props.navigation.navigate('MerchantDashboard')}
            />
          )}

          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <DrawerItem
              icon={({ color, size }) => (
                <Ionicons name="settings-outline" color={color} size={size} />
              )}
              label={t('admin.dashboard')}
              onPress={() => props.navigation.navigate('AdminDashboard')}
            />
          )}

          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="settings-outline" color={color} size={size} />
            )}
            label={t('navigation.settings')}
            onPress={() => props.navigation.navigate('Settings')}
          />
        </Drawer.Section>

        <Divider />

        <Drawer.Section style={styles.drawerSection}>
          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="help-circle-outline" color={color} size={size} />
            )}
            label={t('profile.help')}
            onPress={() => {
              // Handle help navigation
            }}
          />
          
          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="information-circle-outline" color={color} size={size} />
            )}
            label={t('profile.about')}
            onPress={() => {
              // Handle about navigation
            }}
          />

          {user && (
            <DrawerItem
              icon={({ color, size }) => (
                <Ionicons name="log-out-outline" color={color} size={size} />
              )}
              label={t('common.logout')}
              onPress={logout}
            />
          )}
        </Drawer.Section>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <DrawerNav.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.text,
      }}
    >
      <DrawerNav.Screen
        name="Tabs"
        component={BottomTabNavigator}
        options={{
          title: t('navigation.home'),
        }}
      />
      
      {user && (
        <DrawerNav.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: t('navigation.history'),
          }}
        />
      )}

      {user?.role === 'merchant' && (
        <DrawerNav.Screen
          name="MerchantDashboard"
          component={MerchantDashboardScreen}
          options={{
            title: t('merchant.dashboard'),
          }}
        />
      )}

      {(user?.role === 'admin' || user?.role === 'moderator') && (
        <DrawerNav.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{
            title: t('admin.dashboard'),
          }}
        />
      )}

      <DrawerNav.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('navigation.settings'),
        }}
      />
    </DrawerNav.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  caption: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  drawerSection: {
    marginTop: 15,
  },
  bottomDrawerSection: {
    marginBottom: 15,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});