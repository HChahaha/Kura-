import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserLimits {
 scansToday: number;
 recipesToday: number;
 ingestsToday: number;
 lastDateStr: string;
}

const DEFAULT_LIMITS: UserLimits = {
 scansToday: 0,
 recipesToday: 0,
 ingestsToday: 0,
 lastDateStr: '',
};

function getTodayDateStr(): string {
 return new Date().toISOString().split('T')[0];
}

// LocalStorage key helper
function getLocalKey(userId: string, type: 'scans' | 'recipes' | 'ingests'): string {
 const today = getTodayDateStr();
 return `kura_limit_${type}_${userId || 'anonymous'}_${today}`;
}

export async function getRemainingScans(userId: string): Promise<number> {
 if (!userId) return 2;
 const today = getTodayDateStr();
 
 // 1. Try LocalStorage first (instant result)
 const localVal = localStorage.getItem(getLocalKey(userId, 'scans'));
 if (localVal !== null) {
 const used = parseInt(localVal) || 0;
 return Math.max(0, 2 - used);
 }
 
 // 2. Fallback to Firestore
 try {
 const limitsDocRef = doc(db, `users/${userId}/metadata`, 'dailyLimits');
 const snap = await getDoc(limitsDocRef);
 if (snap.exists()) {
 const data = snap.data();
 if (data.lastDateStr === today) {
 const used = data.scansToday || 0;
 localStorage.setItem(getLocalKey(userId, 'scans'), String(used));
 return Math.max(0, 2 - used);
 }
 }
 } catch (err) {
 console.warn("Error reading limits from Firestore, using localStorage fallback:", err);
 }
 
 // Default values
 localStorage.setItem(getLocalKey(userId, 'scans'), '0');
 return 2;
}

export async function getRemainingRecipes(userId: string): Promise<number> {
 if (!userId) return 2;
 const today = getTodayDateStr();
 
 // 1. Try LocalStorage
 const localVal = localStorage.getItem(getLocalKey(userId, 'recipes'));
 if (localVal !== null) {
 const used = parseInt(localVal) || 0;
 return Math.max(0, 2 - used);
 }
 
 // 2. Fallback to Firestore
 try {
 const limitsDocRef = doc(db, `users/${userId}/metadata`, 'dailyLimits');
 const snap = await getDoc(limitsDocRef);
 if (snap.exists()) {
 const data = snap.data();
 if (data.lastDateStr === today) {
 const used = data.recipesToday || 0;
 localStorage.setItem(getLocalKey(userId, 'recipes'), String(used));
 return Math.max(0, 2 - used);
 }
 }
 } catch (err) {
 console.warn("Error reading recipe limits from Firestore:", err);
 }
 
 // Default values
 localStorage.setItem(getLocalKey(userId, 'recipes'), '0');
 return 2;
}

export async function incrementScans(userId: string): Promise<number> {
 const today = getTodayDateStr();
 const currentKey = getLocalKey(userId, 'scans');
 
 // Update local storage
 const currentUsed = parseInt(localStorage.getItem(currentKey) || '0') || 0;
 const newUsed = currentUsed + 1;
 localStorage.setItem(currentKey, String(newUsed));

 // Update Firestore
 if (userId) {
 try {
 const limitsDocRef = doc(db, `users/${userId}/metadata`, 'dailyLimits');
 const snap = await getDoc(limitsDocRef);
 let scansToday = 1;
 let recipesToday = 0;
 let ingestsToday = 0;
 
 if (snap.exists()) {
 const data = snap.data();
 if (data.lastDateStr === today) {
 scansToday = (data.scansToday || 0) + 1;
 recipesToday = data.recipesToday || 0;
 ingestsToday = data.ingestsToday || 0;
 } else {
 recipesToday = 0; // Reset for new day
 ingestsToday = 0; // Reset for new day
 }
 }
 
 await setDoc(limitsDocRef, {
 scansToday,
 recipesToday,
 ingestsToday,
 lastDateStr: today,
 updatedAt: serverTimestamp()
 }, { merge: true });
 } catch (err) {
 console.error("Failed to sync scans increment to Firestore:", err);
 }
 }
 
 return Math.max(0, 2 - newUsed);
}

