import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import MedicationModal from './components/Modal';
import ConfirmDialog from './components/ConfirmDialog';
import ReminderPopup from './components/ReminderPopup';
import Toasts from './components/Toasts';
import Dashboard from './views/Dashboard';
import Medications from './views/Medications';
import Stats from './views/Stats';
import Settings from './views/Settings';
import ConnectMobile from './views/ConnectMobile';
import { Sparkles } from 'lucide-react';

export default function App() {
  // Theme state: 'light' or 'dark' (system preference default, or dark)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Query parameter checks for mobile connect view
  const [connectUserId, setConnectUserId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('connectUser');
  });

  // User session state
  const [userSession, setUserSession] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login', 'signup', 'forgot-password'
  const [sessionLoading, setSessionLoading] = useState(true);

  // Nav tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // App data state
  const [medications, setMedications] = useState([]);
  const [takenMeds, setTakenMeds] = useState([]);
  const [snoozedMeds, setSnoozedMeds] = useState({}); // { medId: timestamp }

  // Settings states
  const [volume, setVolume] = useState(0.8);
  const [defaultSound, setDefaultSound] = useState('chime');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [connectedMobileDevices, setConnectedMobileDevices] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Active reminder state
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [currentReminderMeds, setCurrentReminderMeds] = useState([]);

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  // Audio elements references
  const audioRef = useRef(null);

  // Helper date key
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Toast utility helper
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleThemeMode = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Audio element setup
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      window.reminderAudio = audioRef.current;
    }
  }, []);

  // Fetch initial user session status
  useEffect(() => {
    if (connectUserId) {
      setSessionLoading(false);
      return;
    }
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setUserSession({ userId: data.userId, name: data.name, email: '' });
          addToast(`Logged in as ${data.name}`, 'success');
        }
      })
      .catch(() => {})
      .finally(() => setSessionLoading(false));
  }, [connectUserId, addToast]);

  // Load medications & logs when user session is active
  useEffect(() => {
    if (!userSession) return;

    // Fetch medications
    fetchMedications();

    // Fetch compliance logs from localStorage
    const saved = localStorage.getItem(`meds_taken_${userSession.userId}_${getTodayKey()}`);
    if (saved) {
      try {
        setTakenMeds(JSON.parse(saved));
      } catch (e) {
        setTakenMeds([]);
      }
    } else {
      setTakenMeds([]);
    }

    // Set connection status polling for settings
    const interval = setInterval(() => {
      fetch('/api/connection-url')
        .then(res => {
          if (res.status === 401) return null;
          return res.json();
        })
        .then(data => {
          if (data) {
            // Check connected clients size via mock or poll
            // We default to 0 or 1 depending on whether SSE clients map is populated
          }
        })
        .catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, [userSession]);

  const fetchMedications = async () => {
    try {
      const res = await fetch('/api/medicines');
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setMedications(data);
      }
    } catch (err) {
      console.error('Failed to fetch medications:', err);
    }
  };

  // Automated medicine time checker (runs every 10 seconds)
  useEffect(() => {
    if (!userSession || medications.length === 0 || isReminderOpen) return;

    const checkScheduler = () => {
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Filter medications scheduled at the exact current time slot
      const dueMeds = medications.filter(med => {
        const isTimeMatch = med.time === currentHourMin;
        const isTaken = takenMeds.includes(med._id);
        
        // Ensure not snoozed within last 5 minutes
        const lastSnoozeTime = snoozedMeds[med._id] || 0;
        const isSnoozed = Date.now() - lastSnoozeTime < 5 * 60 * 1000;

        return isTimeMatch && !isTaken && !isSnoozed;
      });

      if (dueMeds.length > 0) {
        setCurrentReminderMeds(dueMeds);
        setIsReminderOpen(true);
        triggerAlarmAlerts(dueMeds);
      }
    };

    const interval = setInterval(checkScheduler, 10000);
    return () => clearInterval(interval);
  }, [userSession, medications, takenMeds, snoozedMeds, isReminderOpen]);

  const triggerAlarmAlerts = (dueMeds) => {
    // 1. Play local alarm sound
    const audio = audioRef.current;
    if (audio && defaultSound !== 'silent') {
      const soundPathMap = {
        chime: '/sounds/soft_chime.wav',
        bell: '/sounds/bell.wav',
        alert: '/sounds/digital_alarm.wav',
        calm: '/sounds/calm_tone.wav',
        notification: '/sounds/gentle_notification.wav'
      };
      
      const path = soundPathMap[defaultSound] || '/sounds/soft_chime.wav';
      audio.pause();
      audio.src = path;
      audio.volume = volume;
      audio.loop = true;
      audio.play().catch(err => {
        console.warn('Audio autoplay blocked by browser:', err);
        addToast('Medication due! Tap anywhere to enable alert sounds.', 'warning');
      });
    }

    // 2. Desktop Notification
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      dueMeds.forEach(med => {
        new Notification(`💊 Medicine Reminder`, {
          body: `It is time to take: ${med.name} (${med.dosage || '1 pill'})`,
          requireInteraction: true,
          tag: 'medflow-reminder'
        });
      });
    }

    // 3. Mobile Device Push (SSE Notification channel)
    fetch('/api/trigger-mobile-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicines: dueMeds })
    })
      .then(res => res.json())
      .then(data => {
        if (data.sent > 0) {
          console.log(`Pushed alarm to ${data.sent} connected mobile devices.`);
        }
      })
      .catch(err => console.error('Failed to trigger mobile push:', err));
  };

  const stopAlarm = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  // Modal Save/Edit Action
  const handleSaveMedication = async (medData) => {
    setDuplicateWarning(null);
    try {
      const isEditing = !!editingItem;
      const url = isEditing ? `/api/medicines/${editingItem._id}` : '/api/medicines';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medData)
      });

      const data = await res.json();

      if (res.ok) {
        addToast(isEditing ? 'Medication schedule updated!' : 'Medication added successfully!', 'success');
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setEditingItem(null);
        fetchMedications();
      } else {
        // safety check or slot capacity warning
        setDuplicateWarning(data.error || 'Server safety validation failed.');
        addToast(data.error || 'Validation warning', 'warning');
      }
    } catch (err) {
      addToast('Network error saving medication.', 'error');
    }
  };

  const handleDeleteMedication = async () => {
    if (!deletingItemId) return;
    try {
      const res = await fetch(`/api/medicines/${deletingItemId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Medication deleted successfully', 'success');
        setIsDeleteDialogOpen(false);
        setDeletingItemId(null);
        fetchMedications();
      } else {
        addToast('Failed to delete medication.', 'error');
      }
    } catch (err) {
      addToast('Network error deleting medication.', 'error');
    }
  };

  const handleToggleTaken = (medId) => {
    const isCurrentlyTaken = takenMeds.includes(medId);
    let updated;
    if (isCurrentlyTaken) {
      updated = takenMeds.filter(id => id !== medId);
      addToast('Medication marked as pending', 'info');
    } else {
      updated = [...takenMeds, medId];
      addToast('Medication marked as taken! Streak updated. 🌟', 'success');
    }

    setTakenMeds(updated);
    localStorage.setItem(`meds_taken_${userSession.userId}_${getTodayKey()}`, JSON.stringify(updated));

    // Calculate weekly stats adherence rates
    const todayKey = getTodayKey();
    const rate = medications.length > 0 ? Math.round((updated.length / medications.length) * 100) : 100;
    localStorage.setItem(`adherence_rate_${userSession.userId}_${todayKey}`, String(rate));
  };

  const handleSnooze = (medIds) => {
    stopAlarm();
    setIsReminderOpen(false);
    
    const updatedSnoozed = { ...snoozedMeds };
    medIds.forEach(id => {
      updatedSnoozed[id] = Date.now();
    });
    setSnoozedMeds(updatedSnoozed);
    addToast('Reminders snoozed for 5 minutes', 'info');
  };

  const handleMarkTakenFromAlarm = (medIds) => {
    stopAlarm();
    setIsReminderOpen(false);

    let updated = [...takenMeds];
    medIds.forEach(id => {
      if (!updated.includes(id)) {
        updated.push(id);
      }
    });

    setTakenMeds(updated);
    localStorage.setItem(`meds_taken_${userSession.userId}_${getTodayKey()}`, JSON.stringify(updated));
    addToast('Medications marked as taken! 💊', 'success');

    // Update stats rate
    const todayKey = getTodayKey();
    const rate = medications.length > 0 ? Math.round((updated.length / medications.length) * 100) : 100;
    localStorage.setItem(`adherence_rate_${userSession.userId}_${todayKey}`, String(rate));
  };

  const handleTriggerTestReminder = () => {
    const dummyMed = {
      _id: 'test-' + Date.now(),
      name: 'Test Aspirin',
      dosage: '1 tablet',
      instructions: 'After Food',
      reminderSound: 'chime'
    };
    setCurrentReminderMeds([dummyMed]);
    setIsReminderOpen(true);
    triggerAlarmAlerts([dummyMed]);
  };

  const handleTestMobilePush = () => {
    fetch('/api/trigger-mobile-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicines: medications.slice(0, 1), isTest: true })
    })
      .then(res => res.json())
      .then(data => {
        if (data.sent > 0) {
          addToast('Mobile test push alert sent!', 'success');
        } else {
          addToast('No active phone receiver connected. Use QR below.', 'warning');
        }
      })
      .catch(() => addToast('Network push alert error.', 'error'));
  };

  // Auth submits
  const handleLoginSubmit = async (email, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Fetch session name
        const meRes = await fetch('/api/me');
        const meData = await meRes.json();
        if (meData.loggedIn) {
          setUserSession({ userId: meData.userId, name: meData.name, email });
          addToast('Sign in successful!', 'success');
        }
      } else {
        addToast(data.error || 'Incorrect email or password', 'error');
      }
    } catch (e) {
      addToast('Server connection failed.', 'error');
    }
  };

  const handleSignupSubmit = async (name, email, password) => {
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Auto sign in
        setUserSession({ userId: data.userId || 'guest', name, email });
        addToast('Sign up successful! Welcome to MedFlow.', 'success');
      } else {
        addToast(data.error || 'Failed to register account.', 'error');
      }
    } catch (e) {
      addToast('Server connection failed.', 'error');
    }
  };

  const handleForgotPasswordSubmit = async (email, newPassword) => {
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Password reset successful! Please login.', 'success');
        setAuthView('login');
      } else {
        addToast(data.error || 'Failed to reset password.', 'error');
      }
    } catch (e) {
      addToast('Server connection failed.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {}
    setUserSession(null);
    setMedications([]);
    setTakenMeds([]);
    addToast('Logged out successfully', 'info');
  };

  // Rendering loading state
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#4F6BFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading MedFlow...</p>
        </div>
      </div>
    );
  }

  // 1. Mobile Receivers Connect Layout
  if (connectUserId) {
    return <ConnectMobile userId={connectUserId} />;
  }

  // 2. Unauthenticated Layout
  if (!userSession) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background grids and glowing blobs */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="relative w-full max-w-md bg-slate-900/40 border border-slate-800/60 rounded-[32px] shadow-2xl backdrop-blur-md overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Brand Logo Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4F6BFF] to-[#6EA8FE] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#4F6BFF]/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">MedFlow</h1>
            <p className="text-xs text-slate-400 font-semibold">Your intelligent medication safety manager</p>
          </div>

          {authView === 'login' && (
            <LoginForm
              onSubmit={handleLoginSubmit}
              onSignupClick={() => setAuthView('signup')}
              onForgotPasswordClick={() => setAuthView('forgot-password')}
            />
          )}

          {authView === 'signup' && (
            <SignupForm
              onSubmit={handleSignupSubmit}
              onLoginClick={() => setAuthView('login')}
            />
          )}

          {authView === 'forgot-password' && (
            <ForgotPasswordForm
              onSubmit={handleForgotPasswordSubmit}
              onBackClick={() => setAuthView('login')}
            />
          )}
        </div>
        <Toasts toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  // 3. Authenticated Layout
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#020617] text-slate-850 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userSession={userSession}
        onLogout={handleLogout}
        theme={theme}
        toggleThemeMode={toggleThemeMode}
      />

      {/* Main Page panels */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen p-3 sm:p-6 md:p-8 pt-20 md:pt-8 bg-slate-50 dark:bg-slate-950/20">
        <div className="max-w-6xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              medications={medications}
              takenMeds={takenMeds}
              onToggleTaken={handleToggleTaken}
              onOpenAddModal={() => {
                setEditingItem(null);
                setDuplicateWarning(null);
                setIsAddModalOpen(true);
              }}
              onOpenEditModal={(med) => {
                setEditingItem(med);
                setDuplicateWarning(null);
                setIsEditModalOpen(true);
              }}
              onDeleteMedication={(id) => {
                setDeletingItemId(id);
                setIsDeleteDialogOpen(true);
              }}
              userSession={userSession}
            />
          )}

          {activeTab === 'medications' && (
            <Medications
              medications={medications}
              onOpenAddModal={() => {
                setEditingItem(null);
                setDuplicateWarning(null);
                setIsAddModalOpen(true);
              }}
              onOpenEditModal={(med) => {
                setEditingItem(med);
                setDuplicateWarning(null);
                setIsEditModalOpen(true);
              }}
              onDeleteMedication={(id) => {
                setDeletingItemId(id);
                setIsDeleteDialogOpen(true);
              }}
            />
          )}

          {activeTab === 'stats' && (
            <Stats
              medications={medications}
              takenMeds={takenMeds}
              onToggleTaken={handleToggleTaken}
              onOpenAddModal={() => {
                setEditingItem(null);
                setDuplicateWarning(null);
                setIsAddModalOpen(true);
              }}
              notificationsEnabled={notificationsEnabled}
              setNotificationsEnabled={setNotificationsEnabled}
              userSession={userSession}
              addToast={addToast}
              onTriggerTestAlarm={handleTriggerTestReminder}
              defaultSound={defaultSound}
              volume={volume}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              theme={theme}
              toggleThemeMode={toggleThemeMode}
              userSession={userSession}
              medications={medications}
              takenMeds={takenMeds}
              volume={volume}
              setVolume={setVolume}
              defaultSound={defaultSound}
              setDefaultSound={setDefaultSound}
              notificationsEnabled={notificationsEnabled}
              setNotificationsEnabled={setNotificationsEnabled}
              onTriggerTestReminder={handleTriggerTestReminder}
              addToast={addToast}
              connectedMobileDevices={connectedMobileDevices}
              onTestMobilePush={handleTestMobilePush}
            />
          )}
        </div>
      </main>

      {/* Overlay: Add Medication Modal */}
      <MedicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveMedication}
        duplicateWarning={duplicateWarning}
      />

      {/* Overlay: Edit Medication Modal */}
      <MedicationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveMedication}
        editingItem={editingItem}
        duplicateWarning={duplicateWarning}
      />

      {/* Overlay: Delete Medication Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingItemId(null);
        }}
        onConfirm={handleDeleteMedication}
        title="Delete Medication Schedule?"
        message="Are you sure you want to delete this medication schedule? You will no longer receive alerts for this slot."
      />

      {/* Overlay: Active Reminder Alarm Popup */}
      <ReminderPopup
        isOpen={isReminderOpen}
        meds={currentReminderMeds}
        onMarkTaken={handleMarkTakenFromAlarm}
        onSnooze={handleSnooze}
        onClose={() => {
          stopAlarm();
          setIsReminderOpen(false);
        }}
      />

      {/* Toast popup notifications */}
      <Toasts toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// Subcomponents: LoginForm, SignupForm, ForgotPasswordForm
function LoginForm({ onSubmit, onSignupClick, onForgotPasswordClick }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.elements.email.value;
    const password = e.target.elements.password.value;
    if (!email || !password) return;
    setLoading(true);
    await onSubmit(email, password);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
        <input
          type="email"
          name="email"
          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-semibold text-white focus:border-brand-500 outline-none transition-all duration-200"
          placeholder="yourname@example.com"
          required
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Password</label>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-[10px] font-extrabold text-[#4F6BFF] hover:text-[#3b55e6] hover:underline"
          >
            Forgot Password?
          </button>
        </div>
        <input
          type="password"
          name="password"
          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-semibold text-white focus:border-brand-500 outline-none transition-all duration-200"
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-[#4F6BFF] to-[#6EA8FE] text-white rounded-2xl font-black text-xs shadow-md shadow-[#4F6BFF]/25 hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      <div className="text-center pt-2">
        <p className="text-[11px] font-semibold text-slate-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSignupClick}
            className="font-black text-[#4F6BFF] hover:text-[#3b55e6] hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </form>
  );
}

function SignupForm({ onSubmit, onLoginClick }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.elements.fullName.value;
    const email = e.target.elements.email.value;
    const password = e.target.elements.password.value;
    if (!name || !email || !password) return;
    setLoading(true);
    await onSubmit(name, email, password);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
        <input
          type="text"
          name="fullName"
          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-semibold text-white focus:border-brand-500 outline-none transition-all duration-200"
          placeholder="Jane Doe"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
        <input
          type="email"
          name="email"
          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-semibold text-white focus:border-brand-500 outline-none transition-all duration-200"
          placeholder="yourname@example.com"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Password</label>
        <input
          type="password"
          name="password"
          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-semibold text-white focus:border-brand-500 outline-none transition-all duration-200"
          placeholder="Min 6 characters"
          minLength={6}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-[#4F6BFF] to-[#6EA8FE] text-white rounded-2xl font-black text-xs shadow-md shadow-[#4F6BFF]/25 hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div className="text-center pt-2">
        <p className="text-[11px] font-semibold text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onLoginClick}
            className="font-black text-[#4F6BFF] hover:text-[#3b55e6] hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </form>
  );
}

function ForgotPasswordForm({ onSubmit, onBackClick }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.elements.email.value;
    const newPassword = e.target.elements.newPassword.value;
    if (!email || !newPassword) return;
    setLoading(true);
    await onSubmit(email, newPassword);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
        <input
          type="email"
          name="email"
          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-semibold text-white focus:border-brand-500 outline-none transition-all duration-200"
          placeholder="yourname@example.com"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">New Password</label>
        <input
          type="password"
          name="newPassword"
          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-semibold text-white focus:border-brand-500 outline-none transition-all duration-200"
          placeholder="Choose a new secure password"
          minLength={6}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-[#4F6BFF] to-[#6EA8FE] text-white rounded-2xl font-black text-xs shadow-md shadow-[#4F6BFF]/25 hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
      >
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackClick}
          className="font-black text-xs text-[#4F6BFF] hover:text-[#3b55e6] hover:underline"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );
}
