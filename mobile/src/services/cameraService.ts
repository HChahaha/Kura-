import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import { Alert } from 'react-native';

export const requestCameraPermissions = async () => {
  try {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Kura needs camera and photo library access to work properly.'
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
};

export const takePhoto = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

export const pickPhotoFromLibrary = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error picking photo:', error);
    return null;
  }
};

export const uploadPhotoToBackend = async (
  imageUri: string,
  authToken: string,
  endpoint: string
): Promise<string | null> => {
  try {
    const formData = new FormData();
    const fileName = imageUri.split('/').pop() || 'photo.jpg';
    
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName,
    } as any);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
};

export const savePhotoLocally = async (
  imageUri: string,
  itemId: string,
  itemType: 'recipe' | 'ingredient'
): Promise<void> => {
  try {
    // In a real app, you'd copy the image to app documents directory
    // For now, we're just storing the URI in the database
    console.log(`Photo saved for ${itemType}:`, itemId);
  } catch (error) {
    console.error('Error saving photo locally:', error);
  }
};
