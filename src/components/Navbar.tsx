import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, ShoppingBag, LayoutDashboard, Briefcase } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { toast } from 'sonner';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { user, isAdmin, isMerchant } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized for login. Please check Firebase Console.');
      } else {
        toast.error('Login failed. Please try again.');
      }
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface border-b border-surface-alt px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <div className="bg-accent p-2 rounded-lg shadow-[0_0_15px_rgba(255,202,40,0.3)]">
          <ShoppingBag className="text-bg w-6 h-6" />
        </div>
        <span className="text-2xl font-bold text-accent tracking-tight">CampusKart</span>
      </Link>

      <div className="flex items-center gap-6">
        {isAdmin && (
          <Link to="/admin" className="hidden md:flex items-center gap-2 text-accent font-bold hover:opacity-80 transition-opacity">
            <LayoutDashboard className="w-5 h-5" />
            Admin
          </Link>
        )}
        {isMerchant && (
          <Link to="/merchant" className="hidden md:flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity">
            <Briefcase className="w-5 h-5" />
            Shop Manager
          </Link>
        )}
        {!user && (
          <Link to="/register-merchant" className="hidden md:block text-xs font-bold text-text-muted hover:text-accent transition-colors uppercase tracking-widest">
            Become a Merchant
          </Link>
        )}
        <Link to="/cart" className="relative p-2 hover:bg-surface-alt rounded-xl transition-all">
          <ShoppingCart className="w-6 h-6 text-text-muted hover:text-text-main" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-bg text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-surface">
              {totalItems}
            </span>
          )}
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-3 p-1.5 bg-surface-alt rounded-xl hover:opacity-90 transition-all">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-text-main leading-none">{user.displayName}</div>
                <div className="text-[10px] text-text-muted">{isMerchant ? 'Shop Manager' : isAdmin ? 'Administrator' : 'Campus Member'}</div>
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-5"
          >
            <User className="w-4 h-4" />
            Login
          </button>
        )}
      </div>
    </nav>
  );
};
