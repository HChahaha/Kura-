import axios from 'axios';
import { getSyncQueue, clearSyncQueue } from './offlineService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const syncWithBackend = async (authToken: string) => {
  try {
    const syncQueue = await getSyncQueue();

    if (syncQueue.length === 0) {
      console.log('No items to sync');
      return true;
    }

    for (const item of syncQueue) {
      try {
        const { action, tableName, data } = item as any;
        const parsedData = JSON.parse(data);

        switch (action) {
          case 'INSERT':
            await axios.post(`${API_BASE_URL}/${tableName}`, parsedData, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            break;
          case 'UPDATE':
            await axios.put(
              `${API_BASE_URL}/${tableName}/${parsedData.id}`,
              parsedData,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            break;
          case 'DELETE':
            await axios.delete(`${API_BASE_URL}/${tableName}/${parsedData.id}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            break;
        }
      } catch (error) {
        console.error('Error syncing item:', error);
        // Continue with next item
      }
    }

    await clearSyncQueue();
    console.log('Sync completed successfully');
    return true;
  } catch (error) {
    console.error('Error during sync:', error);
    return false;
  }
};

export const fetchPantryFromBackend = async (authToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pantry`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pantry from backend:', error);
    return null;
  }
};
