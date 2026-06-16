import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Flame, Check, Sparkles, Droplet, BookOpen, AlertTriangle } from 'lucide-react';

const HEALTH_TIPS = [
  "Consistency is key! Try taking your meds at the same time every day to establish a solid routine.",
  "Never skip doses unless recommended by your doctor. If you miss a dose, check your instructions.",
  "Taking pills with plenty of water helps them dissolve and protects your throat from irritation.",
  "Some medications require food to prevent stomach irritation, while others must be taken empty-stomached.",
  "Safety First: MedFlow enforces a strict 2-hour gap validation between dose schedules to keep you protected.",
  "Always keep an updated list of your medications in your wallet or settings history in case of emergencies."
];

const MOTIVATIONS = [
  "Great job! You are consistent this week. Keep it up! 🌟",
  "Fantastic consistency! Your body will thank you. 💪",
  "Doing great! Halfway there, maintain the streak! 🔥",
  "Every single dose counts towards your health. You got this! ❤️"
];

export default function Dashboard({
  medications,
  takenMeds,
  onToggleTaken,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteMedication,
  userSession
}) {
  const [countdown, setCountdown] = useState('00:00:00');
  const [nextMed, setNextMed] = useState(null);
  const [waterCups, setWaterCups] = useState(() => {
    const saved = localStorage.getItem(`water_${userSession?.userId || 'guest'}_${getTodayKey()}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate health tips every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % HEALTH_TIPS.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update next dose countdown
  useEffect(() => {
    function updateCountdown() {
      if (!medications || medications.length === 0) {
        setCountdown('No doses scheduled');
        setNextMed(null);
        return;
      }

      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const sorted = [...medications].sort((a, b) => a.time.localeCompare(b.time));

      // Find the first untaken dose after current time
      let target = sorted.find(med => {
        const [h, m] = med.time.split(':').map(Number);
        const medMins = h * 60 + m;
        const isTaken = takenMeds.includes(med._id);
        return medMins >= currentMins && !isTaken;
      });

      // If all scheduled meds are finished, roll over to the first med tomorrow
      if (!target) {
        target = sorted.find(med => !takenMeds.includes(med._id)) || sorted[0];
      }

      setNextMed(target);

      // Calculate diff
      const [h, m] = target.time.split(':').map(Number);
      let targetDate = new Date();
      targetDate.setHours(h, m, 0, 0);

      // If time is in the past and we rolled over to tomorrow
      if (targetDate < now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      const diffMs = targetDate - now;
      const hours = String(Math.floor(diffMs / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, '0');

      setCountdown(`${hours}:${mins}:${secs}`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [medications, takenMeds]);

  // Helper date key
  function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  const logWaterCup = (amount) => {
    const newCups = Math.min(Math.max(waterCups + amount, 0), 12); // Cap at 12 cups
    setWaterCups(newCups);
    localStorage.setItem(`water_${userSession?.userId || 'guest'}_${getTodayKey()}`, newCups);
  };

  // Metric computations
  const totalToday = medications.length;
  const takenCount = medications.filter(m => takenMeds.includes(m._id)).length;
  const missedCount = medications.filter(med => {
    const [h, mins] = med.time.split(':').map(Number);
    const medMins = h * 60 + mins;
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    return medMins < nowMins && !takenMeds.includes(med._id);
  }).length;

  const completionPercent = totalToday > 0 ? Math.round((takenCount / totalToday) * 100) : 0;
  
  // Choose motivation message depending on percent
  const motivationMessage = completionPercent === 100 
    ? "Perfect score! 100% adherence today. Streak locked! 🎉"
    : completionPercent > 50 
      ? MOTIVATIONS[1]
      : completionPercent > 0 
        ? MOTIVATIONS[0]
        : "Start your day by logging your first dose above. 💊";

  // Timeline render helpers
  const getTimelineIconBoxBg = (shape) => {
    switch (shape) {
      case 'capsule': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'liquid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'inhaler': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-[#4F6BFF]/10 text-[#4F6BFF] border-[#4F6BFF]/20';
    }
  };

  const getTimelineIcon = (shape) => {
    switch (shape) {
      case 'capsule':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <rect x="7" y="2" width="10" height="20" rx="5" ry="5"></rect>
            <line x1="7" y1="12" x2="17" y2="12"></line>
          </svg>
        );
      case 'liquid':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H17v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8h1.5"></path>
          </svg>
        );
      case 'inhaler':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <path d="M10 3h4v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V3zM6 18h12a2 2 0 0 1 2 2v1h-16v-1a2 2 0 0 1 2-2z"></path>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            Hello, {userSession?.name || 'User'}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. Check your reminders below.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#4F6BFF] to-[#6EA8FE] text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Schedule
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Adherence Circular Meter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg width="80" height="80">
              <circle cx="40" cy="40" r="32" fill="transparent" stroke="hsl(var(--color-border))" strokeWidth="6"></circle>
              <motion.circle
                cx="40"
                cy="40"
                r="32"
                fill="transparent"
                stroke="rgb(16, 185, 129)"
                strokeWidth="6"
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                initial={{ strokeDasharray: "201.06", strokeDashoffset: "201.06" }}
                animate={{ strokeDashoffset: String(201.06 - (completionPercent / 100) * 201.06) }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-base font-black text-slate-900 dark:text-slate-100">
              {completionPercent}%
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{takenCount}/{totalToday}</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Doses Completed</span>
          </div>
        </div>

        {/* Next Dose Countdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#4F6BFF]/10 text-[#4F6BFF] border border-[#4F6BFF]/20 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100 truncate max-w-[170px]" title={nextMed?.name}>
              {countdown}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 truncate">
              {nextMed ? `Next: ${nextMed.name} at ${nextMed.time}` : 'No upcoming doses'}
            </span>
          </div>
        </div>

        {/* Missed / Warnings Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${
            missedCount > 0 
              ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}>
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {missedCount}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              Missed Doses Today
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Timeline / Right Water & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Schedule Log Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Today's Schedule Log
              </h3>
              <span className="text-[10px] font-bold text-slate-455 dark:text-slate-550">
                Sorted Chronologically
              </span>
            </div>

            {totalToday === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 flex items-center justify-center text-2xl">
                  📭
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Your schedule is empty for today</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Press "Add Schedule" to log your daily medication plans.</p>
                </div>
              </div>
            ) : (
              <div className="relative border-l border-slate-200 dark:border-slate-800/60 pl-3.5 sm:pl-6 ml-1.5 sm:ml-4 space-y-5 py-2">
                {(() => {
                  // Group by time
                  const grouped = [...medications].reduce((acc, med) => {
                    if (!acc[med.time]) acc[med.time] = [];
                    acc[med.time].push(med);
                    return acc;
                  }, {});

                  const sortedTimes = Object.keys(grouped).sort();

                  return sortedTimes.map(time => {
                    const medsInSlot = grouped[time];
                    const allTaken = medsInSlot.every(med => takenMeds.includes(med._id));
                    const anyMissed = medsInSlot.some(med => {
                      const [h, m] = med.time.split(':').map(Number);
                      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
                      return (h * 60 + m) < nowMins && !takenMeds.includes(med._id);
                    });

                    const nodeClass = allTaken ? 'taken' : anyMissed ? 'missed' : 'pending';

                    return (
                      <div key={time} className="relative">
                        {/* Timeline Bullet Node */}
                        <div className={`absolute w-3.5 h-3.5 rounded-full border-4 bg-white dark:bg-slate-900 left-[-21px] sm:left-[-31px] top-6 transition-all duration-300 ${
                          nodeClass === 'taken' 
                            ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : nodeClass === 'missed'
                              ? 'border-red-500 bg-red-500'
                              : 'border-[#4F6BFF]'
                        }`} />

                        {/* Group Container Card */}
                        <div className="flex flex-col gap-2.5 p-2.5 sm:p-4 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/30 rounded-2xl shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-slate-800/80 transition-all duration-200">
                          {/* Time slot header */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/20 pb-2 mb-0.5">
                            <span className="text-[10px] font-extrabold text-[#4F6BFF] bg-[#4F6BFF]/10 px-2.5 rounded-lg py-1">
                              {time}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {medsInSlot.length} {medsInSlot.length === 1 ? 'medicine' : 'medicines'}
                            </span>
                          </div>

                          {/* List of sub-medicines in time slot */}
                          <div className="space-y-2">
                            {medsInSlot.map(med => {
                              const isTaken = takenMeds.includes(med._id);
                              return (
                                <div
                                  key={med._id}
                                  className={`relative group/sub flex items-center justify-between p-1.5 sm:p-2.5 border rounded-xl transition-all duration-200 ${
                                    isTaken
                                      ? 'bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-200/70 dark:border-emerald-500/20'
                                      : 'bg-white dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-850/60 hover:bg-[#EEF4FF]/40 dark:hover:bg-slate-800/20 hover:border-[#4F6BFF]/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${getTimelineIconBoxBg(med.shape)}`}>
                                      {getTimelineIcon(med.shape)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className={`text-xs font-extrabold ${isTaken ? 'line-through text-emerald-800/60 dark:text-emerald-450/40' : 'text-slate-800 dark:text-slate-100'}`}>
                                        {med.name}
                                      </span>
                                      <span className={`text-[9px] font-bold mt-0.5 ${isTaken ? 'text-emerald-700/50 dark:text-emerald-500/30' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {med.dosage || '1 pill'} • {med.instructions || 'After Food'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Hover Actions (Always visible on mobile, hover-only on desktop) */}
                                    <div className="opacity-100 md:opacity-0 md:group-hover/sub:opacity-100 flex items-center gap-0.5 transition-opacity duration-200">
                                      <button
                                        onClick={() => onOpenEditModal(med)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-[#4F6BFF] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Edit medication"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => onDeleteMedication(med._id)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                                        title="Delete medication"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                          <polyline points="3 6 5 6 21 6"></polyline>
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Taken Checkbox */}
                                    <button
                                      onClick={() => onToggleTaken(med._id)}
                                      className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
                                        isTaken
                                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                          : 'border-slate-200 dark:border-slate-800/80 text-transparent hover:border-[#4F6BFF] hover:bg-[#4F6BFF]/5'
                                      }`}
                                      title={isTaken ? 'Mark as Pending' : 'Mark as Taken'}
                                    >
                                      <Check className={`w-3.5 h-3.5 ${isTaken ? 'text-white' : 'hover:text-[#4F6BFF]'}`} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {totalToday > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center gap-2.5 text-xs font-semibold text-[#4F6BFF] bg-[#4F6BFF]/5 p-3 rounded-2xl">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{motivationMessage}</span>
            </div>
          )}
        </div>

        {/* Right: Water Intake & Health Tip */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Water Intake Tracker */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium flex flex-col justify-between h-[280px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-sky-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Water Tracker
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Goal: 8 Cups
                </span>
              </div>

              {/* Water Visual container with wave animations */}
              <div className="flex items-center gap-6">
                <div className="relative w-16 h-24 border-3 border-sky-500/20 dark:border-sky-500/10 rounded-b-2xl rounded-t-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-950/40">
                  {/* Wave Fill level */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-550 to-sky-400 opacity-80"
                    animate={{ height: `${Math.min((waterCups / 8) * 100, 100)}%` }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  />
                  {/* Glass measurements lines */}
                  <div className="absolute inset-0 flex flex-col justify-between p-1 opacity-20 pointer-events-none text-[8px] font-bold text-sky-500">
                    <div></div>
                    <div className="border-t border-sky-500 w-1/2">6c</div>
                    <div className="border-t border-sky-500 w-1/2">4c</div>
                    <div className="border-t border-sky-500 w-1/2">2c</div>
                    <div></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {waterCups} <span className="text-xs font-semibold text-slate-450 dark:text-slate-500">/ 8 Cups</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => logWaterCup(1)}
                      className="px-4 py-2 bg-[#4F6BFF] hover:bg-[#3b55e6] text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
                    >
                      +1 Cup
                    </button>
                    <button
                      onClick={() => logWaterCup(-1)}
                      disabled={waterCups === 0}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-bold active:scale-95 transition-all duration-200"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-normal border-t border-slate-100 dark:border-slate-800/40 pt-3.5 mt-2">
              Staying hydrated supports kidney function and boosts consistency.
            </div>
          </div>

          {/* Daily Health Tip */}
          <div className="bg-gradient-to-br from-[#4F6BFF] to-indigo-650 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium flex flex-col justify-between text-white h-[180px]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-100" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-100">
                Daily Medical Tip
              </span>
            </div>
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.4 }}
              className="text-xs font-bold leading-relaxed flex-1 flex items-center"
            >
              "{HEALTH_TIPS[tipIndex]}"
            </motion.p>
            <div className="text-[10px] text-brand-200/80 font-semibold mt-2">
              Rotates automatically • MedFlow Health Panel
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
