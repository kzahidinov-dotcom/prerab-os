'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  User, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'sync';
  author?: string;
  timestamp: number;
  duration?: number;
  playSound?: boolean;
}

// Global dispatch helper
export const showToast = (toast: Omit<ToastItem, 'id' | 'timestamp'>) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('prerab_show_toast', {
        detail: {
          ...toast,
          id: 'toast-' + Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          duration: toast.duration || 5000,
          playSound: toast.playSound !== false,
        }
      })
    );
  }
};

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isSoundOn, setIsSoundOn] = useState(true);

  useEffect(() => {
    setIsSoundOn(soundManager.isEnabled());

    const handleNewToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      const newToast = customEvent.detail;

      if (newToast.playSound !== false) {
        soundManager.playNotificationChime(
          newToast.type === 'warning' ? 'alert' : newToast.type === 'success' ? 'success' : 'gentle'
        );
      }

      setToasts(prev => [newToast, ...prev.slice(0, 3)]); // Keep at most 4
    };

    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      setIsSoundOn(customEvent.detail.enabled);
    };

    window.addEventListener('prerab_show_toast', handleNewToast);
    window.addEventListener('prerab_sound_setting_changed', handleSoundChange);

    return () => {
      window.removeEventListener('prerab_show_toast', handleNewToast);
      window.removeEventListener('prerab_sound_setting_changed', handleSoundChange);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleSound = () => {
    const next = !isSoundOn;
    soundManager.setEnabled(next);
    setIsSoundOn(next);
    if (next) {
      soundManager.playNotificationChime('gentle');
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onClose: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const totalTime = toast.duration || 5000;
    const intervalTime = 50;
    const step = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case 'sync':
        return (
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        );
      case 'warning':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 border border-brand-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  const getAccentColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-emerald-500';
      case 'sync': return 'bg-sky-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-brand-500';
    }
  };

  return (
    <div className="pointer-events-auto relative overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl p-4 flex items-start gap-3 transition-all transform animate-in slide-in-from-top-3 fade-in duration-200 hover:shadow-3xl">
      {/* Progress Line */}
      <div 
        className={`absolute bottom-0 left-0 h-1 transition-all duration-75 ${getAccentColor()}`}
        style={{ width: `${progress}%` }}
      />

      {getIcon()}

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className="text-xs font-bold text-slate-900 truncate tracking-tight">
            {toast.title}
          </h4>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            только что
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-snug line-clamp-2">
          {toast.message}
        </p>

        {toast.author && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[10px] font-bold text-slate-700">
              <User className="w-2.5 h-2.5 text-slate-500" />
              <span>{toast.author}</span>
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
