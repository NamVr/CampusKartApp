import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { Store, MenuItem, Review } from '../types';
import { useCart } from '../context/CartContext';
import { Star, Clock, Plus, Minus, ShoppingBag, MessageSquare, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StoreDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const { addItem, removeItem, items } = useCart();

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const [stores, items, storeReviews] = await Promise.all([
        firebaseService.getStores(),
        firebaseService.getMenuItems(id),
        firebaseService.getReviews(id)
      ]);
      const foundStore = stores.find(s => s.id === id);
      if (foundStore) {
        setStore(foundStore);
        setMenuItems(items);
        setReviews(storeReviews);
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const getItemQuantity = (itemId: string) => {
    return items.find(i => i.id === itemId)?.quantity || 0;
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent"></div>
    </div>
  );
  if (!store) return <div className="text-center py-20 text-2xl font-black">Store not found</div>;

  return (
    <div className="space-y-12 pb-24">
      {/* Store Header Bio */}
      <div className="relative min-h-[24rem] rounded-[3.5rem] overflow-hidden border border-surface-alt shadow-2xl">
        <img 
          src={store.image} 
          alt={store.name} 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent flex flex-col justify-end p-8 md:p-14">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-10"
          >
            <div className="space-y-4 flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/20 backdrop-blur-md text-accent text-[10px] font-black rounded-full uppercase tracking-widest border border-accent/30">
                <ShoppingBag className="w-3 h-3" />
                {store.category} Verified
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight">{store.name}</h1>
              <p className="text-text-muted text-lg md:text-xl max-w-2xl font-medium leading-relaxed">{store.description}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-surface/90 backdrop-blur-xl px-6 py-4 rounded-3xl flex flex-col items-center gap-1 min-w-[100px] border border-surface-alt shadow-xl">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-accent fill-accent" />
                  <span className="font-black text-2xl">{store.rating}</span>
                </div>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{store.reviewCount} Reviews</span>
              </div>
              <div className="bg-surface/90 backdrop-blur-xl px-6 py-4 rounded-3xl flex flex-col items-center gap-1 min-w-[100px] border border-surface-alt shadow-xl">
                <Clock className="w-6 h-6 text-accent" />
                <span className="font-black text-2xl">{store.deliveryTime}</span>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Mins to Door</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <div className="bg-surface p-2 rounded-[2rem] border border-surface-alt flex gap-2">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-accent text-bg' : 'text-text-muted hover:bg-surface-alt'}`}
          >
            Explore Menu
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-accent text-bg' : 'text-text-muted hover:bg-surface-alt'}`}
          >
            User Reviews ({reviews.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'menu' ? (
          <motion.div 
            key="menu-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
          >
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                {menuItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    className="bg-surface p-6 rounded-[2.5rem] border border-surface-alt flex flex-col sm:flex-row gap-8 items-center hover:border-accent/40 transition-all group shadow-sm hover:shadow-xl hover:shadow-accent/5"
                  >
                    <div className="relative">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 bg-success text-bg text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                        Best Seller
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-3">
                      <div>
                        <h3 className="text-2xl font-black mb-1 group-hover:text-accent transition-colors">{item.name}</h3>
                        <p className="text-text-muted text-sm line-clamp-2 max-w-md font-medium">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-4">
                        <span className="text-accent text-2xl font-black tracking-tighter">₹{Number(item.price).toFixed(2)}</span>
                        {getItemQuantity(item.id) === 0 && (
                           <div className="w-1 h-1 rounded-full bg-surface-alt"></div>
                        )}
                        {getItemQuantity(item.id) === 0 && (
                          <span className="text-success text-[10px] font-extrabold uppercase tracking-widest">In Stock</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5 bg-surface-alt/50 p-2 rounded-[1.5rem] border border-surface-alt">
                      {getItemQuantity(item.id) > 0 ? (
                        <>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="w-12 h-12 flex items-center justify-center bg-surface hover:bg-accent hover:text-bg rounded-xl transition-all text-accent shadow-sm"
                          >
                            <Minus className="w-6 h-6" />
                          </button>
                          <span className="font-black text-xl w-8 text-center">{getItemQuantity(item.id)}</span>
                          <button 
                            onClick={() => addItem(item)}
                            className="w-12 h-12 flex items-center justify-center bg-surface hover:bg-accent hover:text-bg rounded-xl transition-all text-accent shadow-sm"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => addItem(item)}
                          className="px-10 py-4 bg-accent text-bg rounded-[1.25rem] font-black text-sm hover:translate-y-[-2px] hover:shadow-lg hover:shadow-accent/30 transition-all active:scale-95"
                        >
                          ADD TO CART
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block space-y-8">
              <div className="bg-surface p-10 rounded-[3rem] border-2 border-surface-alt space-y-8 sticky top-36">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black">Store Bio</h3>
                  <div className="w-12 h-1.5 bg-accent rounded-full"></div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-6 border-b border-surface-alt/50">
                    <span className="text-text-muted font-bold text-sm uppercase tracking-widest italic">Safety Score</span>
                    <span className="font-black text-success flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-success" />
                      100% Secure
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-6 border-b border-surface-alt/50">
                    <span className="text-text-muted font-bold text-sm uppercase tracking-widest italic">Min. Order</span>
                    <span className="font-black">₹0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold text-sm uppercase tracking-widest italic">Wait Time</span>
                    <span className="px-5 py-2 bg-success/10 text-success text-[10px] font-black rounded-full uppercase tracking-widest">Low</span>
                  </div>
                </div>
                
                <div className="p-6 bg-accent/5 rounded-[2rem] border border-accent/10 space-y-4">
                  <p className="text-sm font-medium text-text-muted leading-relaxed italic">
                    "This store is one of our top-rated partners. Experience the best of campus delicacies here."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-bg font-black text-xs">CK</div>
                    <span className="text-[10px] font-black uppercase tracking-widest">CampusKart Elite</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="reviews-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto space-y-10"
          >
            {/* Review Summary */}
            <div className="bg-surface p-10 rounded-[3rem] border-2 border-surface-alt flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
              <div className="space-y-2">
                <h3 className="text-6xl font-black text-accent">{Number(store.rating || 0).toFixed(1)}</h3>
                <div className="flex justify-center md:justify-start gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-6 h-6 ${s <= Math.round(store.rating) ? 'fill-accent text-accent' : 'text-surface-alt'}`} />
                  ))}
                </div>
                <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Aggregate Rating</p>
              </div>
              <div className="flex-1 w-full space-y-3">
                {[5, 4, 3, 2, 1].map(r => (
                  <div key={r} className="flex items-center gap-4">
                    <span className="text-xs font-black min-w-[1.5rem]">{r} ★</span>
                    <div className="flex-1 h-3 bg-surface-alt rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full transition-all duration-1000" 
                        style={{ width: `${r === 5 ? 85 : r === 4 ? 10 : 5}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-text-muted">
                      {r === 5 ? '85%' : r === 4 ? '10%' : '5%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              {reviews.length > 0 ? reviews.map((review, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={review.id} 
                  className="bg-surface p-8 rounded-[2.5rem] border border-surface-alt space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      {review.userPhoto ? (
                        <img src={review.userPhoto} alt={review.userName} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center">
                          <User className="w-6 h-6 text-text-muted" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-black text-lg">{review.userName}</h4>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-accent text-accent' : 'text-surface-alt'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                      {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-text-main font-medium leading-relaxed italic border-l-4 border-accent/20 pl-6">
                    "{review.comment}"
                  </p>
                </motion.div>
              )) : (
                <div className="py-24 text-center bg-surface border-2 border-dashed border-surface-alt rounded-[3rem] space-y-4">
                  <MessageSquare className="w-16 h-16 text-text-muted mx-auto opacity-20" />
                  <p className="text-text-muted text-xl font-black">No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper component for safety check
const CheckCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
