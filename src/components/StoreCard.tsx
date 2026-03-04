import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Heart } from 'lucide-react';
import { Store } from '../types';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { toast } from 'sonner';

interface StoreCardProps {
  store: Store;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (user) {
      firebaseService.isFavorite(user.uid, store.id).then(setIsFav);
    }
  }, [user, store.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }
    const newState = await firebaseService.toggleFavorite(user.uid, store.id);
    setIsFav(newState);
    toast.success(newState ? 'Added to favorites' : 'Removed from favorites');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <button 
        onClick={toggleFav}
        className="absolute top-3 left-3 z-10 p-2 bg-surface/90 backdrop-blur-sm rounded-full shadow-sm border border-surface-alt transition-transform hover:scale-110 active:scale-95 group/heart"
      >
        <Heart className={`w-5 h-5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-text-muted group-hover/heart:text-red-400'}`} />
      </button>
      
      <Link to={`/store/${store.id}`} className="store-card block group">
        <div className="relative h-48">
          <img 
            src={store.image} 
            alt={store.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-surface-alt">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-bold text-text-main">{store.rating}</span>
            {store.reviewCount > 0 && <span className="text-[10px] text-text-muted">({store.reviewCount})</span>}
          </div>
          <div className="absolute bottom-3 right-3 bg-success text-bg text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            {store.category}
          </div>
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-bold mb-1 group-hover:text-accent transition-colors">{store.name}</h3>
          <p className="text-text-muted text-sm line-clamp-1 mb-4">{store.description}</p>
          
          <div className="flex items-center gap-4 text-text-muted text-xs font-medium uppercase tracking-wide">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              <span>{store.deliveryTime}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-surface-alt"></div>
            <span className="text-success">Open Now</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
