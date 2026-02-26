import React, { useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { Order, Address, Review } from '../types';
import { Clock, CheckCircle, XCircle, ChevronRight, MapPin, Plus, Trash2, Star, MessageSquare, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { OrderStepper } from '../components/OrderStepper';

export const Profile: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<Order | null>(null);
  
  const [newAddress, setNewAddress] = useState({ label: '', details: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    // Static fetch for addresses
    const fetchAddresses = async () => {
      try {
        const addrData = await firebaseService.getAddresses(user.uid);
        setAddresses(addrData);
      } catch (error) {
        toast.error('Failed to load addresses');
      }
    };
    fetchAddresses();

    // Subscribe to orders real-time
    const unsubscribe = firebaseService.subscribeToUserOrders(user.uid, (updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const loadData = async () => {
    // This is now partially handled by the subscription, 
    // but we can keep it for manual refresh if needed or just remove it.
    if (!user) return;
    try {
      const addrData = await firebaseService.getAddresses(user.uid);
      setAddresses(addrData);
    } catch (error) {
      toast.error('Failed to load profile data');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAddress.label || !newAddress.details) return;
    try {
      await firebaseService.addAddress(user.uid, { ...newAddress, isDefault: false });
      toast.success('Address saved');
      setNewAddress({ label: '', details: '' });
      setShowAddressModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await firebaseService.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address removed');
    } catch (error) {
      toast.error('Failed to remove address');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showReviewModal) return;
    try {
      await firebaseService.addReview({
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL,
        storeId: showReviewModal.storeId,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      toast.success('Thank you for your review!');
      setShowReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      toast.error('Failed to post review');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await firebaseService.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error('Order cancellation failed');
    }
  };

  if (!user) return <div className="text-center py-20">Please login to view your profile.</div>;

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* User Info Header */}
      <div className="bg-surface p-12 rounded-[3.5rem] border border-surface-alt flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-accent/5">
        <div className="relative group">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="Profile" 
            className="w-40 h-40 rounded-full border-8 border-accent/10 group-hover:border-accent/30 transition-all duration-500 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-2 -right-2 bg-accent p-3 rounded-2xl shadow-xl shadow-accent/20 border-4 border-surface">
            <Star className="w-6 h-6 text-bg fill-bg" />
          </div>
        </div>
        <div className="text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tight">{user.displayName}</h1>
            <p className="text-text-muted text-xl font-medium">{user.email}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
             <span className="px-5 py-2 bg-accent/10 text-accent text-xs font-black rounded-full uppercase tracking-[0.15em] border border-accent/20">
              Verified Campus User
            </span>
            <span className="px-5 py-2 bg-success/10 text-success text-xs font-black rounded-full uppercase tracking-[0.15em] border border-success/20">
              {orders.length} Orders Placed
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Addresses & Stats */}
        <div className="lg:col-span-1 space-y-12">
          {/* Addresses Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <MapPin className="text-accent w-6 h-6" />
                Campus Points
              </h2>
              <button 
                onClick={() => setShowAddressModal(true)}
                className="p-2 bg-surface hover:bg-accent hover:text-bg rounded-xl border border-surface-alt transition-all group"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {addresses.length > 0 ? addresses.map(addr => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={addr.id} 
                  className="bg-surface p-5 rounded-3xl border border-surface-alt flex justify-between items-start group hover:border-accent/50 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-text-main flex items-center gap-2">
                      {addr.label}
                      {addr.isDefault && <span className="bg-accent/10 text-accent text-[8px] px-2 py-0.5 rounded-full">Default</span>}
                    </h4>
                    <p className="text-text-muted text-sm leading-relaxed">{addr.details}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-2 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )) : (
                <div className="py-10 text-center bg-surface border-2 border-dashed border-surface-alt rounded-3xl text-text-muted font-medium">
                  Save your room or wing details
                </div>
              )}
            </div>
          </section>

          {/* User Review Stats or Badges could go here */}
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2 space-y-12">
          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-accent flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Live Tracking
              </h2>
              <div className="space-y-6">
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-surface p-8 rounded-[2.5rem] border-2 border-accent/20 shadow-xl shadow-accent/5 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black">{order.storeName}</h3>
                        <p className="text-xs font-mono text-text-muted uppercase tracking-widest">#{order.id.slice(-8)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-accent">₹{Number(order.totalAmount).toFixed(2)}</span>
                        <p className="text-xs text-text-muted">{order.items.length} Items</p>
                      </div>
                    </div>
                    
                    <OrderStepper status={order.status} />
                    
                    <div className="flex items-center justify-between pt-4 border-t border-surface-alt">
                      <div className="flex items-center gap-2 text-text-muted text-sm">
                        <MapPin className="w-4 h-4 text-accent" />
                        <span>{order.address?.label || 'Direct Delivery'}</span>
                      </div>
                      <button 
                         onClick={() => setSelectedOrder(order)}
                         className="font-bold text-accent text-sm hover:underline"
                      >
                        View Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past Orders */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-text-muted" />
              Past Orders
            </h2>
            <div className="space-y-4">
              {pastOrders.length > 0 ? pastOrders.map(order => (
                <div key={order.id} className="bg-surface p-6 rounded-3xl border border-surface-alt group hover:border-accent/30 transition-all">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex gap-4 items-center">
                      <div className={`p-3 rounded-2xl ${order.status === 'delivered' ? 'bg-success/10' : 'bg-red-500/10'}`}>
                        {order.status === 'delivered' ? <CheckCircle className="w-6 h-6 text-success" /> : <XCircle className="w-6 h-6 text-red-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg group-hover:text-accent transition-colors">{order.storeName}</h4>
                        <p className="text-text-muted text-xs">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()} • ₹{Number(order.totalAmount).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {order.status === 'delivered' && (
                        <button 
                          onClick={() => setShowReviewModal(order)}
                          className="px-4 py-2 bg-surface-alt hover:bg-accent hover:text-bg rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Review
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-surface-alt rounded-xl transition-all"
                      >
                        <ChevronRight className="w-5 h-5 text-text-muted" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center bg-surface border border-surface-alt rounded-[3rem] text-text-muted">
                  No order history found.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border-2 border-surface-alt w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl"
            >
              <h3 className="text-3xl font-black">Add Campus Point</h3>
              <form onSubmit={handleAddAddress} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] ml-1">Point Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hostel Alpha"
                    className="w-full bg-surface-alt border-2 border-surface-alt p-4 rounded-2xl focus:border-accent outline-none font-bold"
                    value={newAddress.label}
                    onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] ml-1">Specific Details</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Wing B, Room 302"
                    className="w-full bg-surface-alt border-2 border-surface-alt p-4 rounded-2xl focus:border-accent outline-none font-bold"
                    value={newAddress.details}
                    onChange={e => setNewAddress({...newAddress, details: e.target.value})}
                    required
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 py-4 font-bold text-text-muted hover:text-text-main transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary py-4 rounded-2xl">Save Point</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border-2 border-surface-alt w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="text-3xl font-black">Love the food?</h3>
                <p className="text-text-muted font-medium">Your review for <span className="text-accent">{showReviewModal.storeName}</span> helps others choose better.</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-8">
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => setReviewForm({...reviewForm, rating: star})}
                      className="transition-transform active:scale-90"
                    >
                      <Star className={`w-12 h-12 ${star <= reviewForm.rating ? 'fill-accent text-accent' : 'text-surface-alt'}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] ml-1">Your Experience</label>
                  <textarea 
                    placeholder="The packaging was great and the food was hot!"
                    className="w-full bg-surface-alt border-2 border-surface-alt p-5 rounded-3xl focus:border-accent outline-none font-medium h-32 resize-none"
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowReviewModal(null)} className="flex-1 py-4 font-bold text-text-muted hover:text-text-main transition-colors">Skip</button>
                  <button type="submit" className="flex-2 btn-primary py-4 rounded-2xl flex items-center justify-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    Post Review
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal (Expanded for Stepper) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-bg/95 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border-2 border-surface-alt w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-4xl font-black">{selectedOrder.storeName}</h3>
                  <div className="flex items-center gap-2 text-text-muted">
                    <span className="font-mono bg-surface-alt px-2 py-0.5 rounded text-[10px] tracking-widest uppercase">#{selectedOrder.id.slice(-8)}</span>
                    <span>•</span>
                    <span className="text-xs font-bold uppercase tracking-widest">{new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-3 bg-surface-alt hover:bg-accent hover:text-bg rounded-2xl transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Live Tracking in Receipt */}
              <div className="bg-surface-alt/30 p-8 rounded-[2rem] border border-surface-alt/50">
                 <OrderStepper status={selectedOrder.status} />
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.25em] flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-surface-alt"></span>
                  Order Summary
                  <span className="w-8 h-[1px] bg-surface-alt"></span>
                </h4>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex gap-4 items-center">
                        <span className="bg-accent/10 w-10 h-10 flex items-center justify-center rounded-xl text-accent font-black text-sm">{item.quantity}×</span>
                        <div className="space-y-0.5">
                          <span className="font-black text-lg group-hover:text-accent transition-colors">{item.name}</span>
                          <p className="text-xs text-text-muted">₹{Number(item.price).toFixed(2)} each</p>
                        </div>
                      </div>
                      <span className="font-black text-lg">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-surface-alt">
                <div className="flex justify-between text-text-muted font-bold">
                  <span>Subtotal</span>
                  <span>₹{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-bold">Delivery Point</span>
                  <span className="bg-surface-alt text-text-main px-3 py-1 rounded-lg text-xs font-black">{selectedOrder.address?.label || 'Direct'}</span>
                </div>
                <div className="flex justify-between text-3xl font-black text-accent pt-6 border-t-2 border-surface-alt border-dashed">
                   <span>Total Due</span>
                   <span>₹{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
