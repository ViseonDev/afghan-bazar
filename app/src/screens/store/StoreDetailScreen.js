import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { Button, Card, Chip, FAB, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FlatList } from 'react-native-gesture-handler';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storesAPI, favoritesAPI, flagsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function StoreDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadStore();
    if (user) {
      checkFavoriteStatus();
    }
  }, [route.params.id]);

  const loadStore = async () => {
    try {
      setLoading(true);
      const response = await storesAPI.getStore(route.params.id);
      
      if (response.success) {
        setStore(response.data.store);
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Error loading store:', error);
      Alert.alert(t('common.error'), t('errors.storeNotFound'));
      navigation.goBack();
    } finally {
      setLoading(false);
      setProductsLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoritesAPI.checkFavorite('store', route.params.id);
      if (response.success) {
        setIsFavorite(response.isFavorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('auth.loginRequired'));
      return;
    }

    try {
      if (isFavorite) {
        await favoritesAPI.removeByTarget('store', route.params.id);
        setIsFavorite(false);
      } else {
        await favoritesAPI.addToFavorites('store', route.params.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${store.name} - ${store.description}`,
        url: `https://afghanbazar.com/store/${store._id}`,
      });
    } catch (error) {
      console.error('Error sharing store:', error);
    }
  };

  const handleCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleWhatsApp = (phoneNumber) => {
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      `Hi, I'm interested in your store: ${store.name}`
    )}`;
    Linking.openURL(url);
  };

  const handleEmail = (email) => {
    const url = `mailto:${email}`;
    Linking.openURL(url);
  };

  const handleDirections = () => {
    if (store.coordinates?.latitude && store.coordinates?.longitude) {
      const url = `https://maps.google.com/maps?daddr=${store.coordinates.latitude},${store.coordinates.longitude}`;
      Linking.openURL(url);
    } else {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(store.address + ', ' + store.city)}`;
      Linking.openURL(url);
    }
  };

  const handleReport = () => {
    if (!user) {
      Alert.alert(t('common.error'), t('auth.loginRequired'));
      return;
    }

    Alert.alert(
      t('stores.reportStore'),
      t('common.reportConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await flagsAPI.createFlag({
                targetType: 'store',
                targetId: store._id,
                reason: 'inappropriate_content',
                description: 'Reported from store detail screen',
              });
              Alert.alert(t('common.success'), t('common.reportSubmitted'));
            } catch (error) {
              console.error('Error reporting store:', error);
              Alert.alert(t('common.error'), t('errors.reportFailed'));
            }
          },
        },
      ]
    );
  };

  const handleChat = () => {
    if (!user) {
      Alert.alert(t('common.error'), t('auth.loginRequired'));
      return;
    }

    navigation.navigate('Chat', { 
      storeId: store._id,
      storeName: store.name,
    });
  };

  const formatBusinessHours = (hours) => {
    if (!hours) return null;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => {
      const dayHours = hours[day];
      if (!dayHours || !dayHours.open || !dayHours.close) return null;
      
      return (
        <View key={day} style={styles.businessHourRow}>
          <Text style={styles.dayText}>{t(`days.${day}`)}</Text>
          <Text style={styles.hourText}>{dayHours.open} - {dayHours.close}</Text>
        </View>
      );
    }).filter(Boolean);
  };

  const ProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
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
        {item.price && (
          <Text style={styles.productPrice}>
            {item.price} {t('currency.afn')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('stores.storeNotFound')}</Text>
        <Button onPress={() => navigation.goBack()}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  const images = store.images || [];

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
        <View style={styles.headerActions}>
          <IconButton
            icon="share"
            size={24}
            onPress={handleShare}
          />
          <IconButton
            icon={isFavorite ? "heart" : "heart-outline"}
            size={24}
            iconColor={isFavorite ? theme.colors.error : theme.colors.text}
            onPress={toggleFavorite}
          />
          <IconButton
            icon="flag"
            size={24}
            onPress={handleReport}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.floor(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.storeImage}
                defaultSource={require('../../../assets/placeholder.png')}
              />
            ))}
          </ScrollView>
          
          {images.length > 1 && (
            <View style={styles.imageIndicator}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Store Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.storeName}>{store.name}</Text>
            
            <View style={styles.ratingContainer}>
              <View style={styles.rating}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {store.rating?.average?.toFixed(1) || 'N/A'}
                </Text>
                <Text style={styles.reviewCount}>
                  ({store.rating?.count || 0} {t('common.reviews')})
                </Text>
              </View>
              {store.isFeatured && (
                <Chip icon="star" mode="outlined" textStyle={styles.featuredChip}>
                  {t('admin.featured')}
                </Chip>
              )}
            </View>

            <Text style={styles.description}>{store.description}</Text>

            {/* Location */}
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <View style={styles.locationInfo}>
                <Text style={styles.address}>{store.address}</Text>
                <Text style={styles.city}>{store.city}</Text>
              </View>
            </View>

            {/* Contact Actions */}
            <View style={styles.contactButtons}>
              {store.phone && (
                <Button
                  mode="outlined"
                  icon="call"
                  onPress={() => handleCall(store.phone)}
                  style={styles.contactButton}
                >
                  {t('common.call')}
                </Button>
              )}
              
              {store.whatsapp && (
                <Button
                  mode="outlined"
                  icon="message"
                  onPress={() => handleWhatsApp(store.whatsapp)}
                  style={styles.contactButton}
                >
                  WhatsApp
                </Button>
              )}
              
              <Button
                mode="outlined"
                icon="map"
                onPress={handleDirections}
                style={styles.contactButton}
              >
                {t('stores.getDirections')}
              </Button>
            </View>

            {user && (
              <Button
                mode="contained"
                icon="chat"
                onPress={handleChat}
                style={styles.chatButton}
              >
                {t('stores.chatWithMerchant')}
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Contact Information */}
        <Card style={styles.contactCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('stores.contactInfo')}</Text>
            
            {store.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText}>{store.phone}</Text>
              </View>
            )}
            
            {store.whatsapp && (
              <View style={styles.contactItem}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.contactText}>{store.whatsapp}</Text>
              </View>
            )}
            
            {store.email && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleEmail(store.email)}
              >
                <Ionicons name="mail" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText}>{store.email}</Text>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>

        {/* Business Hours */}
        {store.businessHours && (
          <Card style={styles.hoursCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('stores.businessHours')}</Text>
              <View style={styles.businessHours}>
                {formatBusinessHours(store.businessHours)}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Store Products */}
        <Card style={styles.productsCard}>
          <Card.Content>
            <View style={styles.productsHeader}>
              <Text style={styles.sectionTitle}>{t('stores.storeProducts')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProductList', { storeId: store._id })}
              >
                <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            
            {productsLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <FlatList
                data={products}
                renderItem={({ item }) => <ProductCard item={item} />}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productsContainer}
                ListEmptyComponent={
                  <Text style={styles.noProductsText}>{t('stores.noProducts')}</Text>
                }
              />
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  storeImage: {
    width: width,
    height: 250,
    backgroundColor: theme.colors.neutral[100],
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: theme.colors.primary,
  },
  infoCard: {
    margin: 16,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginLeft: 4,
  },
  featuredChip: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationInfo: {
    marginLeft: 8,
    flex: 1,
  },
  address: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  contactButton: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  chatButton: {
    width: '100%',
  },
  contactCard: {
    margin: 16,
    marginTop: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  hoursCard: {
    margin: 16,
    marginTop: 0,
  },
  businessHours: {
    marginTop: 8,
  },
  businessHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dayText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  hourText: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  productsCard: {
    margin: 16,
    marginTop: 0,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  productsContainer: {
    paddingVertical: 8,
  },
  productCard: {
    width: 120,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 80,
    backgroundColor: theme.colors.neutral[100],
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  noProductsText: {
    fontSize: 14,
    color: theme.colors.placeholder,
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
});