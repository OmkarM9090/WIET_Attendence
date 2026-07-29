import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading...", size = 32 }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 size={size} className="animate-spin text-blue-600" />
      {label && <p className="text-xs font-semibold text-slate-500 tracking-wide">{label}</p>}
    </div>
  );
}
