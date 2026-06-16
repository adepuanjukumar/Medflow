import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, Edit3, Clock } from 'lucide-react';

export default function Medications({
  medications,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteMedication
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Tablets', 'Capsules', 'Syrups', 'Inhalers', 'Drops', 'Injection', 'Cream/Ointment'];

  const filteredMeds = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = categoryFilter === 'All' || med.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getTagColor = (shape) => {
    switch (shape) {
      case 'capsule': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'liquid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'inhaler': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-[#4F6BFF]/10 text-[#4F6BFF] border-[#4F6BFF]/20';
    }
  };

  const getCategoryIcon = (shape) => {
    switch (shape) {
      case 'capsule':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5">
            <rect x="7" y="2" width="10" height="20" rx="5" ry="5"></rect>
            <line x1="7" y1="12" x2="17" y2="12"></line>
          </svg>
        );
      case 'liquid':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H17v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8h1.5"></path>
          </svg>
        );
      case 'inhaler':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5">
            <path d="M10 3h4v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V3zM6 18h12a2 2 0 0 1 2 2v1h-16v-1a2 2 0 0 1 2-2z"></path>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        );
    }
  };

  // Group by time
  const grouped = filteredMeds.reduce((acc, med) => {
    if (!acc[med.time]) acc[med.time] = [];
    acc[med.time].push(med);
    return acc;
  }, {});

  const sortedTimes = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Medication Schedule List
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Search, filter, or manage your scheduled reminders.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#4F6BFF] to-[#6EA8FE] text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Medication
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scheduled medications..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:ring-4 focus:ring-[#4F6BFF]/15 outline-none transition-all duration-200 shadow-premium-light dark:shadow-premium"
          />
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-600 absolute left-3.5 top-3.5" />
        </div>

        {/* Category select dropdown */}
        <div className="w-full sm:w-auto shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-44 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-[#4F6BFF]/15 outline-none transition-all duration-200 shadow-premium-light dark:shadow-premium"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Form Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredMeds.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-3xl p-16 shadow-premium-light dark:shadow-premium flex flex-col items-center justify-center text-center space-y-5 max-w-lg mx-auto mt-8">
          <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 flex items-center justify-center text-4xl shadow-inner">
            💊
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              No medications added yet
            </h3>
            <p className="text-sm text-slate-450 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
              Get started by adding your first medicine schedule. MedFlow will keep you on track.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-6 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-md shadow-brand-500/20 hover:shadow-lg transition-all duration-205"
          >
            Add Your First Medicine
          </button>
        </div>
      ) : (
        /* Grouped Medications Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTimes.map(time => {
            const medsInSlot = grouped[time];
            return (
              <div
                key={time}
                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 rounded-3xl p-4 sm:p-5 shadow-premium-light dark:shadow-premium flex flex-col gap-4 border-t-4 border-t-[#4F6BFF]"
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/25 pb-3">
                  <div className="flex items-center gap-1.5 text-[#4F6BFF] bg-[#4F6BFF]/10 px-3 py-1.5 rounded-xl font-extrabold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>{time}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/40 px-2 py-1 rounded-lg">
                    {medsInSlot.length} {medsInSlot.length === 1 ? 'Med' : 'Meds'}
                  </span>
                </div>

                {/* Slot Medicines List */}
                <div className="space-y-3.5">
                  {medsInSlot.map(med => (
                    <div
                      key={med._id}
                      className="relative group/med flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/30 rounded-2xl hover:bg-[#EEF4FF] hover:border-[#4F6BFF]/30 dark:hover:border-slate-800/80 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${getTagColor(med.shape)}`}>
                          {getCategoryIcon(med.shape)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs truncate">
                            {med.name}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                            {med.category || 'Tablets'} • {med.dosage || '1 pill'} • {med.instructions || 'After Food'}
                          </p>
                        </div>
                      </div>

                      {/* Edit/Delete Hover Actions */}
                      <div className="opacity-100 md:opacity-0 md:group-hover/med:opacity-100 flex items-center gap-1 transition-opacity duration-150">
                        <button
                          onClick={() => onOpenEditModal(med)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#4F6BFF] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit medication"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMedication(med._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                          title="Delete medication"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
