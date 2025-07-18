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
import { TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = t('auth.validation.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.validation.email');
    }
    
    if (!password.trim()) {
      newErrors.password = t('auth.validation.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await login(email.trim(), password);
      
      if (result.success) {
        // Navigation will be handled by AuthContext
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.signInTitle')}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
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

            <TextInput
              mode="outlined"
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {t('auth.signIn')}
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
            {t('auth.dontHaveAccount')}{' '}
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>{t('auth.signUp')}</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  loginButton: {
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