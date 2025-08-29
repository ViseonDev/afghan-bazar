import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Chip,
  HelperText,
  SegmentedButtons,
  Switch,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { productsAPI, categoriesAPI, storesAPI } from '../../services/api';
import ImageUploader from '../../components/ImageUploader';

export default function CreateProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { user } = useAuth();

  const isEditing = route.params?.productId;
  const productId = route.params?.productId;
  const preselectedStore = route.params?.storeId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    storeId: preselectedStore || '',
    stock: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
    },
    tags: [],
    isActive: true,
    isFeatured: false,
    primaryImage: null,
    images: [],
    specifications: [],
    variants: [],
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedTab, setSelectedTab] = useState('basic');
  const [newTag, setNewTag] = useState('');
  const [newSpec, setNewSpec] = useState({ name: '', value: '' });

  useEffect(() => {
    loadCategories();
    loadStores();
    if (isEditing) {
      loadProductData();
    }
  }, [isEditing]);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStores = async () => {
    try {
      const response = await storesAPI.getStores({ owner: user._id });
      if (response.success) {
        setStores(response.data);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadProductData = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(productId);

      if (response.success) {
        setFormData({
          ...response.data,
          category: response.data.category?._id || '',
          storeId: response.data.storeId?._id || '',
          price: response.data.price?.toString() || '',
          originalPrice: response.data.originalPrice?.toString() || '',
          stock: response.data.stock?.toString() || '',
          weight: response.data.weight?.toString() || '',
          dimensions: response.data.dimensions || {
            length: '',
            width: '',
            height: '',
          },
        });
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      Alert.alert(t('common.error'), t('merchant.errorLoadingProduct'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('merchant.nameRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('merchant.descriptionRequired');
    }

    if (!formData.price.trim()) {
      newErrors.price = t('merchant.priceRequired');
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = t('merchant.priceInvalid');
    }

    if (!formData.category) {
      newErrors.category = t('merchant.categoryRequired');
    }

    if (!formData.storeId) {
      newErrors.storeId = t('merchant.storeRequired');
    }

    if (!formData.stock.trim()) {
      newErrors.stock = t('merchant.stockRequired');
    } else if (isNaN(formData.stock) || parseInt(formData.stock, 10) < 0) {
      newErrors.stock = t('merchant.stockInvalid');
    }

    if (
      formData.originalPrice &&
      (isNaN(formData.originalPrice) || parseFloat(formData.originalPrice) <= 0)
    ) {
      newErrors.originalPrice = t('merchant.originalPriceInvalid');
    }

    if (
      formData.weight &&
      (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)
    ) {
      newErrors.weight = t('merchant.weightInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(t('common.error'), t('merchant.pleaseFixErrors'));
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : null,
        stock: parseInt(formData.stock, 10),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: {
          length: formData.dimensions.length
            ? parseFloat(formData.dimensions.length)
            : null,
          width: formData.dimensions.width
            ? parseFloat(formData.dimensions.width)
            : null,
          height: formData.dimensions.height
            ? parseFloat(formData.dimensions.height)
            : null,
        },
      };

      let response;
      if (isEditing) {
        response = await productsAPI.updateProduct(productId, submitData);
      } else {
        response = await productsAPI.createProduct(submitData);
      }

      if (response.success) {
        Alert.alert(
          t('common.success'),
          isEditing
            ? t('merchant.productUpdated')
            : t('merchant.productCreated'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert(
          t('common.error'),
          response.message || t('merchant.errorSavingProduct'),
        );
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert(t('common.error'), t('merchant.errorSavingProduct'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (images) => {
    setFormData((prev) => ({
      ...prev,
      images: images,
      primaryImage: images[0] || null,
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addSpecification = () => {
    if (newSpec.name.trim() && newSpec.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: [...prev.specifications, { ...newSpec }],
      }));
      setNewSpec({ name: '', value: '' });
    }
  };

  const removeSpecification = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('merchant.basicInformation')}</Text>

      <TextInput
        label={t('merchant.productName')}
        value={formData.name}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, name: text }))
        }
        style={styles.input}
        error={!!errors.name}
        mode="outlined"
      />
      <HelperText type="error" visible={!!errors.name}>
        {errors.name}
      </HelperText>

      <TextInput
        label={t('merchant.description')}
        value={formData.description}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, description: text }))
        }
        style={styles.input}
        error={!!errors.description}
        mode="outlined"
        multiline
        numberOfLines={4}
      />
      <HelperText type="error" visible={!!errors.description}>
        {errors.description}
      </HelperText>

      <Text style={styles.label}>{t('merchant.store')}</Text>
      <View style={styles.storeContainer}>
        {stores.map((store) => (
          <Chip
            key={store._id}
            mode={formData.storeId === store._id ? 'flat' : 'outlined'}
            selected={formData.storeId === store._id}
            onPress={() =>
              setFormData((prev) => ({ ...prev, storeId: store._id }))
            }
            style={styles.storeChip}
          >
            {store.name}
          </Chip>
        ))}
      </View>
      <HelperText type="error" visible={!!errors.storeId}>
        {errors.storeId}
      </HelperText>

      <Text style={styles.label}>{t('merchant.category')}</Text>
      <View style={styles.categoryContainer}>
        {categories.map((category) => (
          <Chip
            key={category._id}
            mode={formData.category === category._id ? 'flat' : 'outlined'}
            selected={formData.category === category._id}
            onPress={() =>
              setFormData((prev) => ({ ...prev, category: category._id }))
            }
            style={styles.categoryChip}
          >
            {category.name}
          </Chip>
        ))}
      </View>
      <HelperText type="error" visible={!!errors.category}>
        {errors.category}
      </HelperText>
    </View>
  );

  const renderPricing = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('merchant.pricingInventory')}</Text>

      <View style={styles.row}>
        <TextInput
          label={t('merchant.price')}
          value={formData.price}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, price: text }))
          }
          style={[styles.input, styles.halfWidth]}
          error={!!errors.price}
          mode="outlined"
          keyboardType="numeric"
          right={<TextInput.Affix text={t('currency.afn')} />}
        />
        <TextInput
          label={t('merchant.originalPrice')}
          value={formData.originalPrice}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, originalPrice: text }))
          }
          style={[styles.input, styles.halfWidth]}
          error={!!errors.originalPrice}
          mode="outlined"
          keyboardType="numeric"
          right={<TextInput.Affix text={t('currency.afn')} />}
        />
      </View>

      <View style={styles.row}>
        <TextInput
          label={t('merchant.stock')}
          value={formData.stock}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, stock: text }))
          }
          style={[styles.input, styles.halfWidth]}
          error={!!errors.stock}
          mode="outlined"
          keyboardType="numeric"
        />
        <TextInput
          label={t('merchant.sku')}
          value={formData.sku}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, sku: text }))
          }
          style={[styles.input, styles.halfWidth]}
          mode="outlined"
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('merchant.isActive')}</Text>
        <Switch
          value={formData.isActive}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, isActive: value }))
          }
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('merchant.isFeatured')}</Text>
        <Switch
          value={formData.isFeatured}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, isFeatured: value }))
          }
        />
      </View>
    </View>
  );

  const renderDetails = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('merchant.productDetails')}</Text>

      <TextInput
        label={t('merchant.weight')}
        value={formData.weight}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, weight: text }))
        }
        style={styles.input}
        error={!!errors.weight}
        mode="outlined"
        keyboardType="numeric"
        right={<TextInput.Affix text="kg" />}
      />

      <Text style={styles.label}>{t('merchant.dimensions')}</Text>
      <View style={styles.dimensionsRow}>
        <TextInput
          label={t('merchant.length')}
          value={formData.dimensions.length}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              dimensions: { ...prev.dimensions, length: text },
            }))
          }
          style={[styles.input, styles.dimensionInput]}
          mode="outlined"
          keyboardType="numeric"
          right={<TextInput.Affix text="cm" />}
        />
        <TextInput
          label={t('merchant.width')}
          value={formData.dimensions.width}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              dimensions: { ...prev.dimensions, width: text },
            }))
          }
          style={[styles.input, styles.dimensionInput]}
          mode="outlined"
          keyboardType="numeric"
          right={<TextInput.Affix text="cm" />}
        />
        <TextInput
          label={t('merchant.height')}
          value={formData.dimensions.height}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              dimensions: { ...prev.dimensions, height: text },
            }))
          }
          style={[styles.input, styles.dimensionInput]}
          mode="outlined"
          keyboardType="numeric"
          right={<TextInput.Affix text="cm" />}
        />
      </View>

      {/* Tags */}
      <Text style={styles.label}>{t('merchant.tags')}</Text>
      <View style={styles.tagInputRow}>
        <TextInput
          label={t('merchant.addTag')}
          value={newTag}
          onChangeText={setNewTag}
          style={[styles.input, styles.tagInput]}
          mode="outlined"
          onSubmitEditing={addTag}
        />
        <Button mode="outlined" onPress={addTag} style={styles.addTagButton}>
          {t('common.add')}
        </Button>
      </View>

      <View style={styles.tagContainer}>
        {formData.tags.map((tag, index) => (
          <Chip
            key={index}
            mode="outlined"
            onClose={() => removeTag(tag)}
            style={styles.tag}
          >
            {tag}
          </Chip>
        ))}
      </View>

      {/* Specifications */}
      <Text style={styles.label}>{t('merchant.specifications')}</Text>
      <View style={styles.specInputRow}>
        <TextInput
          label={t('merchant.specName')}
          value={newSpec.name}
          onChangeText={(text) =>
            setNewSpec((prev) => ({ ...prev, name: text }))
          }
          style={[styles.input, styles.specInput]}
          mode="outlined"
        />
        <TextInput
          label={t('merchant.specValue')}
          value={newSpec.value}
          onChangeText={(text) =>
            setNewSpec((prev) => ({ ...prev, value: text }))
          }
          style={[styles.input, styles.specInput]}
          mode="outlined"
        />
        <Button
          mode="outlined"
          onPress={addSpecification}
          style={styles.addSpecButton}
        >
          {t('common.add')}
        </Button>
      </View>

      {formData.specifications.map((spec, index) => (
        <Card key={index} style={styles.specCard}>
          <Card.Content style={styles.specContent}>
            <View style={styles.specInfo}>
              <Text style={styles.specName}>{spec.name}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeSpecButton}
              onPress={() => removeSpecification(index)}
            >
              <Ionicons name="close" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderImages = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('merchant.productImages')}</Text>
      <ImageUploader
        images={formData.images}
        onImagesChange={handleImageSelect}
        maxImages={8}
        aspectRatio="1:1"
      />
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'basic':
        return renderBasicInfo();
      case 'pricing':
        return renderPricing();
      case 'details':
        return renderDetails();
      case 'images':
        return renderImages();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t('merchant.editProduct') : t('merchant.addProduct')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            { value: 'basic', label: t('merchant.basic') },
            { value: 'pricing', label: t('merchant.pricing') },
            { value: 'details', label: t('merchant.details') },
            { value: 'images', label: t('merchant.images') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          {isEditing
            ? t('merchant.updateProduct')
            : t('merchant.createProduct')}
        </Button>
      </View>
    </KeyboardAvoidingView>
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
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dimensionInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  storeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  storeChip: {
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    marginBottom: 4,
  },
  specInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  specInput: {
    flex: 1,
  },
  addSpecButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  specCard: {
    marginBottom: 8,
  },
  specContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specInfo: {
    flex: 1,
  },
  specName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  specValue: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  removeSpecButton: {
    padding: 4,
  },
  submitContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    paddingVertical: 4,
  },
});
