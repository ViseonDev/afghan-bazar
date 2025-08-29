import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Chip, FAB, SegmentedButtons } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { favoritesAPI } from '../services/api';

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadFavorites();
      }
    }, [user, selectedTab]),
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);

      const params = {};
      if (selectedTab !== 'all') {
        params.targetType = selectedTab;
      }

      const response = await favoritesAPI.getFavorites(params);

      if (response.success) {
        setFavorites(response.data);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (favoriteId, targetType, targetName) => {
    Alert.alert(
      t('favorites.removeFavorite'),
      t('favorites.removeFavoriteConfirm', { name: targetName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await favoritesAPI.removeFromFavorites(favoriteId);
              setFavorites(favorites.filter((fav) => fav._id !== favoriteId));
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert(t('common.error'), t('favorites.errorRemoving'));
            }
          },
        },
      ],
    );
  };

  const handleItemPress = (item) => {
    if (item.targetType === 'product') {
      navigation.navigate('ProductDetail', { id: item.targetId });
    } else if (item.targetType === 'store') {
      navigation.navigate('StoreDetail', { id: item.targetId });
    }
  };

  const FavoriteItem = ({ item }) => {
    const target = item.target;
    if (!target) return null;

    const isProduct = item.targetType === 'product';
    const imageSource = isProduct
      ? target.primaryImage || target.images?.[0]
      : target.coverImage || target.images?.[0];

    return (
      <TouchableOpacity
        style={styles.favoriteItem}
        onPress={() => handleItemPress(item)}
      >
        <Image
          source={{ uri: imageSource }}
          style={styles.itemImage}
          defaultSource={require('../../assets/placeholder.png')}
        />

        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={2}>
              {target.name}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() =>
                handleRemoveFavorite(item._id, item.targetType, target.name)
              }
            >
              <Ionicons name="heart" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>

          <Text style={styles.itemDescription} numberOfLines={2}>
            {target.description}
          </Text>

          <View style={styles.itemFooter}>
            <Chip
              icon={isProduct ? 'package' : 'storefront'}
              mode="outlined"
              style={styles.typeChip}
              textStyle={styles.typeChipText}
            >
              {isProduct ? t('navigation.products') : t('navigation.stores')}
            </Chip>

            <View style={styles.itemDetails}>
              {isProduct && target.price && (
                <Text style={styles.itemPrice}>
                  {target.price} {t('currency.afn')}
                </Text>
              )}

              {isProduct && target.storeId && (
                <Text style={styles.itemStore}>{target.storeId.name}</Text>
              )}

              {!isProduct && target.city && (
                <Text style={styles.itemLocation}>{target.city}</Text>
              )}
            </View>
          </View>

          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {target.rating?.average?.toFixed(1) || 'N/A'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="heart-outline"
        size={64}
        color={theme.colors.placeholder}
      />
      <Text style={styles.emptyText}>{t('favorites.noFavorites')}</Text>
      <Text style={styles.emptySubtext}>{t('favorites.addSomeFavorites')}</Text>
    </View>
  );

  const filteredFavorites = favorites.filter((item) => {
    if (selectedTab === 'all') return true;
    return item.targetType === selectedTab;
  });

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Ionicons
          name="person-outline"
          size={64}
          color={theme.colors.placeholder}
        />
        <Text style={styles.authText}>{t('auth.loginRequired')}</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            {
              value: 'all',
              label: t('common.all'),
              icon: 'heart',
            },
            {
              value: 'product',
              label: t('favorites.products'),
              icon: 'package',
            },
            {
              value: 'store',
              label: t('favorites.stores'),
              icon: 'storefront',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Favorites List */}
      <FlatList
        data={filteredFavorites}
        renderItem={({ item }) => <FavoriteItem item={item} />}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={
          filteredFavorites.length === 0
            ? styles.emptyList
            : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
  },
  listContainer: {
    paddingBottom: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    ...theme.shadows.small,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[100],
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeChip: {
    height: 28,
  },
  typeChipText: {
    fontSize: 12,
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  itemStore: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  itemLocation: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 8,
    textAlign: 'center',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
