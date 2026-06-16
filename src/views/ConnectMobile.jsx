import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, Wifi, WifiOff, Pill, Volume2 } from 'lucide-react';

// Single global audio for mobile popup
const mobileAudio = new Audio();
let mobileAudioUnlocked = false;

export default function ConnectMobile({ userId }) {
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [activeReminders, setActiveReminders] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const eventSourceRef = useRef(null);

  // Unlock audio on first touch
  useEffect(() => {
    const unlock = () => {
      if (mobileAudioUnlocked) return;
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA');
      silentAudio.play().then(() => {
        mobileAudioUnlocked = true;
        console.log('[Mobile] Audio unlocked');
      }).catch(() => {});
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock);
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
  }, []);

  // Connect SSE stream
  useEffect(() => {
    if (!userId) return;

    const connect = () => {
      console.log('[Mobile] Connecting SSE stream for userId:', userId);
      const es = new EventSource(`/api/notifications-channel?userId=${userId}`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Mobile] SSE event received:', data);

          if (data.type === 'connected') {
            setConnected(true);
            setConnectionStatus('Connected to MedFlow');
          } else if (data.type === 'heartbeat') {
            // keep alive
          } else if (data.type === 'MEDICINE_REMINDER') {
            handleIncomingReminder(data);
          }
        } catch (err) {
          console.error('[Mobile] SSE parse error:', err);
        }
      };

      es.onerror = () => {
        setConnected(false);
        setConnectionStatus('Reconnecting...');
        es.close();
        // Auto-reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [userId]);

  const handleIncomingReminder = (data) => {
    const { medicines, isTest } = data;

    // Vibrate phone
    if (navigator.vibrate) {
      navigator.vibrate([300, 150, 300, 150, 500]);
    }

    // Play sound
    playMobileAlarm();

    // Show notification via Notification API if page is hidden
    if ('Notification' in window && Notification.permission === 'granted') {
      const meds = medicines && medicines.length > 0 ? medicines : [{ name: 'Your Medicine', dosage: '1 dose', instructions: 'As prescribed' }];
      meds.forEach(med => {
        try {
          new Notification(`💊 ${isTest ? 'Test: ' : ''}Time to Take Medicine`, {
            body: `${med.name} — ${med.dosage || '1 dose'} • ${med.instructions || 'As prescribed'}`,
            requireInteraction: true,
            vibrate: [200, 100, 200]
          });
        } catch (e) {}
      });
    }

    // Update state to show in-app popup
    setActiveReminders(medicines && medicines.length > 0 ? medicines : [
      { _id: 'test-' + Date.now(), name: isTest ? 'Test Reminder (Aspirin)' : 'Medicine', dosage: '1 tablet', instructions: 'After Food' }
    ]);
  };

  const playMobileAlarm = () => {
    if (!mobileAudioUnlocked) return;
    mobileAudio.pause();
    mobileAudio.src = '/sounds/bell.wav';
    mobileAudio.volume = 0.9;
    mobileAudio.currentTime = 0;
    mobileAudio.loop = true;
    mobileAudio.play().catch(err => console.warn('[Mobile] Audio play failed:', err));
  };

  const stopAlarm = () => {
    mobileAudio.pause();
    mobileAudio.currentTime = 0;
  };

  const handleMarkTaken = () => {
    stopAlarm();
    setActiveReminders([]);
  };

  const handleSnooze = () => {
    stopAlarm();
    setActiveReminders([]);
    // Re-trigger after 5 minutes
    setTimeout(() => {
      playMobileAlarm();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }, 5 * 60 * 1000);
  };

  const handleDismiss = () => {
    stopAlarm();
    setActiveReminders([]);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setConnectionStatus('Notifications enabled! ✅');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 pointer-events-none" />

      {/* Animated Reminder Popup */}
      <AnimatePresence>
        {activeReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 space-y-5">
              {/* Bell icon */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/30">
                    <Bell className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">💊 Medicine Time!</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Don't miss your scheduled dose</p>
                </div>
              </div>

              {/* Medicine list */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeReminders.map((med, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-2xl">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Pill className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate">{med.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{med.dosage || '1 dose'} · {med.instructions || 'As prescribed'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleSnooze}
                  className="py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  ⏰ Snooze 5 min
                </button>
                <button
                  onClick={handleMarkTaken}
                  className="py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Mark Taken
                </button>
              </div>
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-xl text-slate-400 font-semibold text-xs hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm space-y-5"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <Pill className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">MedFlow</h1>
          <p className="text-xs text-slate-400 font-semibold">Mobile Notification Receiver</p>
        </div>

        {/* Status card */}
        <div className={`rounded-2xl border p-4 flex items-center gap-3 transition-all duration-500 ${
          connected
            ? 'bg-emerald-500/10 border-emerald-500/25'
            : 'bg-slate-800/60 border-slate-700'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            connected ? 'bg-emerald-500/20' : 'bg-slate-700'
          }`}>
            {connected
              ? <Wifi className="w-5 h-5 text-emerald-400" />
              : <WifiOff className="w-5 h-5 text-slate-400 animate-pulse" />
            }
          </div>
          <div className="min-w-0">
            <p className={`font-extrabold text-sm ${connected ? 'text-emerald-400' : 'text-slate-300'}`}>
              {connected ? '✅ Connected' : '⏳ ' + connectionStatus}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {connected ? 'Receiving live medicine alerts from your laptop' : 'Make sure both devices are on the same Wi-Fi'}
            </p>
          </div>
        </div>

        {/* Notification permission */}
        {'Notification' in window && Notification.permission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Bell className="w-4 h-4" />
            Enable Notifications on This Phone
          </button>
        )}

        {/* Audio unlock prompt */}
        {!mobileAudioUnlocked && (
          <button
            onClick={() => {
              const a = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA');
              a.play().then(() => { mobileAudioUnlocked = true; }).catch(() => {});
            }}
            className="w-full py-3.5 rounded-2xl border border-slate-600 bg-slate-800 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Volume2 className="w-4 h-4 text-blue-400" />
            Tap to Enable Alarm Sound
          </button>
        )}

        {/* Status info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">What happens next</p>
          {[
            { icon: Bell, text: 'Phone vibrates when medicine time arrives', color: 'text-blue-400' },
            { icon: Volume2, text: 'Alarm plays even if phone is idle', color: 'text-indigo-400' },
            { icon: Clock, text: 'Reminder persists until you respond', color: 'text-emerald-400' },
          ].map(({ icon: Icon, text, color }, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <p className="text-xs text-slate-400 font-semibold">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
