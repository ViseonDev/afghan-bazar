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
} from 'react-native';
import { Searchbar, Card, Chip, Menu, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storesAPI } from '../../services/api';

export default function StoreListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(route.params?.search || '');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadStores(true);
  }, [route.params]);

  const loadStores = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const params = {
        page: reset ? 1 : page,
        limit: 20,
        sort: sortBy,
        ...route.params,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await storesAPI.getStores(params);
      
      if (response.success) {
        const newStores = response.data;
        setStores(reset ? newStores : [...stores, ...newStores]);
        setHasMore(response.pagination.page < response.pagination.pages);
        if (!reset) setPage(page + 1);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStores(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadStores(false);
    }
  };

  const handleSearch = () => {
    loadStores(true);
  };

  const handleSort = (newSortBy) => {
    setSortBy(newSortBy);
    setSortMenuVisible(false);
    setTimeout(() => loadStores(true), 100);
  };

  const StoreItem = ({ item }) => (
    <TouchableOpacity
      style={styles.storeItem}
      onPress={() => navigation.navigate('StoreDetail', { id: item._id })}
    >
      <Image
        source={{ uri: item.coverImage || item.images?.[0] }}
        style={styles.storeImage}
        defaultSource={require('../../../assets/placeholder.png')}
      />
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.storeDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.storeLocation}>
          <Ionicons name="location" size={16} color={theme.colors.placeholder} />
          <Text style={styles.locationText}>
            {item.address}, {item.city}
          </Text>
        </View>
        <View style={styles.storeFooter}>
          <View style={styles.storeRating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.rating?.average?.toFixed(1) || 'N/A'}
            </Text>
            <Text style={styles.reviewCount}>
              ({item.rating?.count || 0})
            </Text>
          </View>
          <View style={styles.storeContact}>
            {item.phone && (
              <Ionicons name="call" size={16} color={theme.colors.primary} />
            )}
            {item.whatsapp && (
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront" size={64} color={theme.colors.placeholder} />
      <Text style={styles.emptyText}>{t('stores.noStores')}</Text>
      <Text style={styles.emptySubtext}>{t('home.tryAgain')}</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>{t('navigation.stores')}</Text>
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortMenuVisible(true)}
            >
              <Ionicons name="filter" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={() => handleSort('newest')}
            title={t('products.sortOptions.newest')}
          />
          <Menu.Item
            onPress={() => handleSort('oldest')}
            title={t('products.sortOptions.oldest')}
          />
          <Menu.Item
            onPress={() => handleSort('rating')}
            title={t('products.sortOptions.rating')}
          />
          <Menu.Item
            onPress={() => handleSort('name')}
            title={t('stores.sortByName')}
          />
        </Menu>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('stores.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />
      </View>

      {/* Stores List */}
      <FlatList
        data={stores}
        renderItem={({ item }) => <StoreItem item={item} />}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={stores.length === 0 ? styles.emptyList : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading Overlay */}
      {loading && page === 1 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  sortButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    elevation: 2,
    ...theme.shadows.small,
  },
  storeItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  storeImage: {
    width: 100,
    height: 120,
    backgroundColor: theme.colors.neutral[100],
  },
  storeInfo: {
    flex: 1,
    padding: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 8,
  },
  storeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginLeft: 4,
    flex: 1,
  },
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginLeft: 4,
  },
  storeContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
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
});