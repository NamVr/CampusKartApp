import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, CheckCircle2, Plus, MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Address } from '../types';

export const Cart: React.FC = () => {
  const { items, totalAmount, removeItem, addItem, clearCart, currentStoreId } = useCart();
  const { user } = useAuth();
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      firebaseService.getAddresses(user.uid).then(data => {
        setAddresses(data);
        if (data.length > 0) {
          const def = data.find(a => a.isDefault) || data[0];
          setSelectedAddress(def);
        }
      });
    }
  }, [user]);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a delivery point');
      return;
    }

    if (!currentStoreId) return;

    setIsOrdering(true);
    try {
      const stores = await firebaseService.getStores();
      const store = stores.find(s => s.id === currentStoreId);
      
      await firebaseService.createOrder({
        userId: user.uid,
        storeId: currentStoreId,
        storeName: store?.name || 'Unknown Store',
        items,
        totalAmount,
        status: 'pending',
        address: {
          label: selectedAddress.label,
          details: selectedAddress.details
        }
      });
      
      clearCart();
      setOrderComplete(true);
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-10">
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="bg-success px-10 py-10 rounded-[3rem] shadow-2xl shadow-success/20"
        >
          <CheckCircle2 className="w-32 h-32 text-bg" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-5xl font-black">Success!</h1>
          <p className="text-text-muted max-w-md mx-auto text-xl font-medium leading-relaxed">
            Your order has been received and is being processed. Sit back while we bring it to you.
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/profile" className="px-10 py-5 bg-accent text-bg rounded-[1.5rem] font-black tracking-widest uppercase text-sm hover:scale-105 transition-all">Track Order</Link>
          <Link to="/" className="px-10 py-5 bg-surface border-2 border-surface-alt text-text-main rounded-[1.5rem] font-black tracking-widest uppercase text-sm hover:bg-surface-alt transition-all">Browse More</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-10">
        <div className="bg-surface p-12 rounded-[3.5rem] border-2 border-dashed border-surface-alt">
          <ShoppingBag className="w-32 h-32 text-text-muted" />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter">Cart is empty</h1>
          <p className="text-text-muted text-xl font-medium">Add some items from your favorite campus stores!</p>
        </div>
        <Link to="/" className="btn-primary px-12 py-5 rounded-[2rem]">Explore Stores</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      <div className="space-y-2">
        <h1 className="text-5xl font-black tracking-tight">Checkout</h1>
        <p className="text-text-muted text-lg font-medium">Review your items and select delivery point.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Items Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <span className="w-2 h-8 bg-accent rounded-full"></span>
              Order Basket
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-surface p-6 rounded-[2.5rem] border border-surface-alt flex gap-6 items-center group hover:border-accent/40 transition-all">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-28 h-28 rounded-3xl object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-1">
                    <h3 className="text-2xl font-black group-hover:text-accent transition-colors">{item.name}</h3>
                    <p className="text-accent font-black text-xl">₹{Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-5 bg-surface-alt p-2 rounded-2xl border border-surface-alt">
                    <button onClick={() => removeItem(item.id)} className="w-10 h-10 flex items-center justify-center bg-surface hover:bg-accent hover:text-bg rounded-xl text-accent transition-all shadow-sm">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <span className="font-black text-xl w-6 text-center">{item.quantity}</span>
                    <button onClick={() => addItem(item)} className="w-10 h-10 flex items-center justify-center bg-surface hover:bg-accent hover:text-bg rounded-xl text-accent transition-all shadow-sm">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Point Section */}
          <section className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <span className="w-2 h-8 bg-success rounded-full"></span>
                  Delivery Point
                </h2>
                <Link to="/profile" className="text-accent font-bold text-sm flex items-center gap-1 hover:underline">
                  Manage Points <ChevronRight className="w-4 h-4" />
                </Link>
             </div>
             
             {addresses.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {addresses.map(addr => (
                   <button 
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all ${selectedAddress?.id === addr.id ? 'bg-accent/5 border-accent shadow-lg shadow-accent/5' : 'bg-surface border-surface-alt hover:border-accent/30'}`}
                   >
                     <div className="flex justify-between items-start mb-2">
                        <MapPin className={`w-6 h-6 ${selectedAddress?.id === addr.id ? 'text-accent' : 'text-text-muted'}`} />
                        {selectedAddress?.id === addr.id && <div className="bg-accent w-3 h-3 rounded-full"></div>}
                     </div>
                     <h4 className="font-black text-lg mb-1">{addr.label}</h4>
                     <p className="text-text-muted text-sm font-medium line-clamp-1">{addr.details}</p>
                   </button>
                 ))}
               </div>
             ) : (
               <div className="bg-surface p-12 rounded-[2.5rem] border-2 border-dashed border-surface-alt text-center space-y-4">
                  <p className="text-text-muted font-bold text-lg">No delivery points saved yet.</p>
                  <Link to="/profile" className="btn-outline inline-block px-10">Add Campus Point</Link>
               </div>
             )}
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-surface p-10 rounded-[3rem] border-2 border-surface-alt space-y-8 sticky top-36 shadow-2xl shadow-accent/5">
            <h3 className="text-3xl font-black">Bill Summary</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-text-muted font-bold uppercase tracking-widest text-xs italic">
                <span>Subtotal</span>
                <span className="text-lg text-text-main not-italic">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-text-muted font-bold uppercase tracking-widest text-xs italic">
                <span>Campus Delivery</span>
                <span className="text-success not-italic">FREE</span>
              </div>
              <div className="pt-6 border-t-2 border-surface-alt border-dashed flex justify-between items-center">
                <span className="text-2xl font-black">Total Paid</span>
                <span className="text-4xl font-black text-accent tracking-tighter">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={isOrdering || items.length === 0}
              className="w-full btn-primary flex items-center justify-center gap-4 py-6 text-xl rounded-[2rem] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isOrdering ? (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-bg"></div>
              ) : (
                <>
                  Confirm Order
                  <ArrowRight className="w-8 h-8" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">
              Instant confirmation • No hidden fees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
