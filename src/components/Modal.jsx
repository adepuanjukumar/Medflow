import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Bell, Sparkles, AlertCircle } from 'lucide-react';

const PRESETS = {
  Tablets: [
    { name: 'Paracetamol', dosage: '1 tablet', instructions: 'After Food' },
    { name: 'Dolo 650', dosage: '1 tablet', instructions: 'After Food' },
    { name: 'Crocin', dosage: '1 tablet', instructions: 'After Food' },
    { name: 'Metformin', dosage: '1 tablet', instructions: 'With Food' },
    { name: 'Vitamin C', dosage: '1 tablet', instructions: 'With Food' },
    { name: 'Pantoprazole', dosage: '1 tablet', instructions: 'Before Food' },
    { name: 'Allegra', dosage: '1 tablet', instructions: 'After Food' },
    { name: 'Digene', dosage: '2 tablets', instructions: 'After Food' }
  ],
  Capsules: [
    { name: 'Amoxicillin', dosage: '1 capsule', instructions: 'After Food' },
    { name: 'Omeprazole', dosage: '1 capsule', instructions: 'Before Food' },
    { name: 'Vitamin E Capsule', dosage: '1 capsule', instructions: 'After Food' },
    { name: 'Fish Oil Capsule', dosage: '1 capsule', instructions: 'With Food' }
  ],
  Syrups: [
    { name: 'Benadryl Syrup', dosage: '10 ml', instructions: 'After Food' },
    { name: 'Cough Syrup', dosage: '10 ml', instructions: 'After Food' },
    { name: 'Zinc Syrup', dosage: '5 ml', instructions: 'After Food' },
    { name: 'Liv52 Syrup', dosage: '10 ml', instructions: 'Before Food' }
  ],
  Inhalers: [
    { name: 'Albuterol Inhaler', dosage: '2 puffs', instructions: 'Before Food' },
    { name: 'Budesonide Inhaler', dosage: '1 puff', instructions: 'Before Food' },
    { name: 'Fluticasone Inhaler', dosage: '2 puffs', instructions: 'Before Food' }
  ],
  Drops: [
    { name: 'Tear Drops', dosage: '2 drops', instructions: 'Before Food' },
    { name: 'Otrivin Drops', dosage: '2 drops', instructions: 'Before Food' },
    { name: 'Ear Drops', dosage: '3 drops', instructions: 'Before Food' },
    { name: 'Eye Drops', dosage: '2 drops', instructions: 'Before Food' }
  ],
  Injection: [
    { name: 'Insulin', dosage: '10 units', instructions: 'Before Food' },
    { name: 'Heparin', dosage: '5000 units', instructions: 'Before Food' }
  ],
  'Cream/Ointment': [
    { name: 'Betadine Ointment', dosage: 'Apply thin layer', instructions: 'After Food' },
    { name: 'Hydrocortisone Cream', dosage: 'Apply thin layer', instructions: 'After Food' },
    { name: 'Diclofenac Gel', dosage: 'Apply thin layer', instructions: 'After Food' }
  ]
};

const CATEGORIES = ['Tablets', 'Capsules', 'Syrups', 'Inhalers', 'Drops', 'Injection', 'Cream/Ointment'];

