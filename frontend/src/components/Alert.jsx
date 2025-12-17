import { useState, useEffect } from "react";

export default function Alert({ message, type = "error", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "error" ? "bg-red-50" : "bg-green-50";
  const textColor = type === "error" ? "text-red-700" : "text-green-700";
  const borderColor = type === "error" ? "border-red-200" : "border-green-200";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 ${textColor}`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
