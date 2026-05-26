import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { takePhoto, pickPhotoFromLibrary, savePhotoLocally } from '@/services/cameraService';

interface CameraScreenProps {
  onPhotoCapture?: (uri: string) => void;
  itemId?: string;
  itemType?: 'recipe' | 'ingredient';
  onClose?: () => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({
  onPhotoCapture,
  itemId,
  itemType = 'ingredient',
  onClose,
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    try {
      const photoUri = await takePhoto();
      if (photoUri) {
        setCapturedPhoto(photoUri);
        if (itemId) {
          await savePhotoLocally(photoUri, itemId, itemType);
        }
        onPhotoCapture?.(photoUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const photoUri = await pickPhotoFromLibrary();
      if (photoUri) {
        setCapturedPhoto(photoUri);
        if (itemId) {
          await savePhotoLocally(photoUri, itemId, itemType);
        }
        onPhotoCapture?.(photoUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photo');
      console.error('Photo picker error:', error);
    }
  };

  const handleDiscard = () => {
    setCapturedPhoto(null);
  };

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Photo Preview</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
            onPress={handleDiscard}
          >
            <Ionicons name="trash" size={24} color="white" />
            <Text style={styles.actionButtonText}>Discard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10b981' }]}
            onPress={() => {
              Alert.alert('Success', 'Photo saved successfully!');
              onClose?.();
            }}
          >
            <Ionicons name="checkmark" size={24} color="white" />
            <Text style={styles.actionButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Capture Photo</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Ionicons name="camera" size={80} color="#d1d5db" />
        <Text style={styles.instructionText}>
          Add a photo to track your pantry items or recipes
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.largeButton}
          onPress={handleTakePhoto}
        >
          <Ionicons name="camera" size={32} color="white" />
          <Text style={styles.largeButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.largeButton, { backgroundColor: '#3b82f6' }]}
          onPress={handlePickPhoto}
        >
          <Ionicons name="image" size={32} color="white" />
          <Text style={styles.largeButtonText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#10b981',
    padding: 16,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  largeButton: {
    backgroundColor: '#10b981',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: '60%',
    resizeMode: 'contain',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CameraScreen;
