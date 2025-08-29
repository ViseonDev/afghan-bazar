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
import {
  Card,
  Chip,
  FAB,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { t, formatDate } = useLanguage();
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadHistory();
      }
    }, [user, selectedTab]),
  );

  const loadHistory = async () => {
    try {
      setLoading(true);

      const params = {};
      if (selectedTab !== 'all') {
        params.targetType = selectedTab;
      }

      const response = await usersAPI.getHistory(params);

      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleClearHistory = () => {
    Alert.alert(t('history.clearHistory'), t('history.clearHistoryConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          try {
            await usersAPI.clearHistory();
            setHistory([]);
          } catch (error) {
            console.error('Error clearing history:', error);
            Alert.alert(t('common.error'), t('history.errorClearing'));
          }
        },
      },
    ]);
  };

  const handleItemPress = (item) => {
    if (item.targetType === 'product') {
      navigation.navigate('ProductDetail', { id: item.targetId });
    } else if (item.targetType === 'store') {
      navigation.navigate('StoreDetail', { id: item.targetId });
    }
  };

  const HistoryItem = ({ item }) => {
    const target = item.target;
    if (!target) return null;

    const isProduct = item.targetType === 'product';
    const imageSource = isProduct
      ? target.primaryImage || target.images?.[0]
      : target.coverImage || target.images?.[0];

    return (
      <TouchableOpacity
        style={styles.historyItem}
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
            <Text style={styles.viewedAt}>
              {formatDate(item.viewedAt, 'short')}
            </Text>
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
        name="time-outline"
        size={64}
        color={theme.colors.placeholder}
      />
      <Text style={styles.emptyText}>{t('history.noHistory')}</Text>
      <Text style={styles.emptySubtext}>{t('history.browseToSeeHistory')}</Text>
    </View>
  );

  const filteredHistory = history.filter((item) => {
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
        <IconButton
          icon="delete"
          size={24}
          onPress={handleClearHistory}
          disabled={history.length === 0}
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
              icon: 'time',
            },
            {
              value: 'product',
              label: t('history.products'),
              icon: 'package',
            },
            {
              value: 'store',
              label: t('history.stores'),
              icon: 'storefront',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={({ item }) => <HistoryItem item={item} />}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={
          filteredHistory.length === 0 ? styles.emptyList : styles.listContainer
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
  historyItem: {
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
  viewedAt: {
    fontSize: 12,
    color: theme.colors.placeholder,
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
