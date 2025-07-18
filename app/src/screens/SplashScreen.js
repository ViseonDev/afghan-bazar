import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Afghanistan Marketplace</Text>
        <Text style={styles.subtitle}>د افغانستان بازار</Text>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: theme.colors.afghanGreen,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
});