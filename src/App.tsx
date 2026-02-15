import React, { Component, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { firebaseService } from './services/firebaseService';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { StoreDetail } from './pages/StoreDetail';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { MerchantRegistration } from './pages/MerchantRegistration';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { PWAPrompt } from './components/PWAPrompt';

function AppContent() {
  const { loading } = useAuth();

  useEffect(() => {
    firebaseService.testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-background pb-12">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 pt-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/store/:id" element={<StoreDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/register-merchant" element={<MerchantRegistration />} />
              <Route path="/merchant" element={<MerchantDashboard />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Toaster position="bottom-center" richColors />
          <PWAPrompt />
        </div>
      </Router>
    </CartProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
