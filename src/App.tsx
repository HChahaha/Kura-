import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { View, InventoryItem, ShoppingItem, PurchaseRecord } from './types';
import { TopBar, BottomNav } from './components/Navigation';
import Inventory from './pages/Inventory';
import ShoppingList from './pages/ShoppingList';
import Recipes from './pages/Recipes';
import Scanner from './pages/Scanner';
import AddItem from './pages/AddItem';
import EditItem from './pages/EditItem';
import RecipeDetail from './pages/RecipeDetail';
import AddRecipe from './pages/AddRecipe';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import { INVENTORY_ITEMS } from './constants';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { getFoodImage, getNormalShelfLife } from './lib/imageUtils';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, serverTimestamp, updateDoc } from 'firebase/firestore';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('inventory');
  const [viewHistory, setViewHistory] = useState<View[]>(['inventory']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleViewChange = (newView: View) => {
    setViewHistory(prev => {
      const idx = historyIndex;
      const newHistory = prev.slice(0, idx + 1);
      return [...newHistory, newView];
    });
    setHistoryIndex(prev => prev + 1);
    setCurrentView(newView);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentView(viewHistory[newIndex]);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < viewHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentView(viewHistory[newIndex]);
    }
  };
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [hasShownStartupNotification, setHasShownStartupNotification] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    visible: boolean;
    action?: {
      label: string;
      onExecute: () => void;
    };
  }>({ message: '', visible: false });
  
  // Lifted state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);

  const handleAddPurchaseRecord = async (record: PurchaseRecord) => {
    if (!user) return;
    const itemData: any = {
      name: record.name,
      category: record.category,
      price: record.price || '',
      storeName: record.storeName || '',
      purchaseDate: record.purchaseDate || '',
      quantityBought: record.quantityBought || '',
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      await setDoc(doc(db, `users/${user.uid}/purchaseHistory`, record.id), itemData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/purchaseHistory`);
    }
  };

  const handleAddShoppingItem = async (newItem: ShoppingItem) => {
    if (!user) return;
    const id = newItem.id || Math.random().toString(36).substring(7);
    const itemData: any = {
      name: newItem.name,
      category: newItem.category,
      storeName: newItem.storeName || '',
      price: newItem.price || '',
      checked: newItem.checked || false,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      await setDoc(doc(db, `users/${user.uid}/shopping`, id), itemData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/shopping`);
    }
  };

  const handleUpdateShoppingItem = async (id: string, updates: Partial<ShoppingItem>) => {
    if (!user) return;
    const updateData = { ...updates, updatedAt: serverTimestamp() };
    delete updateData.id;
    try {
      await updateDoc(doc(db, `users/${user.uid}/shopping`, id), updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/shopping/${id}`);
    }
  };

  const handleDeleteShoppingItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/shopping`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/shopping/${id}`);
    }
  };
  const handleUpdatePurchaseRecord = async (id: string, updates: Partial<PurchaseRecord>) => {
    if (!user) return;
    try {
      const updateData = { ...updates, updatedAt: serverTimestamp() } as any;
      delete updateData.id;
      await updateDoc(doc(db, `users/${user.uid}/purchaseHistory`, id), updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/purchaseHistory/${id}`);
    }
  };

  const handleDeletePurchaseRecord = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/purchaseHistory`, id));
      triggerNotification('Purchase record removed');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/purchaseHistory/${id}`);
    }
  };
  const [customRecipes, setCustomRecipes] = useState<any[]>([]);
  const [lastAddedIngredient, setLastAddedIngredient] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['Dairy & Eggs', 'Vegetables', 'Meat & Seafood', 'Pantry', 'Grains', 'Fruits', 'Bakery', 'Frozen', 'Household']);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setInventory([]);
      setShoppingList([]);
      return;
    }

    const inventoryQuery = query(collection(db, `users/${user.uid}/inventory`));
    const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setInventory(items.sort((a, b) => {
        if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
        if (!a.isExpiringSoon && b.isExpiringSoon) return 1;
        return a.name.localeCompare(b.name);
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/inventory`));

    const shoppingQuery = query(collection(db, `users/${user.uid}/shopping`));
    const unsubscribeShopping = onSnapshot(shoppingQuery, (snapshot) => {
      const items: ShoppingItem[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as ShoppingItem);
      });
      setShoppingList(items.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/shopping`));

    const purchaseHistoryQuery = query(collection(db, `users/${user.uid}/purchaseHistory`));
    const unsubscribePurchaseHistory = onSnapshot(purchaseHistoryQuery, (snapshot) => {
      const items: PurchaseRecord[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as PurchaseRecord);
      });
      setPurchaseHistory(items.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/purchaseHistory`));

    const recipesQuery = query(collection(db, `users/${user.uid}/recipes`));
    const unsubscribeRecipes = onSnapshot(recipesQuery, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setCustomRecipes(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/recipes`));

    return () => {
      unsubscribeInventory();
      unsubscribeShopping();
      unsubscribePurchaseHistory();
      unsubscribeRecipes();
    };
  }, [user]);

  // Soft startup / mount alert to notify user about to-buy list and almost expiring food
  useEffect(() => {
    if (user && authLoading === false && !hasShownStartupNotification) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      const expiringCount = inventory.filter(i => i.daysLeft !== undefined && i.daysLeft <= 3).length;
      const uncheckedShoppingCount = shoppingList.filter(s => !s.checked).length;
      if (expiringCount > 0 || uncheckedShoppingCount > 0) {
        const timer = setTimeout(() => {
          const msg = `Kura Reminders: ${expiringCount} item(s) expiring soon, and ${uncheckedShoppingCount} item(s) in To Buy list.`;
          triggerNotification(msg);

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Kura Reminders', {
              body: `${expiringCount} item(s) expiring soon, ${uncheckedShoppingCount} itemTo Buy.`,
            });
          }
        }, 1500);
        setHasShownStartupNotification(true);
        return () => clearTimeout(timer);
      }
    }
  }, [user, authLoading, hasShownStartupNotification, inventory, shoppingList]);

  const triggerNotification = (
    message: string, 
    action?: { label: string; onExecute: () => void },
    duration: number = 3000
  ) => {
    setNotification({ message, visible: true, action });
    setTimeout(() => {
      setNotification(prev => {
        if (prev.message === message) {
          return { ...prev, visible: false };
        }
        return prev;
      });
    }, duration);
  };

  const handleToggleSaveRecipe = (id: string) => {
    setSavedRecipeIds(prev => {
      const isCurrentlySaved = prev.includes(id);
      if (isCurrentlySaved) {
        triggerNotification('Recipe unsaved from scrapbook');
        return prev.filter(savedId => savedId !== id);
      } else {
        triggerNotification('Recipe saved to scrapbook');
        return [...prev, id];
      }
    });
  };

  const handleAddItem = async (item: Omit<InventoryItem, 'id' | 'daysLeft' | 'isExpiringSoon'>) => {
    if (!user) return;
    let expiryDateStr = item.expiryDate;
    let daysLeft = undefined;
    
    if (expiryDateStr) {
      const expiryDateObj = new Date(expiryDateStr);
      if (!isNaN(expiryDateObj.getTime())) {
        daysLeft = Math.ceil((expiryDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        expiryDateStr = expiryDateObj.toISOString().split('T')[0];
      } else {
        expiryDateStr = undefined;
      }
    }
    
    // If no expiry date or invalid date, calculate according to normal shelf life
    if (!expiryDateStr) {
      const normalDays = getNormalShelfLife(item.name, item.category);
      const calculatedExpiryDate = new Date();
      calculatedExpiryDate.setDate(calculatedExpiryDate.getDate() + normalDays);
      expiryDateStr = calculatedExpiryDate.toISOString().split('T')[0];
      daysLeft = normalDays;
    }
    
    const id = Math.random().toString(36).substring(7);
    const itemData: any = {
      name: item.name,
      category: item.category,
      quantity: item.quantity || '',
      location: item.location || '',
      expiryDate: expiryDateStr || '',
      daysLeft: daysLeft ?? 0,
      isExpiringSoon: daysLeft !== undefined && daysLeft <= 3,
      image: item.image || getFoodImage(item.name, item.category) || '',
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, `users/${user.uid}/inventory`, id), itemData);
      setLastAddedIngredient(item.name);
      triggerNotification(`Added ${item.name} to inventory (expires ${expiryDateStr})`);
      setCurrentView('inventory');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/inventory`);
    }
  };

  const handleScanItems = async (items: { name: string; quantity: string; category: string; expiryDate: string }[]) => {
    if (!user) return;
    
    for (const item of items) {
      let expiryDateStr = item.expiryDate;
      let daysLeft = undefined;
      
      if (expiryDateStr) {
        const expiryDateObj = new Date(expiryDateStr);
        if (!isNaN(expiryDateObj.getTime())) {
          daysLeft = Math.ceil((expiryDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          expiryDateStr = expiryDateObj.toISOString().split('T')[0];
        } else {
          expiryDateStr = '';
        }
      }
      
      if (!expiryDateStr) {
        const normalDays = getNormalShelfLife(item.name, item.category);
        const calculatedExpiryDate = new Date();
        calculatedExpiryDate.setDate(calculatedExpiryDate.getDate() + normalDays);
        expiryDateStr = calculatedExpiryDate.toISOString().split('T')[0];
        daysLeft = normalDays;
      }
      
      const id = Math.random().toString(36).substring(7);
      const itemData: any = {
        name: item.name,
        category: item.category,
        quantity: item.quantity || '',
        location: 'Unspecified',
        expiryDate: expiryDateStr || '',
        daysLeft: daysLeft ?? 0,
        isExpiringSoon: daysLeft !== undefined && daysLeft <= 3,
        image: getFoodImage(item.name, item.category) || '',
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      try {
        await setDoc(doc(db, `users/${user.uid}/inventory`, id), itemData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/inventory`);
      }
    }

    if (items.length > 0) {
      setLastAddedIngredient(items[0].name);
      triggerNotification(`Added ${items.length} items to inventory`);
    }
    setCurrentView('inventory');
  };

  const handleUpdateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!user) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const merged = { ...item, ...updates };
    let expiryDateStr = merged.expiryDate;
    let daysLeft = undefined;
    
    if (expiryDateStr) {
      const date = new Date(expiryDateStr);
      if (!isNaN(date.getTime())) {
        daysLeft = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        expiryDateStr = date.toISOString().split('T')[0];
      } else {
        expiryDateStr = undefined;
      }
    }
    
    if (!expiryDateStr) {
      const normalDays = getNormalShelfLife(merged.name, merged.category);
      const calculatedExpiryDate = new Date();
      calculatedExpiryDate.setDate(calculatedExpiryDate.getDate() + normalDays);
      expiryDateStr = calculatedExpiryDate.toISOString().split('T')[0];
      daysLeft = normalDays;
    }
    
    merged.expiryDate = expiryDateStr;
    merged.daysLeft = daysLeft;
    merged.isExpiringSoon = daysLeft !== undefined && daysLeft <= 3;
    
    const updateData: any = {
      name: merged.name,
      category: merged.category,
      quantity: merged.quantity || '',
      location: merged.location || '',
      expiryDate: merged.expiryDate || '',
      daysLeft: merged.daysLeft ?? 0,
      isExpiringSoon: merged.isExpiringSoon || false,
      image: merged.image || '',
      updatedAt: serverTimestamp()
    };
    
    try {
      await updateDoc(doc(db, `users/${user.uid}/inventory`, id), updateData);
      triggerNotification(`Updated item`);
      setCurrentView('inventory');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/inventory/${id}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    const itemToDelete = inventory.find(i => i.id === id);
    if (!itemToDelete) return;
    
    try {
      await deleteDoc(doc(db, `users/${user.uid}/inventory`, id));
      triggerNotification(
        `Removed ${itemToDelete.name}`,
        {
          label: 'Undo',
          onExecute: async () => {
            try {
              await setDoc(doc(db, `users/${user.uid}/inventory`, id), itemToDelete);
              triggerNotification(`Restored ${itemToDelete.name}`);
            } catch (err) {
              console.error(err);
            }
          }
        },
        5000
      );
      setCurrentView('inventory');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/inventory/${id}`);
    }
  };

  const handleUpdateShoppingList = (items: ShoppingItem[]) => {
    // We shouldn't use this mass update anymore, replacing with single operations below where needed
    setShoppingList(items);
  };

  const handleUpdateShoppingListFromStrings = async (itemNames: string[]) => {
    if (!user) return;
    for (const name of itemNames) {
      const id = Math.random().toString(36).substring(7);
      const itemData: any = {
        name,
        category: 'Uncategorized',
        checked: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      try {
        await setDoc(doc(db, `users/${user.uid}/shopping`, id), itemData);
      } catch (err) {
        console.error(err);
      }
    }
    triggerNotification('Added items to shopping list');
  };

  const renderView = () => {
    switch (currentView) {
      case 'inventory':
        return (
          <Inventory 
            inventory={inventory} 
            categories={categories}
            onSelectItem={(id) => {
              setEditingItemId(id);
              setCurrentView('edit-item');
            }}
            onViewChange={setCurrentView}
            onUpdateInventory={(items) => {
              setInventory(items);
            }}
          />
        );
      case 'shopping':
        return (
          <ShoppingList 
            shoppingList={shoppingList}
            purchaseHistory={purchaseHistory}
            categories={categories}
            onAddShoppingItem={handleAddShoppingItem}
            onUpdateShoppingItem={handleUpdateShoppingItem}
            onDeleteShoppingItem={handleDeleteShoppingItem}
            onAddPurchaseRecord={handleAddPurchaseRecord}
            onUpdatePurchaseRecord={handleUpdatePurchaseRecord}
            onDeletePurchaseRecord={handleDeletePurchaseRecord}
            onAddToInventory={handleAddItem}
            onViewChange={setCurrentView}
          />
        );
      case 'recipes':
        return (
          <Recipes 
            inventory={inventory}
            customRecipes={customRecipes}
            lastAddedIngredient={lastAddedIngredient}
            onViewChange={setCurrentView} 
            onSelectRecipe={setSelectedRecipeId}
            onDeleteRecipe={(id) => {
              const recipeToDelete = customRecipes.find(r => r.id === id);
              if (!recipeToDelete) return;
              setCustomRecipes(prev => prev.filter(r => r.id !== id));
              triggerNotification(
                `Recipe deleted from scrapbook`,
                {
                  label: 'Undo',
                  onExecute: () => {
                    setCustomRecipes(prev => {
                      if (prev.some(r => r.id === id)) return prev;
                      return [...prev, recipeToDelete];
                    });
                    triggerNotification(`Restored ${recipeToDelete.name}`);
                  }
                },
                5000
              );
            }}
          />
        );
      case 'recipe-detail':
        return (
          <RecipeDetail 
            id={selectedRecipeId} 
            inventory={inventory}
            lastAddedIngredient={lastAddedIngredient}
            onViewChange={setCurrentView} 
            onAddToShoppingList={handleUpdateShoppingListFromStrings}
            onUpdateInventory={setInventory}
            customRecipes={customRecipes}
            savedRecipeIds={savedRecipeIds}
            onToggleSaveRecipe={handleToggleSaveRecipe}
            onEditRecipe={() => {
              setEditingRecipeId(selectedRecipeId);
              setCurrentView('edit-recipe');
            }}
          />
        );
      case 'add-recipe':
      case 'edit-recipe':
        const recipeToEdit = currentView === 'edit-recipe' ? customRecipes.find(r => r.id === editingRecipeId) : undefined;
        return (
          <AddRecipe 
            onViewChange={setCurrentView} 
            recipeToEdit={recipeToEdit}
            onSaveRecipe={async (r) => {
              if (!user) return;
              
              const recipeData = {
                ...r,
                userId: user.uid,
                createdAt: recipeToEdit?.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              
              try {
                await setDoc(doc(db, `users/${user.uid}/recipes`, r.id), recipeData);
                if (!recipeToEdit) {
                  setSavedRecipeIds(prev => [...prev, r.id]); // Auto-save own recipes
                }
                triggerNotification(recipeToEdit ? 'Recipe updated' : 'Recipe published to scrapbook');
                setCurrentView('recipes');
              } catch (err) {
                console.error('Error saving recipe:', err);
                triggerNotification('Failed to save recipe');
              }
            }} 
          />
        );
      case 'settings':
        return <Settings onViewChange={setCurrentView} user={user} />;
      case 'auth':
        return <Auth />;
      case 'scanner':
        return <Scanner onViewChange={setCurrentView} onItemsAdded={handleScanItems} />;
      case 'add-item':
        return (
          <AddItem 
            onViewChange={setCurrentView} 
            onAddItem={handleAddItem}
            categories={categories}
            onAddCategory={(cat) => setCategories(prev => [...new Set([...prev, cat])])}
          />
        );
      case 'edit-item':
        const itemToEdit = inventory.find(i => i.id === editingItemId);
        return (
          <EditItem 
            item={itemToEdit}
            onViewChange={setCurrentView} 
            onUpdateItem={(updates) => handleUpdateItem(editingItemId!, updates)}
            onDeleteItem={() => handleDeleteItem(editingItemId!)}
            categories={categories}
            onAddCategory={(cat) => setCategories(prev => [...new Set([...prev, cat])])}
          />
        );
      default:
        return <Inventory 
          inventory={inventory} 
          categories={categories}
          onSelectItem={(id) => {
            setEditingItemId(id);
            setCurrentView('edit-item');
          }}
          onViewChange={setCurrentView}
          onUpdateInventory={setInventory}
        />;
    }
  };

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStart.x;
    const dy = touchEndY - touchStart.y;
    
    // Check if swipe is mostly horizontal
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0 && touchStart.x < 50) {
        // Swipe right from the left edge
        handleGoBack();
      } else if (dx < 0 && touchStart.x > window.innerWidth - 50) {
        // Swipe left from the right edge
        handleGoForward();
      }
    }
    setTouchStart(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-bamboo-green animate-spin" />
      </div>
    );
  }

  if (!user && currentView !== 'auth') {
    return <Auth />;
  }

  return (
    <main 
      className="min-h-screen bg-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative z-10">
        <TopBar 
          currentView={currentView} 
          onViewChange={handleViewChange} 
          inventory={inventory} 
          shoppingList={shoppingList} 
        />
        
        {/* Success/Action Notification */}
        <AnimatePresence>
          {notification.visible && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-24 left-1/2 z-[100] bg-ink-black text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-5 border border-white/10 min-w-[280px] max-w-[92vw]"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bamboo-green shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{notification.message}</span>
              </div>
              {notification.action && (
                <button 
                  onClick={() => {
                    notification.action?.onExecute();
                    setNotification(prev => ({ ...prev, visible: false }));
                  }}
                  className="bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-white/10 shrink-0 transition-all font-sans"
                >
                  {notification.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav currentView={currentView} onViewChange={handleViewChange} />
      </div>
    </main>
  );
}
