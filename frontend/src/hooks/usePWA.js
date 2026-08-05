import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // useRegisterSW handles the update logic natively and smoothly
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    // Feature detection fallback
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported, running as regular website');
      return;
    }

    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };
    
    checkInstalled();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track installation
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return {
    isInstalled,
    isOnline,
    needRefresh,
    setNeedRefresh,
    updateServiceWorker
  };
};
