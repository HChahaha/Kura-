import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendExpiryWarningNotification, sendShoppingReminderNotification } from './notificationService';

const EXPIRY_CHECK_TASK = 'EXPIRY_CHECK_TASK';
const SHOPPING_REMINDER_TASK = 'SHOPPING_REMINDER_TASK';

/**
 * Schedule daily expiry checks at 8 AM
 */
export const scheduleExpiryCheckTask = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Checking Expiry Dates',
        body: 'Scanning your pantry for items expiring soon...',
      },
      trigger: {
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
    console.log('Expiry check task scheduled for 8:00 AM daily');
  } catch (error) {
    console.error('Error scheduling expiry check:', error);
  }
};

/**
 * Schedule shopping reminders on specific days
 */
export const scheduleShoppingReminder = async (
  dayOfWeek: number = 6, // Saturday (0=Sunday, 1=Monday, ..., 6=Saturday)
  hour: number = 10,
  minute: number = 0
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛒 Time to Shop!',
        body: 'Your shopping list is ready. Happy shopping!',
      },
      trigger: {
        weekday: dayOfWeek,
        hour,
        minute,
        repeats: true,
      },
    });
    console.log(`Shopping reminder scheduled for day ${dayOfWeek} at ${hour}:${minute}`);
  } catch (error) {
    console.error('Error scheduling shopping reminder:', error);
  }
};

/**
 * Schedule notification for items expiring within N days
 */
export const scheduleExpiryWarnings = async (items: any[]) => {
  try {
    const today = new Date();
    const warningDays = 3; // Warn 3 days before expiry

    for (const item of items) {
      if (!item.expiryDate) continue;

      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry > 0 && daysUntilExpiry <= warningDays) {
        // Schedule notification for next day at 9 AM
        const notificationDate = new Date();
        notificationDate.setDate(notificationDate.getDate() + 1);
        notificationDate.setHours(9, 0, 0, 0);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ Expiry Warning',
            body: `${item.name} expires in ${daysUntilExpiry} day(s)!`,
            data: { itemId: item.id, itemName: item.name },
          },
          trigger: notificationDate,
        });
      }
    }
    console.log('Expiry warnings scheduled');
  } catch (error) {
    console.error('Error scheduling expiry warnings:', error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllScheduledNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

/**
 * Cancel a specific notification
 */
export const cancelNotification = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Notification ${notificationId} cancelled`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};

/**
 * Initialize all scheduled tasks on app startup
 */
export const initializeScheduledTasks = async () => {
  try {
    // Check if tasks are already scheduled
    const isInitialized = await AsyncStorage.getItem('notificationTasksInitialized');

    if (!isInitialized) {
      await scheduleExpiryCheckTask();
      await scheduleShoppingReminder();
      await AsyncStorage.setItem('notificationTasksInitialized', 'true');
    }
  } catch (error) {
    console.error('Error initializing scheduled tasks:', error);
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (preferences: {
  enableExpiryWarnings?: boolean;
  enableShoppingReminders?: boolean;
  expiryWarningDays?: number;
  shoppingReminderDay?: number;
}) => {
  try {
    await AsyncStorage.setItem(
      'notificationPreferences',
      JSON.stringify(preferences)
    );
    console.log('Notification preferences updated');
  } catch (error) {
    console.error('Error updating preferences:', error);
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async () => {
  try {
    const prefs = await AsyncStorage.getItem('notificationPreferences');
    return prefs ? JSON.parse(prefs) : null;
  } catch (error) {
    console.error('Error getting preferences:', error);
    return null;
  }
};
