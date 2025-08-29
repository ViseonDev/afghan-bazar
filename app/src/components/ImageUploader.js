import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { Card, IconButton, Button, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function ImageUploader({
  images = [],
  onImagesChange,
  maxImages = 5,
  aspectRatio = '1:1',
  allowVideo = false,
  quality = 0.8,
}) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'),
        t('imageUploader.cameraPermissionMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.settings'), onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera = false) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (images.length >= maxImages) {
      Alert.alert(
        t('imageUploader.maxImagesReached'),
        t('imageUploader.maxImagesMessage', { max: maxImages }),
      );
      return;
    }

    const options = {
      mediaTypes: allowVideo
        ? ImagePicker.MediaTypeOptions.All
        : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect:
        aspectRatio === '1:1'
          ? [1, 1]
          : aspectRatio === '16:9'
            ? [16, 9]
            : [4, 3],
      quality: quality,
      allowsMultipleSelection: !useCamera && maxImages > 1,
      selectionLimit: maxImages - images.length,
    };

    try {
      let result;
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize,
        }));

        // Simulate upload progress
        setUploading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setUploading(false);
              return 100;
            }
            return prev + 10;
          });
        }, 100);

        // Add new images to existing ones
        const updatedImages = [...images, ...newImages];
        onImagesChange(updatedImages);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('imageUploader.errorPickingImage'));
    }
  };

  const removeImage = (index) => {
    Alert.alert(
      t('imageUploader.removeImage'),
      t('imageUploader.removeImageConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            const updatedImages = images.filter((_, i) => i !== index);
            onImagesChange(updatedImages);
          },
        },
      ],
    );
  };

  const reorderImages = (fromIndex, toIndex) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  const showImageOptions = () => {
    Alert.alert(
      t('imageUploader.selectImage'),
      t('imageUploader.selectImageMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('imageUploader.camera'), onPress: () => pickImage(true) },
        { text: t('imageUploader.gallery'), onPress: () => pickImage(false) },
      ],
    );
  };

  const getImageDimensions = () => {
    const imageWidth = (width - 48) / 3; // 3 images per row with padding
    const imageHeight =
      aspectRatio === '1:1'
        ? imageWidth
        : aspectRatio === '16:9'
          ? (imageWidth * 9) / 16
          : (imageWidth * 3) / 4;
    return { width: imageWidth, height: imageHeight };
  };

  const imageDimensions = getImageDimensions();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('imageUploader.images')}</Text>

      {uploading && (
        <View style={styles.uploadProgress}>
          <Text style={styles.uploadText}>{t('imageUploader.uploading')}</Text>
          <ProgressBar
            progress={uploadProgress / 100}
            color={theme.colors.primary}
          />
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imageList}
        contentContainerStyle={styles.imageListContent}
      >
        {/* Add Image Button */}
        {images.length < maxImages && (
          <TouchableOpacity
            style={[styles.addImageButton, imageDimensions]}
            onPress={showImageOptions}
          >
            <Ionicons name="add" size={32} color={theme.colors.placeholder} />
            <Text style={styles.addImageText}>
              {t('imageUploader.addImage')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Image Items */}
        {images.map((image, index) => (
          <View key={index} style={[styles.imageItem, imageDimensions]}>
            <Image source={{ uri: image.uri }} style={styles.image} />

            {/* Primary Badge */}
            {index === 0 && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>
                  {t('imageUploader.primary')}
                </Text>
              </View>
            )}

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            {/* Reorder Buttons */}
            {images.length > 1 && (
              <View style={styles.reorderButtons}>
                {index > 0 && (
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => reorderImages(index, index - 1)}
                  >
                    <Ionicons name="chevron-back" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
                {index < images.length - 1 && (
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => reorderImages(index, index + 1)}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Helper Text */}
      <Text style={styles.helperText}>
        {t('imageUploader.helperText', {
          current: images.length,
          max: maxImages,
        })}
      </Text>

      {images.length > 0 && (
        <Text style={styles.primaryHelperText}>
          {t('imageUploader.primaryHelperText')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  uploadProgress: {
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  imageList: {
    marginBottom: 12,
  },
  imageListContent: {
    paddingRight: 16,
  },
  addImageButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addImageText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
    textAlign: 'center',
  },
  imageItem: {
    marginRight: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtons: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  reorderButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  primaryHelperText: {
    fontSize: 12,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 4,
  },
});
