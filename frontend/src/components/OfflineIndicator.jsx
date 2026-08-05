import { WifiOff } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm font-medium z-50 flex items-center justify-center gap-2 animate-slide-down">
      <WifiOff className="w-4 h-4" />
      You're offline. Some features may be limited.
    </div>
  );
};

export default OfflineIndicator;
