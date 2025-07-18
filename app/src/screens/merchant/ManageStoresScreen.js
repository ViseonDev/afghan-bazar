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
import { Card, Button, IconButton, Chip, FAB, Menu, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storesAPI } from '../../services/api';

export default function ManageStoresScreen() {
  const navigation = useNavigation();
  const { t, formatDate } = useLanguage();
  const { user } = useAuth();
  
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState({});

  useFocusEffect(
    React.useCallback(() => {
      loadStores();
    }, [])
  );

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await storesAPI.getStores({ 
        owner: user._id,
        populate: 'products',
      });
      
      if (response.success) {
        setStores(response.data);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      Alert.alert(t('common.error'), t('merchant.errorLoadingStores'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStores();
  };

  const handleCreateStore = () => {
    navigation.navigate('CreateStore');
  };

  const handleEditStore = (storeId) => {
    navigation.navigate('EditStore', { storeId });
  };

  const handleViewStore = (storeId) => {
    navigation.navigate('StoreDetail', { id: storeId });
  };

  const handleDeleteStore = (storeId, storeName) => {
    Alert.alert(
      t('merchant.deleteStore'),
      t('merchant.deleteStoreConfirm', { name: storeName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await storesAPI.deleteStore(storeId);
              setStores(stores.filter(store => store._id !== storeId));
              Alert.alert(t('common.success'), t('merchant.storeDeleted'));
            } catch (error) {
              console.error('Error deleting store:', error);
              Alert.alert(t('common.error'), t('merchant.errorDeletingStore'));
            }
          },
        },
      ]
    );
  };

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    try {
      const response = await storesAPI.updateStore(storeId, {
        isActive: !currentStatus,
      });
      
      if (response.success) {
        setStores(stores.map(store => 
          store._id === storeId 
            ? { ...store, isActive: !currentStatus }
            : store
        ));
      }
    } catch (error) {
      console.error('Error updating store status:', error);
      Alert.alert(t('common.error'), t('merchant.errorUpdatingStatus'));
    }
  };

  const toggleMenu = (storeId) => {
    setMenuVisible(prev => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.colors.primary;
      case 'inactive': return theme.colors.error;
      case 'pending': return theme.colors.accent;
      default: return theme.colors.placeholder;
    }
  };

  const getStatusText = (isActive) => {
    return isActive ? t('merchant.active') : t('merchant.inactive');
  };

  const StoreItem = ({ item }) => (
    <Card style={styles.storeItem}>
      <Card.Content>
        <View style={styles.storeHeader}>
          <View style={styles.storeInfo}>
            <Image
              source={{ uri: item.coverImage || item.images?.[0] }}
              style={styles.storeImage}
              defaultSource={require('../../../assets/placeholder.png')}
            />
            <View style={styles.storeDetails}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.storeDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.storeStats}>
                <Chip
                  icon="package"
                  mode="outlined"
                  compact
                  style={styles.statChip}
                  textStyle={styles.statChipText}
                >
                  {item.products?.length || 0} {t('merchant.products')}
                </Chip>
                <Chip
                  icon="star"
                  mode="outlined"
                  compact
                  style={styles.statChip}
                  textStyle={styles.statChipText}
                >
                  {item.rating?.average?.toFixed(1) || 'N/A'}
                </Chip>
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
                handleViewStore(item._id);
              }}
              title={t('common.view')}
              leadingIcon="eye"
            />
            <Menu.Item
              onPress={() => {
                toggleMenu(item._id);
                handleEditStore(item._id);
              }}
              title={t('common.edit')}
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                toggleMenu(item._id);
                handleToggleStoreStatus(item._id, item.isActive);
              }}
              title={item.isActive ? t('merchant.deactivate') : t('merchant.activate')}
              leadingIcon={item.isActive ? 'pause' : 'play'}
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                toggleMenu(item._id);
                handleDeleteStore(item._id, item.name);
              }}
              title={t('common.delete')}
              leadingIcon="delete"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </View>
        
        <View style={styles.storeFooter}>
          <View style={styles.storeLocation}>
            <Ionicons name="location" size={14} color={theme.colors.placeholder} />
            <Text style={styles.locationText}>
              {item.address?.city}, {item.address?.province}
            </Text>
          </View>
          
          <View style={styles.storeStatus}>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.isActive ? 'active' : 'inactive') + '20' }]}
              textStyle={[styles.statusChipText, { color: getStatusColor(item.isActive ? 'active' : 'inactive') }]}
            >
              {getStatusText(item.isActive)}
            </Chip>
          </View>
        </View>
        
        <View style={styles.storeActions}>
          <Button
            mode="outlined"
            onPress={() => handleViewStore(item._id)}
            style={styles.actionButton}
            compact
          >
            {t('common.view')}
          </Button>
          <Button
            mode="contained"
            onPress={() => handleEditStore(item._id)}
            style={styles.actionButton}
            compact
          >
            {t('common.edit')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront" size={64} color={theme.colors.placeholder} />
      <Text style={styles.emptyText}>{t('merchant.noStores')}</Text>
      <Text style={styles.emptySubtext}>{t('merchant.createFirstStore')}</Text>
      <Button
        mode="contained"
        onPress={handleCreateStore}
        style={styles.createButton}
        icon="plus"
      >
        {t('merchant.createStore')}
      </Button>
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
        <Text style={styles.headerTitle}>{t('merchant.manageStores')}</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleRefresh}
        />
      </View>

      {/* Store List */}
      <FlatList
        data={stores}
        renderItem={({ item }) => <StoreItem item={item} />}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={stores.length === 0 ? styles.emptyList : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreateStore}
        label={t('merchant.createStore')}
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
  listContainer: {
    paddingBottom: 80,
  },
  storeItem: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  storeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[100],
    marginRight: 12,
  },
  storeDetails: {
    flex: 1,
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
  storeStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    height: 28,
  },
  statChipText: {
    fontSize: 12,
  },
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginLeft: 4,
  },
  storeStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  storeActions: {
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