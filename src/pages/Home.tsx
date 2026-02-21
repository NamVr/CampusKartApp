import React, { useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { Store, Category, MenuItem } from '../types';
import { StoreCard } from '../components/StoreCard';
import { Search, Heart, ShoppingBag, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const CATEGORIES: Category[] = ['Food', 'Laundry', 'Stationery', 'Grocery'];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [favorites, setFavorites] = useState<Store[]>([]);
  const [searchResults, setSearchResults] = useState<{ stores: Store[], items: (MenuItem & { store: Store })[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await firebaseService.seedData(); 
      const [allStores, favs] = await Promise.all([
        firebaseService.getStores(),
        user ? firebaseService.getFavorites(user.uid) : Promise.resolve([])
      ]);
      setStores(allStores);
      setFavorites(favs);
      setLoading(false);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        return;
      }
      const results = await firebaseService.globalSearch(searchQuery);
      setSearchResults(results);
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredStores = stores.filter(s => 
    selectedCategory === 'All' || s.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[18rem] md:h-80 rounded-[2.5rem] overflow-hidden bg-surface border border-surface-alt flex items-center px-6 md:px-12 py-10 shadow-xl shadow-accent/5">
        <div className="relative z-10 max-w-2xl space-y-6 text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-black uppercase tracking-widest"
          >
            <Star className="w-3 h-3 fill-accent" />
            Voted Best Campus App 2026
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
            Campus <span className="text-accent">Essentials</span>,<br className="hidden md:block" /> Delivered Fast.
          </h1>
          <p className="text-text-muted text-lg md:text-2xl max-w-md font-medium leading-relaxed">Everything you need for hostel life, brought to your doorstep in minutes.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-full md:w-1/2 bg-gradient-to-l from-accent/15 via-accent/5 to-transparent pointer-events-none"></div>
      </section>

      {/* Search & Filter */}
      <div className="sticky top-24 z-30 space-y-6 py-4 bg-bg/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted w-6 h-6 transition-colors group-focus-within:text-accent" />
            <input 
              type="text" 
              placeholder="Search food, stationery, snacks, laundry..."
              className="w-full bg-surface border-2 border-surface-alt pl-14 pr-6 py-4 rounded-[1.5rem] focus:outline-none focus:border-accent transition-all font-bold text-lg shadow-lg shadow-accent/5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar scroll-smooth">
            <button 
              onClick={() => setSelectedCategory('All')}
              className={`cat-pill whitespace-nowrap min-w-max transition-all ${selectedCategory === 'All' ? 'cat-pill-active' : 'hover:bg-surface-alt'}`}
            >
              All Items
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`cat-pill whitespace-nowrap min-w-max transition-all ${selectedCategory === cat ? 'cat-pill-active' : 'hover:bg-surface-alt'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {searchQuery.trim() && searchResults ? (
          <motion.div 
            key="search-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            {searchResults.stores.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-3xl font-black text-text-main flex items-center gap-3">
                  <span className="w-2 h-8 bg-accent rounded-full"></span>
                  Matching Stores
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {searchResults.stores.map(store => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              </section>
            )}

            {searchResults.items.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-3xl font-black text-text-main flex items-center gap-3">
                  <span className="w-2 h-8 bg-primary rounded-full"></span>
                  Best Matches
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.items.map((item, idx) => (
                    <Link 
                      key={idx}
                      to={`/store/${item.storeId}`}
                      className="flex gap-4 p-4 bg-surface border border-surface-alt rounded-3xl hover:border-accent group transition-all"
                    >
                      <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-lg group-hover:text-accent">{item.name}</h4>
                          <span className="text-accent font-black">₹{item.price}</span>
                        </div>
                        <p className="text-text-muted text-sm line-clamp-2">{item.description}</p>
                        <div className="pt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                          <ShoppingBag className="w-3 h-3" />
                          {item.store.name}
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {searchResults.stores.length === 0 && searchResults.items.length === 0 && (
              <div className="text-center py-20 bg-surface border border-surface-alt rounded-[3rem]">
                <p className="text-text-muted text-xl font-medium">No results found for "{searchQuery}"</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="normal-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-16"
          >
            {/* Favorites Section */}
            {user && favorites.length > 0 && selectedCategory === 'All' && (
              <section className="space-y-6">
                <h2 className="text-3xl font-black text-text-main flex items-center gap-3">
                  <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                  Your Favorites
                </h2>
                <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                  {favorites.map(store => (
                    <div key={store.id} className="min-w-[300px] max-w-[300px]">
                      <StoreCard store={store} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Main Store Grid */}
            <section className="space-y-8">
              <h2 className="text-3xl font-black text-text-main flex items-center gap-3">
                <span className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-bg" />
                </span>
                {selectedCategory === 'All' ? 'Popular Near You' : `${selectedCategory} Stores`}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStores.length > 0 ? (
                  filteredStores.map(store => (
                    <StoreCard key={store.id} store={store} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 bg-surface border border-surface-alt rounded-[3rem]">
                    <p className="text-text-muted text-xl">No stores in this category yet.</p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
