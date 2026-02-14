export type Category = 'Food' | 'Laundry' | 'Stationery' | 'Grocery';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'merchant';
  managedStoreId?: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string; // e.g., 'Hostel Alpha'
  details: string; // e.g., 'Wing B, Room 302'
  isDefault: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  storeId: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Store {
  id: string;
  merchantId?: string; // UID of the owner
  name: string;
  category: Category;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  image: string;
  description: string;
}

export interface MenuItem {
  id: string;
  storeId: string;
  merchantId?: string; // Add this for easier security rules
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';

export interface OrderAddress {
  label: string;
  details: string;
}

export interface Order {
  id: string;
  userId: string;
  merchantId?: string; // UID of the store owner for secure listing
  storeId: string;
  storeName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  address?: OrderAddress;
  createdAt: any; // Firestore Timestamp
}
