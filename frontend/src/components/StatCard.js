import React from 'react';

export default function StatCard({ title, value, icon: Icon, gradient, change, suffix = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-card ${gradient}`}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          {change !== undefined && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${change >= 0 ? 'bg-white/20' : 'bg-black/20'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight">{value ?? '—'}{suffix}</p>
        <p className="text-sm text-white/75 mt-1 font-medium">{title}</p>
      </div>
    </div>
  );
}
