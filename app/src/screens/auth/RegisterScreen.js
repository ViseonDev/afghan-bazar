import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TextInput, Button, Card, HelperText, Menu, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useAuth();
  const { t, getSupportedLanguages } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    language: 'en',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

  const supportedLanguages = getSupportedLanguages();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('auth.validation.required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('auth.validation.name');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('auth.validation.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.validation.email');
    }
    
    if (!formData.password.trim()) {
      newErrors.password = t('auth.validation.required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.validation.password');
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('auth.validation.required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.confirmPassword');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        language: formData.language,
      });
      
      if (result.success) {
        // Navigation will be handled by AuthContext
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getLanguageName = (code) => {
    const language = supportedLanguages.find(lang => lang.code === code);
    return language ? language.nativeName : code;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('auth.welcomeTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.signUpTitle')}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label={t('auth.name')}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              autoCapitalize="words"
              autoComplete="name"
              error={!!errors.name}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>

            <TextInput
              mode="outlined"
              label={t('auth.email')}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={!!errors.email}
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            <Menu
              visible={languageMenuVisible}
              onDismiss={() => setLanguageMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.languageSelector}
                  onPress={() => setLanguageMenuVisible(true)}
                >
                  <TextInput
                    mode="outlined"
                    label={t('auth.language')}
                    value={getLanguageName(formData.language)}
                    editable={false}
                    style={styles.input}
                    left={<TextInput.Icon icon="translate" />}
                    right={<TextInput.Icon icon="chevron-down" />}
                  />
                </TouchableOpacity>
              }
            >
              {supportedLanguages.map((language) => (
                <Menu.Item
                  key={language.code}
                  onPress={() => {
                    updateFormData('language', language.code);
                    setLanguageMenuVisible(false);
                  }}
                  title={language.nativeName}
                />
              ))}
            </Menu>

            <TextInput
              mode="outlined"
              label={t('auth.password')}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              error={!!errors.password}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <TextInput
              mode="outlined"
              label={t('auth.confirmPassword')}
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              error={!!errors.confirmPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              {t('auth.createAccount')}
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Home')}
              style={styles.guestButton}
              contentStyle={styles.buttonContent}
              icon="account-outline"
            >
              {t('auth.continueAsGuest')}
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('auth.alreadyHaveAccount')}{' '}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  languageSelector: {
    marginBottom: 8,
  },
  registerButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  buttonContent: {
    height: 50,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  dividerText: {
    marginHorizontal: 10,
    color: theme.colors.placeholder,
  },
  guestButton: {
    borderColor: theme.colors.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});