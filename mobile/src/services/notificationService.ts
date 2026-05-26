import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const initializeNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Using Expo Go? Notifications might not work fully');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get notification permissions');
      return;
    }

    // Set up Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

export const sendNotification = async (
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: { seconds: 2 },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendShoppingReminderNotification = async () => {
  await sendNotification(
    '🛒 Shopping Reminder',
    'Time to go shopping! Your shopping list is ready.'
  );
};

export const sendExpiryWarningNotification = async (itemName: string) => {
  await sendNotification(
    '⚠️ Expiry Warning',
    `${itemName} is expiring soon!`
  );
};

export const sendRecipeSuggestionNotification = async (recipeName: string) => {
  await sendNotification(
    '👨‍🍳 Recipe Suggestion',
    `Try making ${recipeName} with your current pantry items!`
  );
};
