import React, { useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { Order, Store, MenuItem, OrderStatus } from '../types';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Store as StoreIcon, 
  Settings, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit2,
  Plus,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const Admin: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'stores'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit States
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeMenuItems, setStoreMenuItems] = useState<MenuItem[]>([]);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allOrders, allStores] = await Promise.all([
        firebaseService.getAllOrders(),
        firebaseService.getStores()
      ]);
      setOrders(allOrders);
      setStores(allStores);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const statusOrder: OrderStatus[] = ['pending', 'preparing', 'out-for-delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);
    const newIndex = statusOrder.indexOf(status);

    if (order.status === 'delivered' || order.status === 'cancelled') {
      toast.error('Terminal state order is locked.');
      return;
    }

    if (status !== 'cancelled' && newIndex <= currentIndex) {
      toast.error('Orders must progress forward (e.g. Preparing -> Out for Delivery)');
      return;
    }

    try {
      await firebaseService.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleEditStore = async (store: Store) => {
    setEditingStore(store);
    const items = await firebaseService.getMenuItems(store.id);
    setStoreMenuItems(items);
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    try {
      await firebaseService.updateStore(editingStore.id, editingStore);
      setStores(prev => prev.map(s => s.id === editingStore.id ? editingStore : s));
      toast.success('Store updated successfully');
      setEditingStore(null);
    } catch (error) {
      toast.error('Failed to update store');
    }
  };

  const handleAddMenuItem = async () => {
    if (!editingStore) return;
    const newItem: Omit<MenuItem, 'id'> = {
      storeId: editingStore.id,
      name: 'New Item',
      price: 0,
      description: '',
      image: 'https://picsum.photos/seed/newitem/200/200',
      category: 'General'
    };
    try {
      const id = await firebaseService.addMenuItem(newItem);
      setStoreMenuItems(prev => [...prev, { ...newItem, id }]);
      toast.success('Item added');
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleUpdateMenuItem = async (item: MenuItem) => {
    try {
      await firebaseService.updateMenuItem(item.id, item);
      setStoreMenuItems(prev => prev.map(i => i.id === item.id ? item : i));
      toast.success('Item updated');
      setEditingMenuItem(null);
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await firebaseService.deleteMenuItem(itemId);
      setStoreMenuItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  if (authLoading) return null;
  if (!isAdmin) return <div className="text-center py-20 text-2xl font-bold">Access Denied</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-5xl font-extrabold tracking-tight flex items-center gap-4">
          <LayoutDashboard className="w-12 h-12 text-accent" />
          Admin Dashboard
        </h1>
        
        <div className="flex bg-surface p-1.5 rounded-2xl border border-surface-alt">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'hover:bg-surface-alt text-text-muted'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('stores')}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'stores' ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'hover:bg-surface-alt text-text-muted'}`}
          >
            <StoreIcon className="w-5 h-5" />
            Stores
          </button>
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {orders.map((order) => (
                <div key={order.id} className="bg-surface p-8 rounded-[2.5rem] border border-surface-alt space-y-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold">{order.storeName}</h3>
                        <span className="text-text-muted text-sm font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-4 text-text-muted text-sm">
                        <span className="font-bold text-accent text-lg">₹{Number(order.totalAmount).toFixed(2)}</span>
                        <div className="w-1 h-1 rounded-full bg-surface-alt"></div>
                        <span>{order.items.length} items</span>
                        <div className="w-1 h-1 rounded-full bg-surface-alt"></div>
                        <span>{new Date(order.createdAt.seconds * 1000).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(order.id, status)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                            order.status === status 
                              ? 'bg-accent text-bg border-accent shadow-lg shadow-accent/20' 
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
                      <div key={idx} className="bg-surface-alt p-4 rounded-2xl flex justify-between items-center">
                        <span className="font-medium">{item.name}</span>
                        <span className="bg-accent/10 text-accent px-3 py-1 rounded-lg font-bold text-xs">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="stores"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {stores.map((store) => (
                <div key={store.id} className="bg-surface p-8 rounded-[2.5rem] border border-surface-alt space-y-6 group">
                  <div className="flex gap-6 items-start">
                    <img src={store.image} alt={store.name} className="w-24 h-24 rounded-3xl object-cover border-2 border-surface-alt" referrerPolicy="no-referrer" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold">{store.name}</h3>
                        <button 
                          onClick={() => handleEditStore(store)}
                          className="p-3 bg-accent/10 text-accent rounded-2xl hover:bg-accent hover:text-bg transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-text-muted text-sm line-clamp-2">{store.description}</p>
                      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                        <span className="text-accent">{store.category}</span>
                        <span className="text-success">★ {store.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Store Edit Modal */}
      {editingStore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-surface-alt w-full max-w-4xl rounded-[3rem] shadow-2xl my-8"
          >
            <div className="p-10 space-y-10">
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-extrabold tracking-tight">Edit Store</h2>
                <button onClick={() => setEditingStore(null)} className="p-3 hover:bg-surface-alt rounded-full transition-colors">
                  <X className="w-8 h-8 text-text-muted" />
                </button>
              </div>

              <form onSubmit={handleUpdateStore} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Store Name</label>
                    <input 
                      type="text" 
                      value={editingStore.name}
                      onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                      className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      value={editingStore.description}
                      onChange={(e) => setEditingStore({ ...editingStore, description: e.target.value })}
                      className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none transition-all font-medium h-32 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Rating</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={editingStore.rating || 0}
                        onChange={(e) => setEditingStore({ ...editingStore, rating: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Delivery Time</label>
                      <input 
                        type="text" 
                        value={editingStore.deliveryTime}
                        onChange={(e) => setEditingStore({ ...editingStore, deliveryTime: e.target.value })}
                        className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted uppercase tracking-widest ml-1">Image URL</label>
                    <input 
                      type="text" 
                      value={editingStore.image}
                      onChange={(e) => setEditingStore({ ...editingStore, image: e.target.value })}
                      className="w-full bg-surface-alt border border-surface-alt p-4 rounded-2xl focus:border-accent outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="bg-surface-alt p-6 rounded-3xl border border-surface-alt space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold">Menu Items</h4>
                      <button 
                        type="button" 
                        onClick={handleAddMenuItem}
                        className="p-2 bg-accent text-bg rounded-xl hover:scale-105 transition-transform"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {storeMenuItems.map((item) => (
                        <div key={item.id} className="bg-surface p-3 rounded-2xl border border-surface-alt flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <img src={item.image} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-sm font-bold">{item.name}</p>
                              <p className="text-xs text-accent">₹{item.price}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => setEditingMenuItem(item)}
                              className="p-2 hover:bg-surface-alt rounded-lg text-text-muted hover:text-accent transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteMenuItem(item.id)}
                              className="p-2 hover:bg-surface-alt rounded-lg text-text-muted hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full btn-primary py-5 text-lg flex items-center justify-center gap-3">
                    <Save className="w-6 h-6" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
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
                  className="w-full bg-surface-alt border border-surface-alt p-3 rounded-xl focus:border-accent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Price (₹)</label>
                <input 
                  type="number" 
                  value={editingMenuItem.price || 0}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface-alt border border-surface-alt p-3 rounded-xl focus:border-accent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Image URL</label>
                <input 
                  type="text" 
                  value={editingMenuItem.image}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, image: e.target.value })}
                  className="w-full bg-surface-alt border border-surface-alt p-3 rounded-xl focus:border-accent outline-none transition-all"
                />
              </div>
            </div>

            <button 
              onClick={() => handleUpdateMenuItem(editingMenuItem)}
              className="w-full btn-primary py-4 rounded-xl font-bold"
            >
              Update Item
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
