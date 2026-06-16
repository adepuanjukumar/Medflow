import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-2xl glass overflow-hidden z-10 text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 dark:bg-amber-500/5 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              {title || 'Are you sure?'}
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {message || 'This action cannot be undone.'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-md shadow-red-500/20 hover:shadow-lg transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
