import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';

interface AuthContextType {
  user: (User & { role?: string; managedStoreId?: string }) | null;
  loading: boolean;
  isAdmin: boolean;
  isMerchant: boolean;
  managedStoreId: string | null;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAdmin: false, 
  isMerchant: false,
  managedStoreId: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { role?: string; managedStoreId?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await firebaseService.syncUserProfile(firebaseUser);
        
        // Listen to User Profile changes in real-time
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            const profile = snapshot.data();
            setUser({ 
              ...firebaseUser, 
              role: profile?.role,
              managedStoreId: profile?.managedStoreId 
            } as any);
          } else {
            setUser(firebaseUser as any);
          }
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin: user?.role === 'admin',
      isMerchant: user?.role === 'merchant' || (user?.managedStoreId ? user.managedStoreId.length > 0 : false),
      managedStoreId: user?.managedStoreId || null
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
