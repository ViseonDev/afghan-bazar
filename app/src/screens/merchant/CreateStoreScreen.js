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
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storesAPI, categoriesAPI } from '../../services/api';
import ImageUploader from '../../components/ImageUploader';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function CreateStoreScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { user } = useAuth();

  const isEditing = route.params?.storeId;
  const storeId = route.params?.storeId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    website: '',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Afghanistan',
    },
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true },
    },
    coverImage: null,
    images: [],
    isActive: true,
    coordinates: { latitude: null, longitude: null },
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState('basic');

  useEffect(() => {
    loadCategories();
    if (isEditing) {
      loadStoreData();
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

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const response = await storesAPI.getStore(storeId);

      if (response.success) {
        setFormData({
          ...response.data.store,
          category: response.data.store.category?._id || '',
          coordinates: response.data.store.coordinates || {
            latitude: null,
            longitude: null,
          },
        });
      }
    } catch (error) {
      console.error('Error loading store data:', error);
      Alert.alert(t('common.error'), t('merchant.errorLoadingStore'));
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('merchant.locationPermissionDenied'));
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setFormData((prev) => ({
        ...prev,
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      }));
    } catch (error) {
      console.error('Error getting location:', error);
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

    if (!formData.category) {
      newErrors.category = t('merchant.categoryRequired');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('merchant.phoneRequired');
    }

    if (!formData.address.street.trim()) {
      newErrors.street = t('merchant.streetRequired');
    }

    if (!formData.address.city.trim()) {
      newErrors.city = t('merchant.cityRequired');
    }

    if (!formData.address.province.trim()) {
      newErrors.province = t('merchant.provinceRequired');
    }

    if (
      formData.coordinates.latitude === null ||
      formData.coordinates.longitude === null
    ) {
      newErrors.coordinates = t('merchant.locationRequired');
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
        owner: user._id,
      };

      let response;
      if (isEditing) {
        response = await storesAPI.updateStore(storeId, submitData);
      } else {
        response = await storesAPI.createStore(submitData);
      }

      if (response.success) {
        Alert.alert(
          t('common.success'),
          isEditing ? t('merchant.storeUpdated') : t('merchant.storeCreated'),
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
          response.message || t('merchant.errorSavingStore'),
        );
      }
    } catch (error) {
      console.error('Error saving store:', error);
      Alert.alert(t('common.error'), t('merchant.errorSavingStore'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (images) => {
    setFormData((prev) => ({
      ...prev,
      images: images,
      coverImage: images[0] || null,
    }));
  };

  const handleBusinessHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value,
        },
      },
    }));
  };

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('merchant.basicInformation')}</Text>

      <TextInput
        label={t('merchant.storeName')}
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

  const renderContactInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t('merchant.contactInformation')}
      </Text>

      <TextInput
        label={t('merchant.phone')}
        value={formData.phone}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, phone: text }))
        }
        style={styles.input}
        error={!!errors.phone}
        mode="outlined"
        keyboardType="phone-pad"
      />
      <HelperText type="error" visible={!!errors.phone}>
        {errors.phone}
      </HelperText>

      <TextInput
        label={t('merchant.email')}
        value={formData.email}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, email: text }))
        }
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
      />

      <TextInput
        label={t('merchant.website')}
        value={formData.website}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, website: text }))
        }
        style={styles.input}
        mode="outlined"
        keyboardType="url"
      />
    </View>
  );

  const renderAddress = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('merchant.address')}</Text>

      <TextInput
        label={t('merchant.street')}
        value={formData.address.street}
        onChangeText={(text) =>
          setFormData((prev) => ({
            ...prev,
            address: { ...prev.address, street: text },
          }))
        }
        style={styles.input}
        error={!!errors.street}
        mode="outlined"
      />
      <HelperText type="error" visible={!!errors.street}>
        {errors.street}
      </HelperText>

      <View style={styles.row}>
        <TextInput
          label={t('merchant.city')}
          value={formData.address.city}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              address: { ...prev.address, city: text },
            }))
          }
          style={[styles.input, styles.halfWidth]}
          error={!!errors.city}
          mode="outlined"
        />
        <TextInput
          label={t('merchant.province')}
          value={formData.address.province}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              address: { ...prev.address, province: text },
            }))
          }
          style={[styles.input, styles.halfWidth]}
          error={!!errors.province}
          mode="outlined"
        />
      </View>

      <TextInput
        label={t('merchant.postalCode')}
        value={formData.address.postalCode}
        onChangeText={(text) =>
          setFormData((prev) => ({
            ...prev,
            address: { ...prev.address, postalCode: text },
          }))
        }
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
      />

      <Button
        mode="outlined"
        icon="crosshairs-gps"
        onPress={getCurrentLocation}
        style={styles.input}
      >
        {t('merchant.useCurrentLocation')}
      </Button>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: formData.coordinates.latitude || 34.5553,
            longitude: formData.coordinates.longitude || 69.2075,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={(e) =>
            setFormData((prev) => ({
              ...prev,
              coordinates: e.nativeEvent.coordinate,
            }))
          }
        >
          {formData.coordinates.latitude && (
            <Marker
              coordinate={formData.coordinates}
              draggable
              onDragEnd={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  coordinates: e.nativeEvent.coordinate,
                }))
              }
            />
          )}
        </MapView>
      </View>
      <HelperText type="error" visible={!!errors.coordinates}>
        {errors.coordinates}
      </HelperText>
    </View>
  );

  const renderBusinessHours = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('merchant.businessHours')}</Text>

      {Object.entries(formData.businessHours).map(([day, hours]) => (
        <Card key={day} style={styles.dayCard}>
          <Card.Content>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{t(`days.${day}`)}</Text>
              <Chip
                mode={hours.closed ? 'flat' : 'outlined'}
                selected={hours.closed}
                onPress={() =>
                  handleBusinessHoursChange(day, 'closed', !hours.closed)
                }
                style={styles.closedChip}
              >
                {hours.closed ? t('merchant.closed') : t('merchant.open')}
              </Chip>
            </View>

            {!hours.closed && (
              <View style={styles.hoursRow}>
                <TextInput
                  label={t('merchant.openTime')}
                  value={hours.open}
                  onChangeText={(text) =>
                    handleBusinessHoursChange(day, 'open', text)
                  }
                  style={[styles.input, styles.timeInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label={t('merchant.closeTime')}
                  value={hours.close}
                  onChangeText={(text) =>
                    handleBusinessHoursChange(day, 'close', text)
                  }
                  style={[styles.input, styles.timeInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>
            )}
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderImages = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('merchant.storeImages')}</Text>
      <ImageUploader
        images={formData.images}
        onImagesChange={handleImageSelect}
        maxImages={5}
        aspectRatio="16:9"
      />
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'basic':
        return (
          <>
            {renderBasicInfo()}
            {renderContactInfo()}
          </>
        );
      case 'location':
        return renderAddress();
      case 'hours':
        return renderBusinessHours();
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
          {isEditing ? t('merchant.editStore') : t('merchant.createStore')}
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
            { value: 'location', label: t('merchant.location') },
            { value: 'hours', label: t('merchant.hours') },
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
          {isEditing ? t('merchant.updateStore') : t('merchant.createStore')}
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
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  map: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
    fontWeight: '500',
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
  dayCard: {
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closedChip: {
    height: 32,
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
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
