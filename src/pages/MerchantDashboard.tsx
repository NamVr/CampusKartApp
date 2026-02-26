import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { Order, Store, MenuItem, OrderStatus } from '../types';
import { 
  Store as StoreIcon, 
  ShoppingBag, 
  Settings, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit2,
  Plus,
  Trash2,
  Save,
  X,
  Package,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const MerchantDashboard: React.FC = () => {
  const { user, isMerchant, managedStoreId, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  
  // Edit States
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [deletingMenuItem, setDeletingMenuItem] = useState<string | null>(null);

  useEffect(() => {
    if (!managedStoreId) return;

    // Static fetches
    const fetchMetadata = async () => {
      try {
        const [storeData, items] = await Promise.all([
          firebaseService.getStore(managedStoreId),
          firebaseService.getMenuItems(managedStoreId)
        ]);
        
        // Auto-migrate store and user documents for security rules
        if (storeData && user) {
          const updates: any = {};
          if (!storeData.merchantId) {
            await firebaseService.updateStore(managedStoreId, { merchantId: user.uid });
            storeData.merchantId = user.uid;
          }
          
          // Also ensure User document has the correct role and store link
          if (user.role !== 'merchant' || user.managedStoreId !== managedStoreId) {
            await firebaseService.syncUserProfile({
              ...user,
              role: 'merchant',
              managedStoreId
            } as any);
          }
        }

        setStore(storeData);
        setMenuItems(items);
      } catch (error) {
        toast.error('Failed to load store metadata');
      }
    };
    fetchMetadata();

    // Subscribe to orders real-time
    const unsubscribe = firebaseService.subscribeToStoreOrders(managedStoreId, (updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [managedStoreId]);

  const loadData = async () => {
    if (!managedStoreId) return;
    try {
      const [storeData, items] = await Promise.all([
        firebaseService.getStore(managedStoreId),
        firebaseService.getMenuItems(managedStoreId)
      ]);
      setStore(storeData);
      setMenuItems(items);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  const handleStatusUpdate = async (order: Order, status: OrderStatus) => {
    const statusOrder: OrderStatus[] = ['pending', 'preparing', 'out-for-delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);
    const newIndex = statusOrder.indexOf(status);

    // Terminal states cannot be changed
    if (order.status === 'delivered') {
      toast.error('Order is already delivered and locked.');
      return;
    }
    if (order.status === 'cancelled') {
      toast.error('Order is cancelled and locked.');
      return;
    }

    if (status === 'cancelled') {
      // User can cancel it later if they want but usually merchants cancel pending ones
      // Let's allow cancelling unless it's delivered (handled above)
    } else if (newIndex <= currentIndex) {
      toast.error('Status can only move forward (e.g., Preparing -> On the Way)');
      return;
    }

    try {
      await firebaseService.updateOrderStatus(order.id, status);
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !store.id) {
      toast.error('Store data is missing or not loaded correctly.');
      return;
    }

    if (store.id !== managedStoreId && !isAdmin) {
      toast.error('Unauthorized: Managed store ID mismatch.');
      return;
    }
    
    setSavingStore(true);
    try {
      await firebaseService.updateStore(store.id, store);
      toast.success('Store settings updated');
    } catch (error) {
      console.error('Update Store Error:', error);
      toast.error('Failed to update store. Check your permissions.');
    } finally {
      setSavingStore(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!managedStoreId) return;
    const newItem: Omit<MenuItem, 'id'> = {
      storeId: managedStoreId,
      merchantId: user?.uid, // Added for security
      name: 'New Item',
      price: 0,
      description: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&h=200&auto=format&fit=crop',
      category: 'General'
    };
    try {
      const id = await firebaseService.addMenuItem(newItem);
      setMenuItems(prev => [...prev, { ...newItem, id }]);
      toast.success('New item added to menu');
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleUpdateMenuItem = async (item: MenuItem) => {
    try {
      await firebaseService.updateMenuItem(item.id, item);
      setMenuItems(prev => prev.map(i => i.id === item.id ? item : i));
      toast.success('Menu item updated');
      setEditingMenuItem(null);
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      await firebaseService.deleteMenuItem(itemId);
      setMenuItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setDeletingMenuItem(null);
    }
  };

  if (!isMerchant) return <div className="text-center py-20 text-2xl font-bold">Access Denied</div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const revenue = Number(orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(2));

  if (!managedStoreId) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="bg-surface p-12 rounded-[3rem] border-2 border-surface-alt shadow-2xl space-y-6">
          <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
            <LayoutDashboard className="w-12 h-12 text-accent" />
          </div>
          <h2 className="text-3xl font-black">Store Not Found</h2>
          <p className="text-text-muted font-medium max-w-md mx-auto">
            Your account is not currently linked to a managed store. If you just registered, please wait a moment or try logging in again.
          </p>
          <button onClick={() => navigate('/register-merchant')} className="btn-primary px-8 py-3 rounded-2xl">
            Register a Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tight flex items-center gap-4">
            <StoreIcon className="w-12 h-12 text-accent" />
            {store?.name}
          </h1>
          <p className="text-text-muted text-lg">Manage your storefront and track live orders</p>
        </div>
        
        <div className="flex bg-surface p-1.5 rounded-2xl border border-surface-alt">
          {(['orders', 'inventory', 'settings'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all capitalize ${activeTab === tab ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'hover:bg-surface-alt text-text-muted'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-8 rounded-3xl border border-surface-alt flex items-center gap-6">
          <div className="bg-accent/10 p-4 rounded-2xl"><Package className="w-8 h-8 text-accent" /></div>
          <div>
            <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Active Orders</p>
            <p className="text-3xl font-black">{pendingOrders.length}</p>
          </div>
        </div>
        <div className="bg-surface p-8 rounded-3xl border border-surface-alt flex items-center gap-6">
          <div className="bg-success/10 p-4 rounded-2xl"><TrendingUp className="w-8 h-8 text-success" /></div>
          <div>
            <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Total Revenue</p>
            <p className="text-3xl font-black">₹{revenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-surface p-8 rounded-3xl border border-surface-alt flex items-center gap-6">
          <div className="bg-blue-500/10 p-4 rounded-2xl"><CheckCircle className="w-8 h-8 text-blue-500" /></div>
          <div>
            <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Total Orders</p>
            <p className="text-3xl font-black">{orders.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-40">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-accent"></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {orders.length > 0 ? orders.map((order) => (
                <div key={order.id} className="bg-surface p-8 rounded-[2.5rem] border border-surface-alt space-y-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold uppercase">{order.status}</h3>
                        <span className="text-text-muted text-sm font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <p className="text-accent font-black text-xl">₹{Number(order.totalAmount).toFixed(2)}</p>
                      <p className="text-text-muted text-sm">{new Date(order.createdAt?.seconds * 1000).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(order, status)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            order.status === status 
                              ? 'bg-accent text-bg shadow-lg shadow-accent/20 border-accent' 
                              : 'border-surface-alt hover:border-accent/50 text-text-muted'
                          }`}
                        >
                          {status.replace(/-/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-surface-alt">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-surface-alt p-4 rounded-2xl flex justify-between items-center border border-surface-alt/50">
                        <span className="font-medium">{item.name}</span>
                        <span className="bg-accent/10 text-accent px-3 py-1 rounded-lg font-bold text-[10px]">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-surface border border-dashed border-surface-alt rounded-3xl">
                  <p className="text-xl text-text-muted">No orders received yet.</p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'inventory' ? (
            <motion.div 
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Store Menu</h2>
                <button onClick={handleAddMenuItem} className="btn-primary py-3 px-8 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Item
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div key={item.id} className="bg-surface p-6 rounded-3xl border border-surface-alt flex flex-col gap-4 group">
                    <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-2xl" referrerPolicy="no-referrer" />
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xl font-bold">{item.name}</h4>
                        <span className="text-accent font-black">₹{item.price}</span>
                      </div>
                      <p className="text-text-muted text-sm line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setEditingMenuItem(item)}
                        className="flex-1 bg-surface-alt py-3 rounded-xl font-bold hover:bg-accent hover:text-bg transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeletingMenuItem(item.id)}
                        className="px-3 bg-surface-alt rounded-xl hover:bg-red-500 hover:text-bg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
             <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto bg-surface p-10 rounded-[2.5rem] border border-surface-alt"
            >
              <form onSubmit={handleUpdateStore} className="space-y-6">
                <h2 className="text-3xl font-bold mb-8">Store Settings</h2>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Store Name</label>
                  <input 
                    type="text" 
                    value={store?.name || ''}
                    onChange={(e) => setStore(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      value={store?.description || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, description: e.target.value } : null)}
                      className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none h-32 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Delivery Time</label>
                    <input 
                      type="text" 
                      value={store?.deliveryTime || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, deliveryTime: e.target.value } : null)}
                      className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Cover Image URL</label>
                    <input 
                      type="text" 
                      value={store?.image || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, image: e.target.value } : null)}
                      className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none"
                    />
                  </div>
                <button 
                  type="submit" 
                  disabled={savingStore}
                  className="w-full btn-primary py-5 text-lg font-black flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingStore ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-bg"></div>
                  ) : (
                    <Save className="w-6 h-6" />
                  )}
                  {savingStore ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Menu Item Edit Modal */}
      {editingMenuItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-bg/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-surface-alt w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Edit Menu Item</h3>
              <button onClick={() => setEditingMenuItem(null)} className="p-2 hover:bg-surface-alt rounded-full transition-colors">
                <X className="w-6 h-6 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Item Name</label>
                <input 
                  type="text" 
                  value={editingMenuItem.name}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                  className="w-full bg-surface-alt border border-surface-alt p-3 rounded-xl focus:border-accent outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Price (₹)</label>
                <input 
                  type="number" 
                  value={editingMenuItem.price || 0}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface-alt border border-surface-alt p-3 rounded-xl focus:border-accent outline-none"
                />
              </div>
               <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Description</label>
                <textarea 
                  value={editingMenuItem.description}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                  className="w-full bg-surface-alt border border-surface-alt p-3 rounded-xl focus:border-accent outline-none resize-none h-20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Image URL</label>
                <input 
                  type="text" 
                  value={editingMenuItem.image}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, image: e.target.value })}
                  className="w-full bg-surface-alt border border-surface-alt p-3 rounded-xl focus:border-accent outline-none"
                />
              </div>
            </div>

            <button 
              onClick={() => handleUpdateMenuItem(editingMenuItem)}
              className="w-full btn-primary py-4 rounded-xl font-bold shadow-lg shadow-accent/20"
            >
              Update Item
            </button>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMenuItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-surface-alt w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 space-y-6 text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">Delete Item?</h3>
            <p className="text-text-muted font-medium">This action cannot be undone. Are you sure you want to permanently remove this menu item?</p>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setDeletingMenuItem(null)} 
                className="flex-1 py-4 font-bold text-text-muted hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteMenuItem(deletingMenuItem)} 
                className="flex-1 bg-red-500 text-white rounded-2xl font-bold py-4 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
