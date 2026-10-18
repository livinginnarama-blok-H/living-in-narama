/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AdminRole, TabKey } from './types/portal';
import { HeaderNav } from './components/HeaderNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { EmergencyModal } from './components/EmergencyModal';
import { LaporWargaModal } from './components/LaporWargaModal';
import { CekLaporanModal } from './components/CekLaporanModal';
import { AuthService } from './services/authService';

// Views
import { BerandaView } from './views/BerandaView';
import { PengumumanView } from './views/PengumumanView';
import { AgendaView } from './views/AgendaView';
import KomunitasView from './views/KomunitasView';
import { KeuanganView } from './views/KeuanganView';
import { DokumentasiView } from './views/DokumentasiView';
import PengurusView from './views/PengurusView';
import { AdminView } from './views/AdminView';

export default function App() {
  const getTabFromPath = (): TabKey => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  switch (path) {
    case '/pengumuman':
      return 'pengumuman';
    case '/agenda':
      return 'agenda';
    case '/komunitas':
      return 'komunitas';
    case '/keuangan':
      return 'keuangan';
    case '/dokumentasi':
      return 'dokumentasi';
    case '/admin':
      return 'admin';
    case '/pengurus':
      return 'pengurus';
    default:
      return 'beranda';
  }
};
useEffect(() => {
  const handlePopState = () => {
    setActiveTab(getTabFromPath());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.addEventListener('popstate', handlePopState);

  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
}, []);
const [activeTab, setActiveTab] = useState<TabKey>(getTabFromPath());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [adminName, setAdminName] = useState('Admin Blok H');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCheckReportOpen, setIsCheckReportOpen] = useState(false);

  
  // Hak akses berdasarkan status login dan role
const canManage =
  isAuthenticated &&
  (userRole === 'super_admin' ||
    userRole === 'admin' ||
    userRole === 'editor');

// Bendahara boleh mengelola Keuangan, tetapi bukan modul lain.
const canManageFinance =
  canManage ||
  (isAuthenticated && userRole === 'bendahara');

// Bendahara tidak boleh membuka administrasi.
const canAccessAdmin =
  isAuthenticated && userRole !== 'bendahara';

  // Subscribe to centralized auth session changes
  useEffect(() => {
    AuthService.initialize();

    const unsubscribe = AuthService.subscribe((session) => {
  setIsAuthenticated(session.isAuthenticated);
  setUserRole(
    session.isAuthenticated ? session.user?.role ?? null : null
  );

  const name = session.isAuthenticated
    ? session.user?.name || session.user?.username
    : null;

  const emailPrefix = name?.includes('@')
    ? name.split('@')[0]
    : name;

  const formattedName = emailPrefix
    ? emailPrefix
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Admin Blok H';

  setAdminName(formattedName);
});

    const cleanupAuthListener = AuthService.setupAuthListener();

    return () => {
      unsubscribe();
      cleanupAuthListener();
    };
  }, []);

  // Scroll to top on tab change
  const handleSelectTab = (tab: TabKey) => {
  setActiveTab(tab);

  const pathMap: Record<TabKey, string> = {
    beranda: '/',
    pengumuman: '/pengumuman',
    agenda: '/agenda',
    komunitas: '/komunitas',
    keuangan: '/keuangan',
    dokumentasi: '/dokumentasi',
    pengurus: '/pengurus',
    admin: '/admin',
  };

  const newPath = pathMap[tab];

  if (window.location.pathname !== newPath) {
    window.history.pushState({}, '', newPath);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  const handleLogout = async () => {
  await AuthService.logout();
  window.history.pushState({}, '', '/');
setActiveTab('beranda');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f9f6] text-slate-800 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Mountain Mist Ambient Background Glow */}
      <div
        className="fixed top-0 left-0 right-0 h-96 pointer-events-none bg-gradient-to-b from-emerald-100/40 via-emerald-50/20 to-transparent -z-10"
        aria-hidden="true"
      />

      {/* Top Header Navigation */}
      <HeaderNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isAdmin={canAccessAdmin}
        adminName={adminName}
        onLogoutAdmin={handleLogout}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 md:pb-12">
        {activeTab === 'beranda' && (
          <BerandaView
            onSelectTab={handleSelectTab}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onOpenReport={() => setIsReportOpen(true)}
            onOpenCheckReport={() => setIsCheckReportOpen(true)}
          />
        )}

        
        {activeTab === 'pengumuman' && <PengumumanView isAdmin={canManage} />}

        {activeTab === 'agenda' && <AgendaView isAdmin={canManage} />}

        {activeTab === 'komunitas' && <KomunitasView isAdmin={canManage} />}

        {activeTab === 'keuangan' && (
          <KeuanganView isAdmin={canManageFinance} />
        )}

        {activeTab === 'dokumentasi' && <DokumentasiView isAdmin={canManage} />}

        {activeTab === 'pengurus' && <PengurusView />}

        {activeTab === 'admin' && canAccessAdmin && (
        <AdminView
          isAdmin={canAccessAdmin}
          canManage={canManage}
            onLoginSuccess={() => {
              setIsAuthenticated(true);
            }}
            onLogout={handleLogout}
            onSelectTab={handleSelectTab}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Mobile Bottom Navigation (Ergonomic thumb reach bar) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isAdmin={canAccessAdmin}
      />

      {/* Emergency Contacts Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Citizen Report / Suggestion Modal */}
      <LaporWargaModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
      <CekLaporanModal
        isOpen={isCheckReportOpen}
        onClose={() => setIsCheckReportOpen(false)}
      />
    </div>
  );
}