export async function incrementRecipes(userId: string): Promise<number> {
 const today = getTodayDateStr();
 const currentKey = getLocalKey(userId, 'recipes');
 
 // Update local storage
 const currentUsed = parseInt(localStorage.getItem(currentKey) || '0') || 0;
 const newUsed = currentUsed + 1;
 localStorage.setItem(currentKey, String(newUsed));

 // Update Firestore
 if (userId) {
 try {
 const limitsDocRef = doc(db, `users/${userId}/metadata`, 'dailyLimits');
 const snap = await getDoc(limitsDocRef);
 let scansToday = 0;
 let recipesToday = 1;
 let ingestsToday = 0;
 
 if (snap.exists()) {
 const data = snap.data();
 if (data.lastDateStr === today) {
 scansToday = data.scansToday || 0;
 recipesToday = (data.recipesToday || 0) + 1;
 ingestsToday = data.ingestsToday || 0;
 } else {
 scansToday = 0; // Reset for new day
 ingestsToday = 0;
 }
 }
 
 await setDoc(limitsDocRef, {
 scansToday,
 recipesToday,
 ingestsToday,
 lastDateStr: today,
 updatedAt: serverTimestamp()
 }, { merge: true });
 } catch (err) {
 console.error("Failed to sync cookbook limit to Firestore:", err);
 }
 }
 
 return Math.max(0, 2 - newUsed);
}

export async function getRemainingIngests(userId: string): Promise<number> {
 if (!userId) return 2;
 const today = getTodayDateStr();
 
 // 1. Try LocalStorage
 const localVal = localStorage.getItem(getLocalKey(userId, 'ingests'));
 if (localVal !== null) {
 const used = parseInt(localVal) || 0;
 return Math.max(0, 2 - used);
 }
 
 // 2. Fallback to Firestore
 try {
 const limitsDocRef = doc(db, `users/${userId}/metadata`, 'dailyLimits');
 const snap = await getDoc(limitsDocRef);
 if (snap.exists()) {
 const data = snap.data();
 if (data.lastDateStr === today) {
 const used = data.ingestsToday || 0;
 localStorage.setItem(getLocalKey(userId, 'ingests'), String(used));
 return Math.max(0, 2 - used);
 }
 }
 } catch (err) {
 console.warn("Error reading ingest limits from Firestore, using localStorage fallback:", err);
 }
 
 // Default values
 localStorage.setItem(getLocalKey(userId, 'ingests'), '0');
 return 2;
}

export async function incrementIngests(userId: string): Promise<number> {
 const today = getTodayDateStr();
 const currentKey = getLocalKey(userId, 'ingests');
 
 // Update local storage
 const currentUsed = parseInt(localStorage.getItem(currentKey) || '0') || 0;
 const newUsed = currentUsed + 1;
 localStorage.setItem(currentKey, String(newUsed));

 // Update Firestore
 if (userId) {
 try {
 const limitsDocRef = doc(db, `users/${userId}/metadata`, 'dailyLimits');
 const snap = await getDoc(limitsDocRef);
 let scansToday = 0;
 let recipesToday = 0;
 let ingestsToday = 1;
 
 if (snap.exists()) {
 const data = snap.data();
 if (data.lastDateStr === today) {
 scansToday = data.scansToday || 0;
 recipesToday = data.recipesToday || 0;
 ingestsToday = (data.ingestsToday || 0) + 1;
 } else {
 // Reset for new day
 scansToday = 0;
 recipesToday = 0;
 }
 }
 
 await setDoc(limitsDocRef, {
 scansToday,
 recipesToday,
 ingestsToday,
 lastDateStr: today,
 updatedAt: serverTimestamp()
 }, { merge: true });
 } catch (err) {
 console.error("Failed to sync ingest limit to Firestore:", err);
 }
 }
 
 return Math.max(0, 2 - newUsed);
}
