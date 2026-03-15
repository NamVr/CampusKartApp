import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PWAPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 z-[200] bg-surface border-2 border-accent p-6 rounded-[2rem] shadow-2xl shadow-accent/20 flex flex-col gap-4"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="text-lg font-black text-accent uppercase tracking-wider">
                {offlineReady ? 'Ready for Campus' : 'New Update Available'}
              </h4>
              <p className="text-text-muted text-sm font-medium leading-relaxed">
                {offlineReady 
                  ? 'CampusKart is now ready for offline use. You can access it even without internet!' 
                  : 'A new version of CampusKart is available. Refresh to get the latest features.'}
              </p>
            </div>
            <button 
              onClick={close}
              className="p-2 hover:bg-surface-alt rounded-xl transition-all text-text-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-3">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 bg-accent text-bg px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Update Now
              </button>
            )}
            <button
              onClick={close}
              className="flex-1 bg-surface-alt text-text-main px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-accent/10 transition-all"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
