import React from 'react';
import { TabKey } from '../types/portal';
import { Shield, AlertCircle, UserCheck, LogOut } from 'lucide-react';

interface HeaderNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isAdmin: boolean;
  onLogoutAdmin: () => void;
  onOpenEmergency: () => void;
  onOpenReport: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  onLogoutAdmin,
  onOpenEmergency,
  onOpenReport,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single Text Element Wordmark */}
          <button
            onClick={() => onSelectTab('beranda')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md py-1"
          >
            <div className="w-11 h-11 shrink-0 flex items-center justify-center">
              <img
                src="/logo-gan.png"
                alt="Griya Adika Narama"
                className="w-full h-full object-contain"
               />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-900 transition-colors">
                Living In Narama
              </span>
              <span className="hidden sm:inline text-xs text-emerald-700 font-medium ml-2">
                Blok H
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (Clean text links with active indicator) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => onSelectTab('beranda')}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                activeTab === 'beranda'
                  ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => onSelectTab('pengumuman')}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                activeTab === 'pengumuman'
                  ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
              }`}
            >
              Pengumuman
            </button>
            <button
              onClick={() => onSelectTab('agenda')}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                activeTab === 'agenda'
                  ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => onSelectTab('proker')}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                activeTab === 'proker'
                  ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
              }`}
            >
              Program Kerja
            </button>
            <button
              onClick={() => onSelectTab('keuangan')}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                activeTab === 'keuangan'
                  ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
              }`}
            >
              Keuangan
            </button>
            <button
              onClick={() => onSelectTab('dokumentasi')}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                activeTab === 'dokumentasi'
                  ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
              }`}
            >
              Dokumentasi
            </button>
                        <button
              onClick={() => onSelectTab('pengurus')}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                activeTab === 'pengurus'
                  ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
              }`}
            >
              Pengurus
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenEmergency}
              className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Kontak Keamanan & Darurat 24 Jam"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Kontak Darurat</span>
              <span className="sm:hidden">Darurat</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-emerald-100/70 border border-emerald-300 rounded-lg p-1 pr-2">
                <button
                  onClick={() => onSelectTab('admin')}
                  className="px-2 py-1 text-xs font-semibold text-emerald-900 flex items-center gap-1 hover:text-emerald-950"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Admin Blok H</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white rounded transition-colors"
                  title="Keluar dari sesi Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onSelectTab('admin')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'bg-emerald-800 text-emerald-50 hover:bg-emerald-700'
                }`}
              >
                Login Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
