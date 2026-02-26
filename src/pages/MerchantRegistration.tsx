import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types';
import { Store as StoreIcon, Image as ImageIcon, Briefcase, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const CATEGORIES: Category[] = ['Food', 'Laundry', 'Stationery', 'Grocery'];

export const MerchantRegistration: React.FC = () => {
  const { user, isMerchant, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food' as Category,
    description: '',
    deliveryTime: '20-30 min',
    image: ''
  });

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <h2 className="text-3xl font-bold">Sign in to become a Merchant</h2>
        <p className="text-text-muted">You need to have an account to register your store on CampusKart.</p>
      </div>
    );
  }

  if (isMerchant || isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <h2 className="text-3xl font-bold">Already a Manager</h2>
        <p className="text-text-muted">You are already registered as a merchant or admin. Check your dashboard.</p>
        <button onClick={() => navigate(isAdmin ? '/admin' : '/merchant')} className="btn-primary px-8">Go to Dashboard</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.image) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const storeId = await firebaseService.registerMerchant(user.uid, formData);
      if (storeId) {
        toast.success('Merchant registration successful!');
        // Small delay to allow Firestore sync
        setTimeout(() => navigate('/merchant'), 2000);
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
              <Briefcase className="w-8 h-8 text-bg" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight">Open Your Store on <span className="text-accent underline decoration-4 underline-offset-8">CampusKart</span></h1>
            <p className="text-text-muted text-xl leading-relaxed">Join the fastest growing campus marketplace. Manage your items, track orders, and reach thousands of students in minutes.</p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="bg-surface-alt p-3 rounded-xl border border-surface-alt">
                <StoreIcon className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Real-time Management</h3>
                <p className="text-text-muted">Update your menu and view orders as they come in instantly.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="bg-surface-alt p-3 rounded-xl border border-surface-alt">
                <ArrowRight className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Direct Connect</h3>
                <p className="text-text-muted">Reach students directly in their hostels without any middlemen.</p>
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface p-10 rounded-[2.5rem] border border-surface-alt shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Store Name</label>
              <input 
                type="text" 
                placeholder="e.g. The Cool Cafe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none transition-all font-medium appearance-none cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Store Description</label>
              <textarea 
                placeholder="What do you sell? (e.g. Best burgers in town)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none transition-all font-medium h-24 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Cover Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-surface-alt border border-surface-alt p-4 pl-12 rounded-2xl focus:border-accent outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-5 text-lg font-black flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-bg"></div>
              ) : (
                <>
                  Register Store
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
