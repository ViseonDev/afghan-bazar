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
import { Button, Card, Chip, FAB, ActivityIndicator, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { productsAPI, favoritesAPI, flagsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
    if (user) {
      checkFavoriteStatus();
    }
  }, [route.params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(route.params.id);
      
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert(t('common.error'), t('errors.productNotFound'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoritesAPI.checkFavorite('product', route.params.id);
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
        await favoritesAPI.removeByTarget('product', route.params.id);
        setIsFavorite(false);
      } else {
        await favoritesAPI.addToFavorites('product', route.params.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} - ${product.description}`,
        url: `https://afghanbazar.com/product/${product._id}`,
      });
    } catch (error) {
      console.error('Error sharing product:', error);
    }
  };

  const handleCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleWhatsApp = (phoneNumber) => {
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      `Hi, I'm interested in your product: ${product.name}`
    )}`;
    Linking.openURL(url);
  };

  const handleReport = () => {
    if (!user) {
      Alert.alert(t('common.error'), t('auth.loginRequired'));
      return;
    }

    Alert.alert(
      t('products.reportProduct'),
      t('common.reportConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await flagsAPI.createFlag({
                targetType: 'product',
                targetId: product._id,
                reason: 'inappropriate_content',
                description: 'Reported from product detail screen',
              });
              Alert.alert(t('common.success'), t('common.reportSubmitted'));
            } catch (error) {
              console.error('Error reporting product:', error);
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
      storeId: product.storeId._id,
      storeName: product.storeId.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('products.productNotFound')}</Text>
        <Button onPress={() => navigation.goBack()}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  const images = product.images || [];

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
                style={styles.productImage}
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

        {/* Product Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.priceContainer}>
              {product.price && (
                <Text style={styles.productPrice}>
                  {product.price} {t('currency.afn')}
                </Text>
              )}
              <Text style={styles.currency}>{product.currency}</Text>
            </View>

            <View style={styles.ratingContainer}>
              <View style={styles.rating}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {product.rating?.average?.toFixed(1) || 'N/A'}
                </Text>
                <Text style={styles.reviewCount}>
                  ({product.rating?.count || 0} {t('common.reviews')})
                </Text>
              </View>
              <Text style={styles.views}>
                {product.views || 0} {t('common.views')}
              </Text>
            </View>

            <View style={styles.categoryContainer}>
              <Chip icon="tag" mode="outlined" style={styles.categoryChip}>
                {product.category}
              </Chip>
              {product.subcategory && (
                <Chip icon="tag-outline" mode="outlined" style={styles.categoryChip}>
                  {product.subcategory}
                </Chip>
              )}
            </View>

            <View style={styles.availabilityContainer}>
              <Ionicons
                name={product.stock?.available ? "checkmark-circle" : "close-circle"}
                size={20}
                color={product.stock?.available ? theme.colors.success : theme.colors.error}
              />
              <Text style={[
                styles.availabilityText,
                { color: product.stock?.available ? theme.colors.success : theme.colors.error }
              ]}>
                {product.stock?.available ? t('products.availability') : t('products.unavailable')}
              </Text>
            </View>

            <Text style={styles.description}>{product.description}</Text>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <View style={styles.specificationsContainer}>
                <Text style={styles.sectionTitle}>{t('products.specifications')}</Text>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <View key={key} style={styles.specItem}>
                    <Text style={styles.specKey}>{key}:</Text>
                    <Text style={styles.specValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Store Info */}
        <Card style={styles.storeCard}>
          <Card.Content>
            <TouchableOpacity
              style={styles.storeHeader}
              onPress={() => navigation.navigate('StoreDetail', { id: product.storeId._id })}
            >
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{product.storeId.name}</Text>
                <Text style={styles.storeLocation}>
                  {product.storeId.address}, {product.storeId.city}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>

            <View style={styles.contactButtons}>
              {product.storeId.phone && (
                <Button
                  mode="outlined"
                  icon="call"
                  onPress={() => handleCall(product.storeId.phone)}
                  style={styles.contactButton}
                >
                  {t('common.call')}
                </Button>
              )}
              
              {product.storeId.whatsapp && (
                <Button
                  mode="outlined"
                  icon="message"
                  onPress={() => handleWhatsApp(product.storeId.whatsapp)}
                  style={styles.contactButton}
                >
                  WhatsApp
                </Button>
              )}
              
              {user && (
                <Button
                  mode="contained"
                  icon="chat"
                  onPress={handleChat}
                  style={styles.contactButton}
                >
                  {t('common.message')}
                </Button>
              )}
            </View>
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
  productImage: {
    width: width,
    height: 300,
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
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  currency: {
    fontSize: 16,
    color: theme.colors.placeholder,
    marginLeft: 8,
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
  views: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    marginBottom: 16,
  },
  specificationsContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  specKey: {
    fontSize: 14,
    color: theme.colors.placeholder,
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  storeCard: {
    margin: 16,
    marginTop: 0,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  storeLocation: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  contactButton: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
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