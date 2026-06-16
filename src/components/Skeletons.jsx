import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse">
      {/* Welcome Greeting Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Columns Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6">
          <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-200/50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                    <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-[400px] bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6"></div>
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}

export function MedicationsSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="w-40 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between mb-4">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              </div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
