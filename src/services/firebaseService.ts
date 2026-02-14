import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  getDocFromServer,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Store, MenuItem, Order, User, Category, OrderStatus, Address, Review } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      }
      // Skip logging for other errors, as this is simply a connection test.
    }
  },

  // Stores
  async getStores(): Promise<Store[]> {
    const path = 'stores';
    try {
      const q = query(collection(db, path), orderBy('rating', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Menu Items
  async getMenuItems(storeId: string): Promise<MenuItem[]> {
    const path = 'menuItems';
    try {
      const q = query(collection(db, path), where('storeId', '==', storeId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Orders
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const path = 'orders';
    try {
      // Robustly ensure merchantId is present on the order for security filtering
      const storeDoc = await getDoc(doc(db, 'stores', orderData.storeId));
      const merchantId = storeDoc.exists() ? storeDoc.data().merchantId : null;

      const docRef = await addDoc(collection(db, path), {
        ...orderData,
        merchantId: merchantId || orderData.merchantId,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const path = 'orders';
    try {
      const q = query(
        collection(db, path), 
        where('userId', '==', userId), 
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    }, (error) => {
      console.error('Orders subscription error:', error);
    });
  },

  // User Profile
  async syncUserProfile(user: any) {
    const path = `users/${user.uid}`;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user'
        });
      } else {
        if (user.role && user.role !== userDoc.data().role) {
          // Allow explicit syncs like in MerchantDashboard to update role if strictly passed in param
          await setDoc(doc(db, 'users', user.uid), { role: user.role, managedStoreId: user.managedStoreId }, { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getUserProfile(uid: string): Promise<User | null> {
    const path = `users/${uid}`;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Admin/Merchant Functions
  async getAllOrders(): Promise<Order[]> {
    const path = 'orders';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getStoreOrders(storeId: string): Promise<Order[]> {
    const path = 'orders';
    try {
      const q = query(
        collection(db, path), 
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToStoreOrders(storeId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    }, (error) => {
      console.error('Store orders subscription error:', error);
    });
  },

  async registerMerchant(userId: string, storeData: Omit<Store, 'id' | 'rating'>): Promise<string> {
    const batch = writeBatch(db);
    const storeRef = doc(collection(db, 'stores'));
    const storeId = storeRef.id;

    batch.set(storeRef, {
      ...storeData,
      merchantId: userId,
      rating: 0,
      createdAt: Timestamp.now()
    });

    batch.update(doc(db, 'users', userId), {
      role: 'merchant',
      managedStoreId: storeId
    });

    try {
      await batch.commit();
      return storeId;
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'merchant-registration');
       return '';
    }
  },

  async getStore(storeId: string): Promise<Store | null> {
    const path = `stores/${storeId}`;
    try {
      const storeDoc = await getDoc(doc(db, 'stores', storeId));
      if (storeDoc.exists()) {
        return { id: storeDoc.id, ...storeDoc.data() } as Store;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const path = `orders/${orderId}`;
    try {
      await setDoc(doc(db, 'orders', orderId), { status }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async cancelOrder(orderId: string): Promise<void> {
    const path = `orders/${orderId}`;
    try {
      await setDoc(doc(db, 'orders', orderId), { status: 'cancelled' }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async updateStore(storeId: string, data: Partial<Store>): Promise<void> {
    const path = `stores/${storeId}`;
    try {
      await setDoc(doc(db, 'stores', storeId), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async addMenuItem(data: Omit<MenuItem, 'id'>): Promise<string> {
    const path = 'menuItems';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateMenuItem(itemId: string, data: Partial<MenuItem>): Promise<void> {
    const path = `menuItems/${itemId}`;
    try {
      await setDoc(doc(db, 'menuItems', itemId), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    const path = `menuItems/${itemId}`;
    try {
      await deleteDoc(doc(db, 'menuItems', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error; // Rethrow to let the UI know it failed
    }
  },

  // Addresses (Campus Points)
  async getAddresses(userId: string): Promise<Address[]> {
    const path = 'addresses';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addAddress(userId: string, data: Omit<Address, 'id' | 'userId'>): Promise<string> {
    const path = 'addresses';
    try {
      const docRef = await addDoc(collection(db, path), { ...data, userId });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async deleteAddress(addressId: string): Promise<void> {
    const path = `addresses/${addressId}`;
    try {
      await deleteDoc(doc(db, 'addresses', addressId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Reviews
  async getReviews(storeId: string): Promise<Review[]> {
    const path = 'reviews';
    try {
      const q = query(collection(db, path), where('storeId', '==', storeId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
    const reviewId = `${data.userId}_${data.storeId}`;
    const storeRef = doc(db, 'stores', data.storeId);
    const reviewRef = doc(db, 'reviews', reviewId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const storeDoc = await transaction.get(storeRef);
        const reviewDoc = await transaction.get(reviewRef);

        if (!storeDoc.exists()) throw new Error("Store does not exist");
        
        const storeData = storeDoc.data() as Store;
        let newReviewCount = storeData.reviewCount || 0;
        let newRating = storeData.rating || 0;

        if (reviewDoc.exists()) {
          // Update existing review: Count stays the same, replace the old score
          const oldRating = reviewDoc.data().rating;
          if (newReviewCount > 0) {
            const totalScore = (newRating * newReviewCount) - oldRating + data.rating;
            newRating = totalScore / newReviewCount;
          } else {
            newRating = data.rating;
          }
        } else {
          // New review: Increment count and average
          const totalScore = (newRating * newReviewCount) + data.rating;
          newReviewCount += 1;
          newRating = totalScore / newReviewCount;
        }

        // Write the review
        transaction.set(reviewRef, {
          ...data,
          createdAt: serverTimestamp()
        }, { merge: true });

        // Update the store
        transaction.update(storeRef, {
          rating: Number(newRating.toFixed(1)) || 0,
          reviewCount: newReviewCount
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'add-review');
      throw error;
    }
  },

  // Favorites
  async toggleFavorite(userId: string, storeId: string): Promise<boolean> {
    const favId = `${userId}_${storeId}`;
    const favRef = doc(db, 'favorites', favId);
    try {
      const favDoc = await getDoc(favRef);
      if (favDoc.exists()) {
        await deleteDoc(favRef);
        return false;
      } else {
        await setDoc(favRef, { userId, storeId, createdAt: serverTimestamp() });
        return true;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'toggle-favorite');
      return false;
    }
  },

  async isFavorite(userId: string, storeId: string): Promise<boolean> {
    const favId = `${userId}_${storeId}`;
    try {
      const favDoc = await getDoc(doc(db, 'favorites', favId));
      return favDoc.exists();
    } catch (error) {
      return false;
    }
  },

  async getFavorites(userId: string): Promise<Store[]> {
    try {
      const q = query(collection(db, 'favorites'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const storeIds = snapshot.docs.map(doc => doc.data().storeId);
      
      if (storeIds.length === 0) return [];
      
      // Batch get stores
      const storePromises = storeIds.map(id => this.getStore(id));
      const stores = await Promise.all(storePromises);
      return stores.filter((s): s is Store => s !== null);
    } catch (error) {
      return [];
    }
  },

  // Global Search
  async globalSearch(term: string): Promise<{ stores: Store[], items: (MenuItem & { store: Store })[] }> {
    const lowerTerm = term.toLowerCase();
    try {
      const [allStores, allItemsSnapshot] = await Promise.all([
        this.getStores(),
        getDocs(query(collection(db, 'menuItems'), where('deleted', '!=', true)))
      ]);

      const stores = allStores.filter(s => 
        s.name.toLowerCase().includes(lowerTerm) || 
        s.description.toLowerCase().includes(lowerTerm)
      );

      const items = allItemsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as MenuItem))
        .filter(item => 
          item.name.toLowerCase().includes(lowerTerm) || 
          item.description.toLowerCase().includes(lowerTerm)
        )
        .map(item => ({
          ...item,
          store: allStores.find(s => s.id === item.storeId)!
        }))
        .filter(item => item.store); // Ensure store exists

      return { stores, items };
    } catch (error) {
      return { stores: [], items: [] };
    }
  },

  // Seeding
  async seedData() {
    try {
      const storesSnapshot = await getDocs(collection(db, 'stores'));
      // Only seed if we don't have the expanded set yet
      if (storesSnapshot.size > 5) return;

      console.log('Seeding expanded initial data...');
      const batch = writeBatch(db);

      const stores = [
        {
          id: 'store-1',
          name: 'Campus Bites',
          category: 'Food' as Category,
          rating: 4.5,
          reviewCount: 0,
          deliveryTime: '20-30 min',
          image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=400&h=300&auto=format&fit=crop',
          description: 'Delicious hot snacks, burgers, and campus favorites.'
        },
        {
          id: 'store-2',
          name: 'Quick Wash',
          category: 'Laundry' as Category,
          rating: 4.2,
          reviewCount: 0,
          deliveryTime: '24 hours',
          image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=400&h=300&auto=format&fit=crop',
          description: 'Professional laundry and dry cleaning services for students.'
        },
        {
          id: 'store-3',
          name: 'Stationery Hub',
          category: 'Stationery' as Category,
          rating: 4.8,
          reviewCount: 0,
          deliveryTime: '10-15 min',
          image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=400&h=300&auto=format&fit=crop',
          description: 'All your academic supplies, from pens to scientific calculators.'
        },
        {
          id: 'store-4',
          name: 'Fresh Mart',
          category: 'Grocery' as Category,
          rating: 4.6,
          reviewCount: 0,
          deliveryTime: '15-20 min',
          image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=400&h=300&auto=format&fit=crop',
          description: 'Fresh fruits, snacks, and daily essentials for your room.'
        },
        {
          id: 'store-5',
          name: 'The Canteen',
          category: 'Food' as Category,
          rating: 4.3,
          reviewCount: 0,
          deliveryTime: '25-35 min',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&h=300&auto=format&fit=crop',
          description: 'Home-style meals and authentic local flavors.'
        },
        {
          id: 'store-6',
          name: 'Utility Shop',
          category: 'Grocery' as Category,
          rating: 4.4,
          reviewCount: 0,
          deliveryTime: '10-15 min',
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=300&auto=format&fit=crop',
          description: 'Beverages, toiletries, and instant snacks available 24/7.'
        }
      ];

      stores.forEach(s => {
        const { id, ...data } = s;
        batch.set(doc(db, 'stores', id), data);
      });

      const menuItems = [
        // Food - Campus Bites
        { storeId: 'store-1', name: 'Crunchy Veg Burger', price: 95, description: 'Crispy patty with secret sauce', category: 'Burgers', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-1', name: 'Paneer Tikka Pizza', price: 180, description: 'Topped with marinated cottage cheese', category: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-1', name: 'Peri Peri Fries', price: 70, description: 'Spicy and crispy potato fries', category: 'Sides', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-1', name: 'Cold Coffee', price: 60, description: 'Classic refreshingly chilled coffee', category: 'Beverages', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=200&h=200&auto=format&fit=crop' },
        
        // Laundry - Quick Wash
        { storeId: 'store-2', name: 'Wash & Fold', price: 45, description: 'Basic laundry cleaned and folded (per kg)', category: 'Standard', image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-2', name: 'Steam Ironing', price: 15, description: 'Professional wrinkle-free steam press (per item)', category: 'Ironing', image: 'https://images.unsplash.com/photo-1495556650867-99590cea3657?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-2', name: 'Dry Cleaning', price: 120, description: 'Specialized chemical cleaning for delicate fabrics', category: 'Premium', image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=200&h=200&auto=format&fit=crop' },

        // Stationery - Stationery Hub
        { storeId: 'store-3', name: 'Parker Vector Pen', price: 250, description: 'Premium stainless steel rollerball pen', category: 'Writing', image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-3', name: 'A4 Spiral Notebook', price: 85, description: '300 pages, ruled, premium paper quality', category: 'Notebooks', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-3', name: 'Scientific Calculator', price: 1250, description: 'Casio FX-991EX for engineering students', category: 'Tools', image: 'https://images.unsplash.com/photo-1574607383476-f517f220d398?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-3', name: 'Art Sketchbook', price: 150, description: '120 GSM thick paper for sketching', category: 'Art', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=200&h=200&auto=format&fit=crop' },

        // Grocery - Fresh Mart
        { storeId: 'store-4', name: 'Oreo Biscuits 120g', price: 35, description: 'Chocolate cream sandwich biscuits', category: 'Snacks', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-4', name: 'Amul Taza Milk 1L', price: 66, description: 'Fresh pasteurized toned milk', category: 'Dairy', image: 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-4', name: 'Whole Wheat Bread', price: 40, description: 'Healthy and fresh multi-grain bread', category: 'Dairy', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-4', name: 'Lays Magic Masala', price: 20, description: 'Spicy and tangy potato chips', category: 'Snacks', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=200&h=200&auto=format&fit=crop' },

        // Food - The Canteen
        { storeId: 'store-5', name: 'Masala Maggi', price: 40, description: 'Soul-satisfying spicy instant noodles', category: 'Noodles', image: 'https://images.unsplash.com/photo-1612927623704-308169f5c273?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-5', name: 'Chicken Egg Roll', price: 85, description: 'Golden wrap with juicy chicken chunks', category: 'Rolls', image: 'https://images.unsplash.com/photo-1606335543042-57c525922933?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-5', name: 'Aloo Paratha (2pc)', price: 70, description: 'Served with butter and pickle', category: 'Meals', image: 'https://images.unsplash.com/photo-1626322237942-2c3607588e40?q=80&w=200&h=200&auto=format&fit=crop' },

        // Grocery - Utility Shop
        { storeId: 'store-6', name: 'Dove Shampoo 180ml', price: 165, description: 'Daily shine care for smooth hair', category: 'Toiletries', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-6', name: 'Surf Excel 500g', price: 110, description: 'Powerful detergent for tough stains', category: 'Home Care', image: 'https://images.unsplash.com/photo-1603808033176-9d134e6f2c74?q=80&w=200&h=200&auto=format&fit=crop' },
        { storeId: 'store-6', name: 'Red Bull 250ml', price: 125, description: 'Energy drink to boost performance', category: 'Beverages', image: 'https://images.unsplash.com/photo-1622766815178-641bef2b4630?q=80&w=200&h=200&auto=format&fit=crop' }
      ];

      menuItems.forEach(item => {
        const itemRef = doc(collection(db, 'menuItems'));
        batch.set(itemRef, item);
      });

      await batch.commit();
      console.log('Seeding complete!');
    } catch (error) {
      console.error('Seeding failed:', error);
      if (error instanceof Error) {
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
      }
    }
  }
};
