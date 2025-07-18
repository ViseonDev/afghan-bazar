import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Searchbar, Card, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FlatList } from 'react-native-gesture-handler';
import { theme } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { productsAPI, storesAPI, categoriesAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [categoriesRes, productsRes, storesRes] = await Promise.all([
        categoriesAPI.getFeaturedCategories(),
        productsAPI.getProducts({ featured: true, limit: 6 }),
        storesAPI.getStores({ featured: true, limit: 6 }),
      ]);

      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
      
      if (productsRes.success) {
        setFeaturedProducts(productsRes.data);
      }
      
      if (storesRes.success) {
        setFeaturedStores(storesRes.data);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('ProductList', { search: searchQuery.trim() });
    }
  };

  const CategoryCard = ({ category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('ProductList', { category: category.slug })}
    >
      <View style={styles.categoryIconContainer}>
        {category.icon ? (
          <Image source={{ uri: category.icon }} style={styles.categoryIcon} />
        ) : (
          <Ionicons name="grid" size={24} color={theme.colors.primary} />
        )}
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const ProductCard = ({ product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { id: product._id })}
    >
      <Image
        source={{ uri: product.primaryImage || product.images?.[0] }}
        style={styles.productImage}
        defaultSource={require('../../assets/placeholder.png')}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productStore} numberOfLines={1}>
          {product.storeId?.name}
        </Text>
        {product.price && (
          <Text style={styles.productPrice}>
            {product.price} {t('currency.afn')}
          </Text>
        )}
        <View style={styles.productRating}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>
            {product.rating?.average?.toFixed(1) || 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const StoreCard = ({ store }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => navigation.navigate('StoreDetail', { id: store._id })}
    >
      <Image
        source={{ uri: store.coverImage || store.images?.[0] }}
        style={styles.storeImage}
        defaultSource={require('../../assets/placeholder.png')}
      />
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={2}>
          {store.name}
        </Text>
        <Text style={styles.storeLocation} numberOfLines={1}>
          {store.city}
        </Text>
        <View style={styles.storeRating}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>
            {store.rating?.average?.toFixed(1) || 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            {user ? `${t('common.hello')} ${user.name}` : t('auth.welcomeTitle')}
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => navigation.navigate(user ? 'Profile' : 'Login')}
          >
            <Ionicons
              name={user ? 'person' : 'log-in'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchBar}
            icon="magnify"
            clearIcon="close"
            onClearIconPress={() => setSearchQuery('')}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('navigation.categories')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Categories')}
            >
              <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={categories}
            renderItem={({ item }) => <CategoryCard category={item} />}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.featuredProducts')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductList', { featured: true })}
            >
              <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={featuredProducts}
            renderItem={({ item }) => <ProductCard product={item} />}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsContainer}
          />
        </View>

        {/* Featured Stores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.featuredStores')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('StoreList', { featured: true })}
            >
              <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={featuredStores}
            renderItem={({ item }) => <StoreCard store={item} />}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storesContainer}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {user && user.role === 'merchant' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('MerchantDashboard')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  authButton: {
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.surface,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...theme.shadows.small,
  },
  categoryIcon: {
    width: 30,
    height: 30,
  },
  categoryName: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  productsContainer: {
    paddingHorizontal: 16,
  },
  productCard: {
    width: 150,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.neutral[100],
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productStore: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: 4,
  },
  storesContainer: {
    paddingHorizontal: 16,
  },
  storeCard: {
    width: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  storeImage: {
    width: '100%',
    height: 100,
    backgroundColor: theme.colors.neutral[100],
  },
  storeInfo: {
    padding: 12,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  storeLocation: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});