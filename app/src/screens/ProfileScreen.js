import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Avatar,
  Card,
  List,
  Button,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { t, formatDate } = useLanguage();
  const { user, logout } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getProfile();

      if (response.success) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('common.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: logout,
      },
    ]);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'shopper':
        return t('profile.shopper');
      case 'merchant':
        return t('profile.merchant');
      case 'moderator':
        return t('profile.moderator');
      case 'admin':
        return t('profile.admin');
      default:
        return role;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Ionicons
          name="person-outline"
          size={64}
          color={theme.colors.placeholder}
        />
        <Text style={styles.authText}>{t('auth.welcomeTitle')}</Text>
        <Text style={styles.authSubtext}>{t('auth.loginToAccess')}</Text>

        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>{t('auth.register')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <IconButton
          icon="cog"
          size={24}
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={getInitials(user.name)}
            style={styles.avatar}
          />

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>{getRoleDisplayName(user.role)}</Text>

            {user.lastLogin && (
              <Text style={styles.lastLogin}>
                {t('profile.lastLogin')}: {formatDate(user.lastLogin, 'short')}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Stats Card */}
      {profileData && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('profile.stats')}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {profileData.stats.viewHistoryCount || 0}
                </Text>
                <Text style={styles.statLabel}>{t('profile.viewsCount')}</Text>
              </View>

              {user.role === 'merchant' && (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {profileData.stats.storeCount || 0}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t('merchant.myStores')}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {profileData.stats.productCount || 0}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t('merchant.myProducts')}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        <Card.Content style={styles.menuContent}>
          <List.Item
            title={t('navigation.favorites')}
            description={t('profile.manageFavorites')}
            left={(props) => <List.Icon {...props} icon="heart" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Favorites')}
          />

          <Divider />

          <List.Item
            title={t('navigation.history')}
            description={t('profile.viewHistory')}
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('History')}
          />

          <Divider />

          <List.Item
            title={t('chat.conversations')}
            description={t('profile.myConversations')}
            left={(props) => <List.Icon {...props} icon="message" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Chat')}
          />

          {user.role === 'merchant' && (
            <>
              <Divider />
              <List.Item
                title={t('merchant.dashboard')}
                description={t('profile.manageBusiness')}
                left={(props) => <List.Icon {...props} icon="store" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('MerchantDashboard')}
              />
            </>
          )}

          {(user.role === 'admin' || user.role === 'moderator') && (
            <>
              <Divider />
              <List.Item
                title={t('admin.dashboard')}
                description={t('profile.adminTools')}
                left={(props) => <List.Icon {...props} icon="shield-account" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('AdminDashboard')}
              />
            </>
          )}
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content style={styles.menuContent}>
          <List.Item
            title={t('navigation.settings')}
            description={t('profile.accountSettings')}
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Settings')}
          />

          <Divider />

          <List.Item
            title={t('profile.help')}
            description={t('profile.helpSupport')}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Handle help navigation
            }}
          />

          <Divider />

          <List.Item
            title={t('profile.about')}
            description={t('profile.aboutApp')}
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Handle about navigation
            }}
          />
        </Card.Content>
      </Card>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor={theme.colors.error}
          buttonColor={theme.colors.surface}
          icon="logout"
        >
          {t('common.logout')}
        </Button>
      </View>

      {/* Member Since */}
      <View style={styles.memberSince}>
        <Text style={styles.memberSinceText}>
          {t('profile.memberSince')} {formatDate(user.createdAt, 'long')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  profileCard: {
    margin: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastLogin: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
    textAlign: 'center',
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  menuContent: {
    paddingHorizontal: 0,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
  memberSince: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  memberSinceText: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  authSubtext: {
    fontSize: 16,
    color: theme.colors.placeholder,
    marginTop: 8,
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flex: 1,
  },
  registerButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
