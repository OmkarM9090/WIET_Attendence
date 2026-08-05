import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { isInstalled } = usePWA();

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    if (isInstalled) return;

    // Check if dismissed recently (7 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return; 
    }

    // Check visits
    let visits = parseInt(localStorage.getItem('pwa-visits') || '0');
    visits += 1;
    localStorage.setItem('pwa-visits', visits.toString());

    // Listen for install prompt (Chrome, Edge, etc.)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Smart timing: show prompt after 3 seconds delay, and after 2nd visit
      if (visits >= 2) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS - show guide after delay
    if (iOS && visits >= 2) {
      const iosShown = sessionStorage.getItem('ios-install-shown');
      if (!iosShown) {
        setTimeout(() => setShowIOSGuide(true), 3000);
        sessionStorage.setItem('ios-install-shown', 'true');
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled) return null;

  // iOS Installation Guide
  if (isIOS && showIOSGuide) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100 p-6 z-50 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
        
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
            <Smartphone className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Install WIET Attend</h3>
            <p className="text-sm text-slate-600 mt-1">
              Add to home screen for quick access
            </p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-600">1.</span>
            <span>Tap the Share button</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-600">2.</span>
            <span>Select "Add to Home Screen"</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-600">3.</span>
            <span>Tap "Add" to install</span>
          </div>
        </div>
      </div>
    );
  }

  // Chrome/Android/Desktop Install Prompt
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100 p-6 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>
      
      <div className="flex items-start gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex-shrink-0">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-lg">Install App</h3>
          <p className="text-sm text-slate-600 mt-1">
            Get quick access from your home screen
          </p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">✓</span>
          <span>Faster access</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">✓</span>
          <span>Works offline (basic)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">✓</span>
          <span>App-like experience</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleDismiss}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Not Now
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Install
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
