/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabKey } from './types/portal';
import { HeaderNav } from './components/HeaderNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { EmergencyModal } from './components/EmergencyModal';
import { LaporWargaModal } from './components/LaporWargaModal';
import { AuthService } from './services/authService';

// Views
import { BerandaView } from './views/BerandaView';
import { PengumumanView } from './views/PengumumanView';
import { AgendaView } from './views/AgendaView';
import { ProgramKerjaView } from './views/ProgramKerjaView';
import { KeuanganView } from './views/KeuanganView';
import { DokumentasiView } from './views/DokumentasiView';
import { AdminView } from './views/AdminView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('beranda');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => AuthService.isDemoAuthenticated());
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Subscribe to centralized auth session changes (no direct storage access in view)
  useEffect(() => {
    const unsubscribe = AuthService.subscribe((session) => {
      setIsAdmin(session.isAuthenticated);
    });
    return unsubscribe;
  }, []);

  // Scroll to top on tab change
  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    AuthService.logoutDemo();
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
        isAdmin={isAdmin}
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
          />
        )}

        {activeTab === 'pengumuman' && <PengumumanView isAdmin={isAdmin} />}

        {activeTab === 'agenda' && <AgendaView isAdmin={isAdmin} />}

        {activeTab === 'proker' && <ProgramKerjaView isAdmin={isAdmin} />}

        {activeTab === 'keuangan' && <KeuanganView isAdmin={isAdmin} />}

        {activeTab === 'dokumentasi' && <DokumentasiView isAdmin={isAdmin} />}

        {activeTab === 'admin' && (
          <AdminView
            isAdmin={isAdmin}
            onLoginSuccess={() => {
              setIsAdmin(true);
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
        isAdmin={isAdmin}
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
    </div>
  );
}
