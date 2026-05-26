import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

export const initializeOfflineDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('kura.db');
    await createTables();
    console.log('Offline database initialized');
  } catch (error) {
    console.error('Error initializing offline database:', error);
  }
};

const createTables = async () => {
  if (!db) return;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pantry_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      category TEXT,
      expiryDate TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS shopping_list (
      id TEXT PRIMARY KEY,
      item TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      category TEXT,
      checked INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ingredients TEXT,
      instructions TEXT,
      imageUrl TEXT,
      servings INTEGER,
      prepTime INTEGER,
      cookTime INTEGER,
      createdAt TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      tableName TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT
    );
  `);
};

export const addPantryItem = async (item: any) => {
  if (!db) return null;

  const id = item.id || `${Date.now()}-${Math.random()}`;
  const now = new Date().toISOString();

  try {
    await db.runAsync(
      `INSERT INTO pantry_items (id, name, quantity, unit, category, expiryDate, createdAt, updatedAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, item.name, item.quantity, item.unit, item.category, item.expiryDate, now, now]
    );

    // Add to sync queue
    await addToSyncQueue('INSERT', 'pantry_items', item);
    return id;
  } catch (error) {
    console.error('Error adding pantry item:', error);
    return null;
  }
};

export const getPantryItems = async () => {
  if (!db) return [];

  try {
    const result = await db.getAllAsync('SELECT * FROM pantry_items');
    return result;
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    return [];
  }
};

export const updatePantryItem = async (id: string, updates: any) => {
  if (!db) return false;

  const now = new Date().toISOString();

  try {
    const sets = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), now, id];

    await db.runAsync(
      `UPDATE pantry_items SET ${sets}, updatedAt = ? WHERE id = ?`,
      values
    );

    await addToSyncQueue('UPDATE', 'pantry_items', { id, ...updates });
    return true;
  } catch (error) {
    console.error('Error updating pantry item:', error);
    return false;
  }
};

export const deletePantryItem = async (id: string) => {
  if (!db) return false;

  try {
    await db.runAsync('DELETE FROM pantry_items WHERE id = ?', [id]);
    await addToSyncQueue('DELETE', 'pantry_items', { id });
    return true;
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    return false;
  }
};

export const addToSyncQueue = async (action: string, tableName: string, data: any) => {
  if (!db) return;

  try {
    const id = `${Date.now()}-${Math.random()}`;
    await db.runAsync(
      `INSERT INTO sync_queue (id, action, tableName, data, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [id, action, tableName, JSON.stringify(data), new Date().toISOString()]
    );
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

export const getSyncQueue = async () => {
  if (!db) return [];

  try {
    const result = await db.getAllAsync('SELECT * FROM sync_queue ORDER BY createdAt ASC');
    return result;
  } catch (error) {
    console.error('Error fetching sync queue:', error);
    return [];
  }
};

export const clearSyncQueue = async () => {
  if (!db) return false;

  try {
    await db.runAsync('DELETE FROM sync_queue');
    return true;
  } catch (error) {
    console.error('Error clearing sync queue:', error);
    return false;
  }
};
