"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export interface ToastMessage {
  text: string;
  type: "success" | "error";
}

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  const isSuccess = message.type === "success";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-200 ${
        isSuccess
          ? "bg-white border-emerald-200 text-emerald-800"
          : "bg-white border-red-200 text-red-800"
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
      )}
      <p className="text-sm font-medium flex-1">{message.text}</p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
