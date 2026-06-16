import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, X } from 'lucide-react';

export default function ReminderPopup({ isOpen, meds, onMarkTaken, onSnooze, onClose }) {
  if (!isOpen || meds.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-[28px] shadow-2xl glass p-4 sm:p-6 z-10 space-y-4 sm:space-y-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500/20 dark:bg-brand-500/10 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/25 flex items-center justify-center animate-bounce">
                <Bell className="w-8 h-8" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
                Medicine Reminder ⏰
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                It's time to take your scheduled medications.
              </p>
            </div>
          </div>

          {/* Medicines List */}
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {meds.map(med => (
              <div
                key={med._id}
                className="flex items-center gap-3 p-3 bg-slate-50/60 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/60 rounded-2xl"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate">
                    {med.name}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                    {med.dosage || '1 pill'} • {med.instructions || 'After Food'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Silent Warning */}
          {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-semibold">
              <span className="text-base leading-none">⚠️</span>
              <div className="flex-1 space-y-0.5">
                <p className="font-extrabold text-slate-850 dark:text-slate-250">Phone is in silent mode?</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                  Reminder sound may be muted. Please check your physical Ring/Silent switch and volume slider.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onSnooze(meds.map(m => m._id))}
              className="py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-950 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
            >
              Snooze 5 Min
            </button>
            <button
              onClick={() => onMarkTaken(meds.map(m => m._id))}
              className="py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 hover:from-brand-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Mark as Taken
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
