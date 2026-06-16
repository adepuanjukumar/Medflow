import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertOctagon, Info, X } from 'lucide-react';

export default function Toasts({ toasts, removeToast }) {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertOctagon className="w-4 h-4 text-red-500 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-brand-500 shrink-0" />;
    }
  };

  const borderColors = (type) => {
    switch (type) {
      case 'success': return 'border-emerald-500/20 dark:border-emerald-500/10';
      case 'error': return 'border-red-500/20 dark:border-red-500/10';
      case 'warning': return 'border-amber-500/20 dark:border-amber-500/10';
      default: return 'border-brand-500/20 dark:border-brand-500/10';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-6 md:right-6 z-[9999] flex flex-col gap-2 max-w-none md:max-w-xs w-auto pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 p-3 bg-white/95 dark:bg-slate-900/95 border ${borderColors(toast.type)} rounded-xl shadow-lg glass`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {getIcon(toast.type)}
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-1">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
