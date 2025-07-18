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
import { Searchbar, Card, Chip, FAB, Menu, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { productsAPI } from '../../services/api';

export default function ProductListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(route.params?.search || '');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadProducts(true);
  }, [route.params]);

  const loadProducts = async (reset = false) => {
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

      const response = await productsAPI.getProducts(params);
      
      if (response.success) {
        const newProducts = response.data;
        setProducts(reset ? newProducts : [...products, ...newProducts]);
        setHasMore(response.pagination.page < response.pagination.pages);
        if (!reset) setPage(page + 1);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadProducts(false);
    }
  };

  const handleSearch = () => {
    loadProducts(true);
  };

  const handleSort = (newSortBy) => {
    setSortBy(newSortBy);
    setSortMenuVisible(false);
    // Reload products with new sort
    setTimeout(() => loadProducts(true), 100);
  };

  const ProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigation.navigate('ProductDetail', { id: item._id })}
    >
      <Image
        source={{ uri: item.primaryImage || item.images?.[0] }}
        style={styles.productImage}
        defaultSource={require('../../../assets/placeholder.png')}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productStore} numberOfLines={1}>
          {item.storeId?.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.price && (
          <Text style={styles.productPrice}>
            {item.price} {t('currency.afn')}
          </Text>
        )}
        <View style={styles.productFooter}>
          <View style={styles.productRating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.rating?.average?.toFixed(1) || 'N/A'}
            </Text>
          </View>
          <Text style={styles.productLocation}>
            {item.storeId?.city}
          </Text>
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
      <Ionicons name="search" size={64} color={theme.colors.placeholder} />
      <Text style={styles.emptyText}>{t('products.noProducts')}</Text>
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
        <Text style={styles.headerTitle}>{t('navigation.products')}</Text>
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
            onPress={() => handleSort('price_asc')}
            title={t('products.sortOptions.priceLowToHigh')}
          />
          <Menu.Item
            onPress={() => handleSort('price_desc')}
            title={t('products.sortOptions.priceHighToLow')}
          />
          <Menu.Item
            onPress={() => handleSort('rating')}
            title={t('products.sortOptions.rating')}
          />
          <Menu.Item
            onPress={() => handleSort('popular')}
            title={t('products.sortOptions.popular')}
          />
        </Menu>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('products.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductItem item={item} />}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={products.length === 0 ? styles.emptyList : null}
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
  productItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  productImage: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.neutral[100],
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productStore: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 4,
  },
  productLocation: {
    fontSize: 12,
    color: theme.colors.placeholder,
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