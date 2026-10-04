import React, { useState } from 'react';
import { TabKey } from '../types/portal';
import { Home, Bell, Calendar, Wallet, MoreHorizontal, Briefcase, Camera, Lock, X, Users } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isAdmin: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleSelect = (tab: TabKey) => {
    onSelectTab(tab);
    setShowMoreMenu(false);
  };

  const isMoreActive =
  activeTab === 'proker' ||
  activeTab === 'dokumentasi' ||
  activeTab === 'pengurus' ||
  activeTab === 'admin';

  return (
    <>
      {/* More Options Drawer Sheet */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreMenu(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl p-5 shadow-2xl border-t border-emerald-900/10 space-y-4">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">Menu Tambahan Portal</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-2">
              <button
                onClick={() => handleSelect('proker')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-colors min-h-[72px] ${
                  activeTab === 'proker'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <Briefcase className="w-5 h-5 mb-1.5 text-emerald-700" />
                <span className="text-xs font-medium">Program Kerja</span>
              </button>

              <button
                onClick={() => handleSelect('dokumentasi')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-colors min-h-[72px] ${
                  activeTab === 'dokumentasi'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <Camera className="w-5 h-5 mb-1.5 text-emerald-700" />
                <span className="text-xs font-medium">Dokumentasi</span>
              </button>
              <button           
                onClick={() => handleSelect('pengurus')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-colors min-h-[72px] ${
                  activeTab === 'pengurus'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <Users className="w-5 h-5 mb-1.5 text-emerald-700" />
                <span className="text-xs font-medium">Pengurus</span>
              </button>
              <button
                onClick={() => handleSelect('admin')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-colors min-h-[72px] ${
                  activeTab === 'admin'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <Lock className="w-5 h-5 mb-1.5 text-emerald-700" />
                <span className="text-xs font-medium">{isAdmin ? 'Kelola Admin' : 'Login Admin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Tab Bar */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          <button
            onClick={() => handleSelect('beranda')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'beranda' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className={`text-[11px] mt-1 ${activeTab === 'beranda' ? 'font-bold' : 'font-medium'}`}>
              Beranda
            </span>
          </button>

          <button
            onClick={() => handleSelect('pengumuman')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'pengumuman' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className={`text-[11px] mt-1 ${activeTab === 'pengumuman' ? 'font-bold' : 'font-medium'}`}>
              Pengumuman
            </span>
          </button>

          <button
            onClick={() => handleSelect('agenda')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'agenda' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className={`text-[11px] mt-1 ${activeTab === 'agenda' ? 'font-bold' : 'font-medium'}`}>
              Agenda
            </span>
          </button>

          <button
            onClick={() => handleSelect('keuangan')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'keuangan' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className={`text-[11px] mt-1 ${activeTab === 'keuangan' ? 'font-bold' : 'font-medium'}`}>
              Keuangan
            </span>
          </button>

          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              isMoreActive ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className={`text-[11px] mt-1 ${isMoreActive ? 'font-bold' : 'font-medium'}`}>
              Menu
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
