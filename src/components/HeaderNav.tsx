
import React from 'react';
import { TabKey } from '../types/portal';
import { Shield, AlertCircle, UserCheck, LogOut } from 'lucide-react';

interface HeaderNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  adminName: string;
  onLogoutAdmin: () => void | Promise<void>;
  onOpenEmergency: () => void;
  onOpenReport: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  isAuthenticated,
  adminName,
  onLogoutAdmin,
  onOpenEmergency,
  onOpenReport,
}) => {
  const navItems: { tab: TabKey; label: string }[] = [
    { tab: 'beranda', label: 'Beranda' },
    { tab: 'pengumuman', label: 'Pengumuman' },
    { tab: 'agenda', label: 'Agenda' },
    { tab: 'komunitas', label: 'Komunitas' },
    { tab: 'publikasi', label: 'Publikasi' },
    { tab: 'dokumentasi', label: 'Dokumentasi' },
    { tab: 'pengurus', label: 'Pengurus' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            type="button"
            onClick={() => onSelectTab('beranda')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md py-1"
          >
            <div className="w-11 h-11 shrink-0 flex items-center justify-center">
              <img
                src="/logo-h.png"
                alt="Griya Adika Narama"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-900 transition-colors">
                Living In Narama
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map(({ tab, label }) => (
              <button
                key={tab}
                type="button"
                onClick={() => onSelectTab(tab)}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEmergency}
              className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Kontak Keamanan & Darurat 24 Jam"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Kontak Darurat</span>
              <span className="sm:hidden">Darurat</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 bg-emerald-100/70 border border-emerald-300 rounded-lg p-1 pr-2">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => onSelectTab('admin')}
                    className="px-2 py-1 text-xs font-semibold text-emerald-900 flex items-center gap-1 hover:text-emerald-950"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{adminName}</span>
                  </button>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold text-emerald-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{adminName}</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => void onLogoutAdmin()}
                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white rounded transition-colors"
                  title="Keluar dari sesi"
                  aria-label="Keluar dari sesi"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
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
