import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Chip,
  FAB,
  Menu,
  Divider,
  Searchbar,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { productsAPI } from '../../services/api';

export default function ManageProductsScreen() {
  const navigation = useNavigation();
  const { t, formatDate } = useLanguage();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [selectedTab]),
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        populate: 'storeId category',
        search: searchQuery,
      };

      if (selectedTab !== 'all') {
        params.isActive = selectedTab === 'active';
      }

      const response = await productsAPI.getProducts(params);

      if (response.success) {
        // Filter products owned by current user's stores
        const userProducts = response.data.filter(
          (product) => product.storeId?.owner === user._id,
        );
        setProducts(userProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert(t('common.error'), t('merchant.errorLoadingProducts'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Debounce search
    setTimeout(() => {
      loadProducts();
    }, 500);
  };

  const handleCreateProduct = () => {
    navigation.navigate('CreateProduct');
  };

  const handleEditProduct = (productId) => {
    navigation.navigate('EditProduct', { productId });
  };

  const handleViewProduct = (productId) => {
    navigation.navigate('ProductDetail', { id: productId });
  };

  const handleDeleteProduct = (productId, productName) => {
    Alert.alert(
      t('merchant.deleteProduct'),
      t('merchant.deleteProductConfirm', { name: productName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await productsAPI.deleteProduct(productId);
              setProducts(
                products.filter((product) => product._id !== productId),
              );
              Alert.alert(t('common.success'), t('merchant.productDeleted'));
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert(
                t('common.error'),
                t('merchant.errorDeletingProduct'),
              );
            }
          },
        },
      ],
    );
  };

  const handleToggleProductStatus = async (productId, currentStatus) => {
    try {
      const response = await productsAPI.updateProduct(productId, {
        isActive: !currentStatus,
      });

      if (response.success) {
        setProducts(
          products.map((product) =>
            product._id === productId
              ? { ...product, isActive: !currentStatus }
              : product,
          ),
        );
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert(t('common.error'), t('merchant.errorUpdatingStatus'));
    }
  };

  const handleDuplicateProduct = async (productId) => {
    try {
      const response = await productsAPI.duplicateProduct(productId);

      if (response.success) {
        setProducts([response.data, ...products]);
        Alert.alert(t('common.success'), t('merchant.productDuplicated'));
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      Alert.alert(t('common.error'), t('merchant.errorDuplicatingProduct'));
    }
  };

  const toggleMenu = (productId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const getStatusColor = (isActive) => {
    return isActive ? theme.colors.primary : theme.colors.error;
  };

  const getStatusText = (isActive) => {
    return isActive ? t('merchant.active') : t('merchant.inactive');
  };

  const getStockStatus = (stock) => {
    if (stock === 0)
      return { text: t('merchant.outOfStock'), color: theme.colors.error };
    if (stock < 10)
      return { text: t('merchant.lowStock'), color: theme.colors.accent };
    return { text: t('merchant.inStock'), color: theme.colors.primary };
  };

  const ProductItem = ({ item }) => {
    const stockStatus = getStockStatus(item.stock);

    return (
      <Card style={styles.productItem}>
        <Card.Content>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Image
                source={{ uri: item.primaryImage || item.images?.[0] }}
                style={styles.productImage}
                defaultSource={require('../../../assets/placeholder.png')}
              />
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.productMeta}>
                  <Text style={styles.productPrice}>
                    {item.price} {t('currency.afn')}
                  </Text>
                  <Text style={styles.productStore}>{item.storeId?.name}</Text>
                </View>
              </View>
            </View>

            <Menu
              visible={menuVisible[item._id]}
              onDismiss={() => toggleMenu(item._id)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => toggleMenu(item._id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  toggleMenu(item._id);
                  handleViewProduct(item._id);
                }}
                title={t('common.view')}
                leadingIcon="eye"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item._id);
                  handleEditProduct(item._id);
                }}
                title={t('common.edit')}
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item._id);
                  handleDuplicateProduct(item._id);
                }}
                title={t('merchant.duplicate')}
                leadingIcon="content-copy"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item._id);
                  handleToggleProductStatus(item._id, item.isActive);
                }}
                title={
                  item.isActive
                    ? t('merchant.deactivate')
                    : t('merchant.activate')
                }
                leadingIcon={item.isActive ? 'pause' : 'play'}
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item._id);
                  handleDeleteProduct(item._id, item.name);
                }}
                title={t('common.delete')}
                leadingIcon="delete"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>

          <View style={styles.productStats}>
            <View style={styles.statItem}>
              <Ionicons
                name="cube"
                size={16}
                color={theme.colors.placeholder}
              />
              <Text style={styles.statText}>
                {item.stock} {t('merchant.inStock')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={16} color={theme.colors.placeholder} />
              <Text style={styles.statText}>
                {item.views || 0} {t('merchant.views')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name="star"
                size={16}
                color={theme.colors.placeholder}
              />
              <Text style={styles.statText}>
                {item.rating?.average?.toFixed(1) || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.productFooter}>
            <View style={styles.productChips}>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(item.isActive) + '20' },
                ]}
                textStyle={[
                  styles.statusChipText,
                  { color: getStatusColor(item.isActive) },
                ]}
                compact
              >
                {getStatusText(item.isActive)}
              </Chip>
              <Chip
                mode="flat"
                style={[
                  styles.stockChip,
                  { backgroundColor: stockStatus.color + '20' },
                ]}
                textStyle={[styles.stockChipText, { color: stockStatus.color }]}
                compact
              >
                {stockStatus.text}
              </Chip>
            </View>
          </View>

          <View style={styles.productActions}>
            <Button
              mode="outlined"
              onPress={() => handleViewProduct(item._id)}
              style={styles.actionButton}
              compact
            >
              {t('common.view')}
            </Button>
            <Button
              mode="contained"
              onPress={() => handleEditProduct(item._id)}
              style={styles.actionButton}
              compact
            >
              {t('common.edit')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="package" size={64} color={theme.colors.placeholder} />
      <Text style={styles.emptyText}>{t('merchant.noProducts')}</Text>
      <Text style={styles.emptySubtext}>{t('merchant.addFirstProduct')}</Text>
      <Button
        mode="contained"
        onPress={handleCreateProduct}
        style={styles.createButton}
        icon="plus"
      >
        {t('merchant.addProduct')}
      </Button>
    </View>
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      selectedTab === 'all' ||
      (selectedTab === 'active' && product.isActive) ||
      (selectedTab === 'inactive' && !product.isActive);
    return matchesSearch && matchesTab;
  });

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
        <Text style={styles.headerTitle}>{t('merchant.manageProducts')}</Text>
        <IconButton icon="refresh" size={24} onPress={handleRefresh} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('merchant.searchProducts')}
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />
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
              icon: 'package',
            },
            {
              value: 'active',
              label: t('merchant.active'),
              icon: 'play',
            },
            {
              value: 'inactive',
              label: t('merchant.inactive'),
              icon: 'pause',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => <ProductItem item={item} />}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={
          filteredProducts.length === 0
            ? styles.emptyList
            : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreateProduct}
        label={t('merchant.addProduct')}
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    elevation: 2,
    ...theme.shadows.small,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
  },
  listContainer: {
    paddingBottom: 80,
  },
  productItem: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[100],
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  productStore: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginLeft: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productChips: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockChip: {
    height: 28,
  },
  stockChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
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
    marginBottom: 24,
  },
  createButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
