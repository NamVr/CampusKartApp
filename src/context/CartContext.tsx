import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  currentStoreId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);

  const addItem = (item: MenuItem) => {
    if (currentStoreId && currentStoreId !== item.storeId) {
      if (window.confirm('Adding items from a different store will clear your current cart. Continue?')) {
        setItems([{ ...item, quantity: 1 }]);
        setCurrentStoreId(item.storeId);
      }
      return;
    }

    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setCurrentStoreId(item.storeId);
  };

  const removeItem = (itemId: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      const newItems = prev.filter(i => i.id !== itemId);
      if (newItems.length === 0) setCurrentStoreId(null);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    setCurrentStoreId(null);
  };

  const totalAmount = Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalAmount, totalItems, currentStoreId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
