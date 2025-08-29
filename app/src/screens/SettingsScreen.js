import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  List,
  Switch,
  Divider,
  Button,
  RadioButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: true,
      sms: false,
      newMessages: true,
      productUpdates: true,
      promotions: false,
    },
    privacy: {
      showEmail: false,
      showPhone: false,
      allowSearch: true,
    },
    theme: 'light',
    language: currentLanguage,
  });

  const handleSettingChange = (category, setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
  };

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setSettings((prev) => ({
      ...prev,
      language: languageCode,
    }));
  };

  const handleSaveSettings = () => {
    // Save settings to backend
    Alert.alert(t('common.success'), t('settings.settingsSaved'));
  };

  const handleResetSettings = () => {
    Alert.alert(
      t('settings.resetSettings'),
      t('settings.resetSettingsConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: () => {
            setSettings({
              notifications: {
                push: true,
                email: true,
                sms: false,
                newMessages: true,
                productUpdates: true,
                promotions: false,
              },
              privacy: {
                showEmail: false,
                showPhone: false,
                allowSearch: true,
              },
              theme: 'light',
              language: 'en',
            });
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('settings.deleteAccountFinal'),
              t('settings.deleteAccountFinalConfirm'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: () => {
                    // Handle account deletion
                    Alert.alert(
                      t('common.info'),
                      t('settings.accountDeletionPending'),
                    );
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSettings}
        >
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            <View style={styles.languageContainer}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  settings.language === 'en' && styles.selectedLanguage,
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text
                  style={[
                    styles.languageText,
                    settings.language === 'en' && styles.selectedLanguageText,
                  ]}
                >
                  English
                </Text>
                {settings.language === 'en' && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  settings.language === 'fa' && styles.selectedLanguage,
                ]}
                onPress={() => handleLanguageChange('fa')}
              >
                <Text
                  style={[
                    styles.languageText,
                    settings.language === 'fa' && styles.selectedLanguageText,
                  ]}
                >
                  دری (Dari)
                </Text>
                {settings.language === 'fa' && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  settings.language === 'ps' && styles.selectedLanguage,
                ]}
                onPress={() => handleLanguageChange('ps')}
              >
                <Text
                  style={[
                    styles.languageText,
                    settings.language === 'ps' && styles.selectedLanguageText,
                  ]}
                >
                  پښتو (Pashto)
                </Text>
                {settings.language === 'ps' && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              {t('settings.notifications')}
            </Text>

            <List.Item
              title={t('settings.pushNotifications')}
              description={t('settings.pushNotificationsDesc')}
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.notifications.push}
                  onValueChange={(value) =>
                    handleSettingChange('notifications', 'push', value)
                  }
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('settings.emailNotifications')}
              description={t('settings.emailNotificationsDesc')}
              left={(props) => <List.Icon {...props} icon="email" />}
              right={() => (
                <Switch
                  value={settings.notifications.email}
                  onValueChange={(value) =>
                    handleSettingChange('notifications', 'email', value)
                  }
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('settings.newMessages')}
              description={t('settings.newMessagesDesc')}
              left={(props) => <List.Icon {...props} icon="message" />}
              right={() => (
                <Switch
                  value={settings.notifications.newMessages}
                  onValueChange={(value) =>
                    handleSettingChange('notifications', 'newMessages', value)
                  }
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('settings.productUpdates')}
              description={t('settings.productUpdatesDesc')}
              left={(props) => <List.Icon {...props} icon="package" />}
              right={() => (
                <Switch
                  value={settings.notifications.productUpdates}
                  onValueChange={(value) =>
                    handleSettingChange(
                      'notifications',
                      'productUpdates',
                      value,
                    )
                  }
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('settings.promotions')}
              description={t('settings.promotionsDesc')}
              left={(props) => <List.Icon {...props} icon="tag" />}
              right={() => (
                <Switch
                  value={settings.notifications.promotions}
                  onValueChange={(value) =>
                    handleSettingChange('notifications', 'promotions', value)
                  }
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('settings.privacy')}</Text>

            <List.Item
              title={t('settings.showEmail')}
              description={t('settings.showEmailDesc')}
              left={(props) => <List.Icon {...props} icon="email-outline" />}
              right={() => (
                <Switch
                  value={settings.privacy.showEmail}
                  onValueChange={(value) =>
                    handleSettingChange('privacy', 'showEmail', value)
                  }
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('settings.showPhone')}
              description={t('settings.showPhoneDesc')}
              left={(props) => <List.Icon {...props} icon="phone-outline" />}
              right={() => (
                <Switch
                  value={settings.privacy.showPhone}
                  onValueChange={(value) =>
                    handleSettingChange('privacy', 'showPhone', value)
                  }
                />
              )}
            />

            <Divider />

            <List.Item
              title={t('settings.allowSearch')}
              description={t('settings.allowSearchDesc')}
              left={(props) => <List.Icon {...props} icon="magnify" />}
              right={() => (
                <Switch
                  value={settings.privacy.allowSearch}
                  onValueChange={(value) =>
                    handleSettingChange('privacy', 'allowSearch', value)
                  }
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('settings.account')}</Text>

            <List.Item
              title={t('settings.changePassword')}
              description={t('settings.changePasswordDesc')}
              left={(props) => <List.Icon {...props} icon="lock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navigate to change password screen
                Alert.alert(t('common.info'), t('settings.featureComingSoon'));
              }}
            />

            <Divider />

            <List.Item
              title={t('settings.downloadData')}
              description={t('settings.downloadDataDesc')}
              left={(props) => <List.Icon {...props} icon="download" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Handle data download
                Alert.alert(
                  t('common.info'),
                  t('settings.dataDownloadRequested'),
                );
              }}
            />
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={styles.dangerCard}>
          <Card.Content>
            <Text style={styles.dangerTitle}>{t('settings.dangerZone')}</Text>

            <Button
              mode="outlined"
              onPress={handleResetSettings}
              style={styles.dangerButton}
              textColor={theme.colors.error}
              icon="refresh"
            >
              {t('settings.resetSettings')}
            </Button>

            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              style={styles.dangerButton}
              textColor={theme.colors.error}
              icon="delete"
            >
              {t('settings.deleteAccount')}
            </Button>
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('settings.appInfo')}</Text>

            <List.Item
              title={t('settings.version')}
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />

            <Divider />

            <List.Item
              title={t('settings.termsOfService')}
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navigate to terms of service
                Alert.alert(t('common.info'), t('settings.featureComingSoon'));
              }}
            />

            <Divider />

            <List.Item
              title={t('settings.privacyPolicy')}
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navigate to privacy policy
                Alert.alert(t('common.info'), t('settings.featureComingSoon'));
              }}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dangerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: 16,
  },
  languageContainer: {
    gap: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedLanguage: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  languageText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedLanguageText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dangerButton: {
    marginBottom: 8,
    borderColor: theme.colors.error,
  },
});