export default function MedicationModal({ isOpen, onClose, onSave, editingItem, duplicateWarning }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tablets');
  const [dosage, setDosage] = useState('1 tablet');
  const [time, setTime] = useState('08:00');
  const [instructions, setInstructions] = useState('After Food');
  const [reminderSound, setReminderSound] = useState('chime');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredPresets, setFilteredPresets] = useState([]);
  
  const suggestionRef = useRef(null);

  // Initialize form when opening/editing
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setName(editingItem.name || '');
        setSearchQuery(editingItem.name || '');
        setCategory(editingItem.category || 'Tablets');
        setDosage(editingItem.dosage || '1 tablet');
        setTime(editingItem.time || '08:00');
        setInstructions(editingItem.instructions || 'After Food');
        setReminderSound(editingItem.reminderSound || 'chime');
      } else {
        setName('');
        setSearchQuery('');
        setCategory('Tablets');
        setDosage('1 tablet');
        setTime('08:00');
        setInstructions('After Food');
        setReminderSound('chime');
      }
    }
  }, [isOpen, editingItem]);

  // Handle autocomplete filtering depending on selected category type
  useEffect(() => {
    const presetsForCategory = PRESETS[category] || [];
    if (searchQuery.trim().length > 0) {
      const matched = presetsForCategory.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPresets(matched);
    } else {
      // Default show all presets for category on input focus
      setFilteredPresets(presetsForCategory);
    }
  }, [searchQuery, category]);

  // Click outside suggestions list to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    
    // Clear name or update name presets default if user switches category
    setName('');
    setSearchQuery('');
    
    // Set default dosage for new category
    if (cat === 'Tablets') setDosage('1 tablet');
    else if (cat === 'Capsules') setDosage('1 capsule');
    else if (cat === 'Syrups') setDosage('10 ml');
    else if (cat === 'Inhalers') setDosage('2 puffs');
    else if (cat === 'Drops') setDosage('2 drops');
    else if (cat === 'Injection') setDosage('10 units');
    else if (cat === 'Cream/Ointment') setDosage('Apply thin layer');
  };

  const handleSelectPreset = (preset) => {
    setName(preset.name);
    setSearchQuery(preset.name);
    setDosage(preset.dosage);
    setInstructions(preset.instructions);
    setShowSuggestions(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    // Map categories to shapes for backend icons compatibility
    let shape = 'pill';
    if (category === 'Capsules') shape = 'capsule';
    else if (category === 'Syrups' || category === 'Drops') shape = 'liquid';
    else if (category === 'Inhalers') shape = 'inhaler';

    onSave({
      name: name.trim(),
      category,
      dosage,
      time,
      frequency: 'Once daily', // Default required for app render views
      instructions,
      colorTag: 'blue',       // Default required for app render views
      repeatSchedule: true,   // Default required for app render views
      reminderSound,
      notes: '',              // Default required for app render views
      shape
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-[24px] shadow-2xl glass z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/40 shrink-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-brand-500" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {editingItem ? 'Edit Medication' : 'Add Medication'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
              {duplicateWarning && (
                <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              {/* 1. Medicine Type Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Medicine Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                        category === cat
                          ? 'bg-brand-500/10 text-brand-500 border-brand-500/40 shadow-[0_0_12px_rgba(79,92,255,0.25)]'
                          : 'bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Medicine Name Input with Suggestions */}
              <div className="relative" ref={suggestionRef}>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Medicine Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={`Search ${category.toLowerCase()}...`}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/15 outline-none transition-all duration-200"
                  />
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-600 absolute left-3 top-3.5" />
                </div>

                {/* Filtered suggestions list based on Category */}
                <AnimatePresence>
                  {showSuggestions && filteredPresets.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 3 }}
                      className="absolute z-[100] w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg glass overflow-hidden max-h-40 overflow-y-auto space-y-0.5 p-1"
                    >
                      {filteredPresets.map((preset, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            {preset.name}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Dosage & Time inputs */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 1 pill / 5 ml"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/15 outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/15 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* 4. Food instructions & Reminder Sound selection */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Food intake
                  </label>
                  <select
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/15 outline-none transition-all duration-200"
                  >
                    <option value="Before Food">Before Food</option>
                    <option value="After Food">After Food</option>
                    <option value="With Food">With Food</option>
                    <option value="Empty Stomach">Empty Stomach</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" /> Sound Alert
                  </label>
                  <select
                    value={reminderSound}
                    onChange={(e) => setReminderSound(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/15 outline-none transition-all duration-200"
                  >
                    <option value="chime">Soft Chime</option>
                    <option value="bell">Bell</option>
                    <option value="alert">Digital Alarm</option>
                    <option value="calm">Calm Tone</option>
                    <option value="notification">Gentle Notification</option>
                    <option value="silent">Silent (Muted)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-500 hover:bg-brand-600 active:bg-brand-700 shadow-md shadow-brand-500/20 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
              >
                {editingItem ? 'Save Changes' : 'Add Medication'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
