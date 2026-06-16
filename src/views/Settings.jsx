import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Moon, Sun, Volume2, Play, Pause, UserCircle, Bell, BellOff, VolumeX, FileText, Download, Smartphone, Wifi, WifiOff, Share2 } from 'lucide-react';

export default function Settings({
  theme,
  toggleThemeMode,
  userSession,
  medications,
  takenMeds = [],
  volume,
  setVolume,
  defaultSound,
  setDefaultSound,
  notificationsEnabled,
  setNotificationsEnabled,
  onTriggerTestReminder,
  addToast,
  connectedMobileDevices = 0,
  onTestMobilePush
}) {
  const [reportLoading, setReportLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [mobileConnected, setMobileConnected] = useState(connectedMobileDevices > 0);

  // Stop sound on unmount
  useEffect(() => {
    return () => {
      if (window.reminderAudio) {
        window.reminderAudio.pause();
        window.reminderAudio.currentTime = 0;
      }
    };
  }, []);

  // Update volume dynamically during preview
  useEffect(() => {
    if (window.reminderAudio) {
      window.reminderAudio.volume = volume > 1 ? volume / 100 : volume;
    }
  }, [volume]);

  // Stop sound if selector changes
  useEffect(() => {
    if (window.reminderAudio) {
      window.reminderAudio.pause();
      window.reminderAudio.currentTime = 0;
      setIsPlaying(false);
    }
  }, [defaultSound]);

  const toggleTestAlarm = () => {
    const audio = window.reminderAudio;
    if (!audio) {
      addToast("Audio engine still initializing.", "warning");
      return;
    }

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else {
      const soundPathMap = {
        chime: '/sounds/soft_chime.wav',
        bell: '/sounds/bell.wav',
        alert: '/sounds/digital_alarm.wav',
        calm: '/sounds/calm_tone.wav',
        notification: '/sounds/gentle_notification.wav'
      };

      const path = soundPathMap[defaultSound] || defaultSound;
      if (!path) return;

      audio.pause();
      audio.src = path;
      audio.volume = volume > 1 ? volume / 100 : volume;
      audio.currentTime = 0;
      audio.loop = false; // Preview should play once, not loop!
      setIsPlaying(true);

      audio.play()
        .then(() => {
          console.log("[Settings Preview] Playing preview sound:", path);
        })
        .catch(err => {
          console.error("[Settings Preview] Audio play blocked/failed:", err);
          addToast("Unable to play preview. Click anywhere to unlock audio.", "error");
          setIsPlaying(false);
        });

      audio.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const handleGenerateReport = (preview = false) => {
    setReportLoading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
      
      const totalMeds = medications.length;
      const takenList = medications.filter(m => takenMeds.includes(m._id));
      const takenCount = takenList.length;
      
      const missedList = medications.filter(m => {
        const [h, mins] = m.time.split(':').map(Number);
        const medMins = h * 60 + mins;
        const nowMins = today.getHours() * 60 + today.getMinutes();
        return medMins < nowMins && !takenMeds.includes(m._id);
      });
      const missedCount = missedList.length;

      const pendingList = medications.filter(m => {
        const [h, mins] = m.time.split(':').map(Number);
        const medMins = h * 60 + mins;
        const nowMins = today.getHours() * 60 + today.getMinutes();
        return medMins >= nowMins && !takenMeds.includes(m._id);
      });
      const pendingCount = pendingList.length;

      const completionPercent = totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 0;
      const waterCups = localStorage.getItem(`water_${userSession?.userId || 'guest'}_${getTodayKey()}`) || '0';
      const consistencyScore = completionPercent > 80 ? 'Excellent' : completionPercent > 50 ? 'Good' : 'Needs Routine';

      // 1. Blue MedFlow Header Block
      doc.setFillColor(79, 107, 255);
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("MedFlow - Daily Health Report", 15, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(220, 225, 255);
      doc.text(`Generated on: ${dateStr} at ${today.toLocaleTimeString()}`, 15, 30);
      doc.text("Personal Health Summary & Medication Adherence Log", 15, 35);

      // 2. Patient details
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text("Patient Information", 15, 54);

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.4);
      doc.line(15, 57, 195, 57);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(`Patient Name:  ${userSession?.name || 'User'}`, 15, 65);
      doc.text(`Email Address: ${userSession?.email || 'user@test.com'}`, 15, 71);

      // 3. Status Cards
      doc.setFillColor(245, 247, 251);
      doc.roundedRect(15, 79, 85, 36, 4, 4, 'F');
      doc.roundedRect(110, 79, 85, 36, 4, 4, 'F');

      // Adherence Score Card
      doc.setTextColor(79, 107, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("ADHERENCE RATE & SCORE", 20, 87);
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(18);
      doc.text(`${completionPercent}%`, 20, 96);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Consistency: ${consistencyScore}`, 20, 106);

      // Hydration Card
      doc.setTextColor(79, 107, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("HYDRATION STATUS", 115, 87);
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(18);
      doc.text(`${waterCups} Cups`, 115, 96);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Today's Water Intake Progress`, 115, 106);

      // 4. Detailed Medication Log
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text("Medication Activity Details", 15, 130);
      doc.line(15, 133, 195, 133);

      // Table Header Row
      doc.setFillColor(239, 244, 255);
      doc.rect(15, 138, 180, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(79, 107, 255);
      doc.text("Time", 18, 143);
      doc.text("Medicine Name", 40, 143);
      doc.text("Dosage", 95, 143);
      doc.text("Instructions", 130, 143);
      doc.text("Status", 170, 143);

      let y = 146;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);

      if (medications.length === 0) {
        doc.text("No medicines scheduled for today.", 20, y + 6);
      } else {
        const sorted = [...medications].sort((a, b) => a.time.localeCompare(b.time));
        sorted.forEach((med) => {
          y += 8;
          doc.setDrawColor(243, 244, 246);
          doc.line(15, y + 2, 195, y + 2);
          doc.text(med.time, 18, y - 2);
          doc.setFont('helvetica', 'bold');
          doc.text(med.name, 40, y - 2);
          doc.setFont('helvetica', 'normal');
          doc.text(med.dosage || '1 pill', 95, y - 2);
          doc.text(med.instructions || 'After Food', 130, y - 2);
          
          const isTaken = takenMeds.includes(med._id);
          const isMissed = missedList.some(m => m._id === med._id);

          if (isTaken) {
            doc.setTextColor(16, 185, 129);
            doc.text("Taken", 170, y - 2);
          } else if (isMissed) {
            doc.setTextColor(239, 68, 68);
            doc.text("Missed", 170, y - 2);
          } else {
            doc.setTextColor(107, 114, 128);
            doc.text("Pending", 170, y - 2);
          }
          doc.setTextColor(31, 41, 55);
        });
      }

      y += 18;
      doc.setFillColor(245, 247, 251);
      doc.roundedRect(15, y, 180, 20, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("Log Status Summary:", 20, y + 12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Taken: ${takenCount}  |  Pending: ${pendingCount}  |  Missed: ${missedCount}`, 60, y + 12);

      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("MedFlow Digital Health Planner - Patient Daily Log Summary Report", 15, 282);
      doc.text("Page 1 of 1", 182, 282);

      if (preview) {
        const string = doc.output('datauristring');
        const iframe = "<iframe width='100%' height='100%' src='" + string + "'></iframe>";
        const x = window.open();
        if (x) {
          x.document.open();
          x.document.write(iframe);
          x.document.close();
          addToast("Report preview opened in new tab!", "success");
        } else {
          addToast("Pop-up blocked. Please allow popups to preview.", "error");
        }
      } else {
        doc.save(`medflow-report-${dateStr}.pdf`);
        addToast("Report PDF downloaded successfully!", "success");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to compile PDF report.", "error");
    } finally {
      setReportLoading(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      if (!("Notification" in window)) {
        addToast("This browser does not support desktop notifications.", "error");
        return;
      }

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          addToast("Notification permission was denied by user.", "warning");
          return;
        }
      }
      setNotificationsEnabled(true);
      addToast("Desktop notifications enabled successfully!", "success");
    } else {
      setNotificationsEnabled(false);
      addToast("Desktop notifications disabled.", "info");
    }
  };

  const initials = userSession?.name
    ? userSession.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Panel */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          Personal App Settings
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Configure notifications, alarm volumes, PDF activity reports, and profile settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: General Profile & Sounds Settings */}
        <div className="space-y-6">
          
          {/* Profile Card Mockup */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#4F6BFF] to-[#6EA8FE] text-white flex items-center justify-center font-black text-2xl shadow-md uppercase">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-slate-850 dark:text-slate-200 truncate">
                {userSession?.name || 'Loading Name...'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
                {userSession?.email || 'user@test.com'}
              </p>
            </div>
          </div>

          {/* Sound & Notifications Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium space-y-5">
            <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-brand-500" /> Sound & Alarms
            </h3>
            
            {/* Reminder Sound Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                Default Reminder Sound
              </label>
              <select
                value={defaultSound}
                onChange={(e) => setDefaultSound(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#4F6BFF]/15 outline-none transition-all duration-200"
              >
                <option value="chime">Soft Chime</option>
                <option value="bell">Bell</option>
                <option value="alert">Digital Alarm</option>
                <option value="calm">Calm Tone</option>
                <option value="notification">Gentle Notification</option>
                <option value="silent">Silent (Muted)</option>
              </select>
            </div>

            {/* Volume range slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Alert Sound Volume</span>
                <span className="flex items-center gap-1 font-extrabold">
                  {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-brand-500" />}
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                disabled={defaultSound === 'silent'}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg appearance-none cursor-pointer accent-brand-500 disabled:opacity-40"
              />
            </div>

            {/* Notification alert tests */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Play test alarm sound</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Pre-audition current volume & voice</span>
              </div>
              <button
                type="button"
                onClick={toggleTestAlarm}
                disabled={defaultSound === 'silent'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none hover:scale-105 active:scale-95 ${
                  isPlaying 
                    ? 'bg-[#4F6BFF] text-white shadow-[0_0_15px_rgba(79,107,255,0.55)] animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-500 hover:text-white'
                }`}
                title={isPlaying ? "Stop test alarm" : "Play test alarm"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
            </div>

            {/* Full Test Reminder Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40">
              <button
                type="button"
                onClick={onTriggerTestReminder}
                disabled={defaultSound === 'silent'}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 hover:from-brand-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-brand-500/15 hover:shadow-lg hover:shadow-brand-500/25 transition-all duration-250 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Bell className="w-4 h-4 text-white" />
                Test Reminder Sound (Full Flow)
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: PDF Reports, Themes, Notifications toggles */}
        <div className="space-y-6">
          
          {/* Theme togglers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-brand-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  {theme === 'dark' ? 'Dark Premium Theme' : 'Light Theme'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Adjust visual appearance
                </span>
              </div>
            </div>
            <button
              onClick={toggleThemeMode}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                theme === 'dark' ? 'bg-brand-500' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Desktop Notification Toggle */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="w-5 h-5 text-emerald-500 animate-swing" />
              ) : (
                <BellOff className="w-5 h-5 text-slate-400" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  Desktop Notifications
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Request permission and alerts
                </span>
              </div>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Today's Medicine Report (Replaces Technical Backup UI) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium space-y-4">
            <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4F6BFF]" /> Today's Medicine Report
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Download today's medicine and health activity as a professional PDF report.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
              {/* Preview PDF */}
              <button
                onClick={() => handleGenerateReport(true)}
                disabled={reportLoading}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-[#EEF4FF] dark:hover:bg-slate-950 hover:text-[#4F6BFF] dark:hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Preview Report
              </button>

              {/* Download PDF */}
              <button
                onClick={() => handleGenerateReport(false)}
                disabled={reportLoading}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-[#4F6BFF] hover:bg-[#3b55e6] text-white font-bold text-xs shadow-md shadow-[#4F6BFF]/15 transition-all duration-200 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Connect Phone via QR Code */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-[24px] sm:rounded-3xl p-3.5 sm:p-6 shadow-premium-light dark:shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#4F6BFF]" /> Connect Phone
              </h3>
              <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                mobileConnected
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {mobileConnected
                  ? <><Wifi className="w-3 h-3" /> Connected</>
                  : <><WifiOff className="w-3 h-3" /> Not Connected</>}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Scan this QR code on your phone to receive medicine reminders directly — even when your laptop screen is off.
            </p>

            {/* QR Code Display */}
            <div className="flex flex-col items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/40">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100">
                  <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
                </div>
              ) : (
                <div className="w-36 h-36 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 border-dashed flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
              )}

              {connectUrl && (
                <div className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Connection URL</p>
                  <p className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 break-all">{connectUrl}</p>
                </div>
              )}

              <div className="flex gap-2 w-full">
                <button
                  onClick={async () => {
                    setQrLoading(true);
                    try {
                      const res = await fetch('/api/connection-url');
                      const data = await res.json();
                      if (data.url) {
                        setConnectUrl(data.url);
                        const qr = await QRCode.toDataURL(data.url, { width: 280, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } });
                        setQrDataUrl(qr);
                        addToast('QR code generated! Scan with your phone.', 'success');
                      }
                    } catch (err) {
                      addToast('Failed to generate QR code. Make sure server is running.', 'error');
                    } finally {
                      setQrLoading(false);
                    }
                  }}
                  disabled={qrLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-[#EEF4FF] dark:hover:bg-slate-700 hover:text-[#4F6BFF] transition-all disabled:opacity-50"
                >
                  {qrLoading ? '⏳ Loading...' : <><Share2 className="w-3.5 h-3.5" /> Generate QR</>}
                </button>

                <button
                  onClick={onTestMobilePush}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#4F6BFF] hover:bg-[#3b55e6] text-white font-bold text-xs shadow-md shadow-[#4F6BFF]/15 transition-all"
                >
                  📱 Test Push
                </button>
              </div>

              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold text-center">
                Both devices must be on the same Wi-Fi network. Phone will receive alerts even when laptop screen is idle.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
