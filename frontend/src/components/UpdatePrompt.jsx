import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const UpdatePrompt = () => {
  const { needRefresh, setNeedRefresh, updateServiceWorker } = usePWA();
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30 second grace period

  useEffect(() => {
    if (needRefresh) {
      setShow(true);
    }
  }, [needRefresh]);

  useEffect(() => {
    let timer;
    if (show && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (show && countdown === 0) {
      // Auto-update after grace period finishes if user doesn't dismiss
      handleUpdate();
    }
    return () => clearInterval(timer);
  }, [show, countdown]);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setShow(false);
    setNeedRefresh(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-indigo-600 text-white rounded-xl shadow-2xl p-4 z-50 animate-slide-down">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <RefreshCw className="w-5 h-5 mt-1" />
          <div>
            <span className="font-medium block">New version available!</span>
            <span className="text-sm text-indigo-100 block">Updating in {countdown}s...</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Update Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-1 text-xs text-indigo-200 hover:text-white transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
