import React, { useState } from 'react';
import { LayoutGrid, Pill, BarChart3, Settings, LogOut, Menu, X, Sun, Moon } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, userSession, onLogout, theme, toggleThemeMode }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'medications', label: 'My Medications', icon: Pill },
    { id: 'stats', label: 'Stats & Adherence', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initials = userSession?.name
    ? userSession.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsOpen(false); // close drawer on selection
  };

  return (
    <>
      {/* Mobile Top Header Navbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/40 flex items-center justify-between px-4 z-40 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#4F6BFF]/10 text-[#4F6BFF] border border-[#4F6BFF]/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-[#4F6BFF] to-[#6EA8FE] bg-clip-text text-transparent">
              MedFlow
            </span>
          </div>
        </div>

        {/* Theme toggle in mobile navbar */}
        <button
          onClick={toggleThemeMode}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5 text-brand-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/40 p-6 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static md:h-screen md:bg-white md:dark:bg-slate-950 shrink-0 shadow-md md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-8">
          {/* Logo & Drawer Dismiss Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF] border border-[#4F6BFF]/20 shadow-[0_0_15px_rgba(79,92,255,0.05)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#4F6BFF] to-[#6EA8FE] bg-clip-text text-transparent">
                MedFlow
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav>
            <ul className="space-y-1.5 list-none">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleTabClick(item.id)}
                      className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/25'
                          : 'text-[#374151] dark:text-slate-400 hover:bg-[#EEF4FF] hover:text-[#4F6BFF] dark:hover:bg-slate-900/60 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* User profile & Logout footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F6BFF] to-[#6EA8FE] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate text-slate-900 dark:text-slate-200">
              {userSession?.name || 'Welcome'}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
              User Profile
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-450 hover:text-red-500 hover:bg-red-500/5 transition-all duration-200 shrink-0"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
