import React, { useState, useEffect } from 'react';
import { TabKey, CitizenReport } from '../types/portal';
import { DataService } from '../services/dataService';
import { AuthService, DEMO_CREDENTIALS } from '../services/authService';
import {
  Lock,
  UserCheck,
  Shield,
  KeyRound,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Bell,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  MessageSquare,
  Cloud,
  Terminal,
  Database,
  AlertTriangle,
} from 'lucide-react';

interface AdminViewProps {
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onSelectTab: (tab: TabKey) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  isAdmin,
  onLoginSuccess,
  onLogout,
  onSelectTab,
}) => {
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin sub-tabs: Laporan Warga vs Cloudflare D1 Console vs Pengaturan Data
  const [adminTab, setAdminTab] = useState<'laporan' | 'cloudflare' | 'data'>('laporan');
  const [reports, setReports] = useState<CitizenReport[]>(() => DataService.getReports());
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedWorker, setCopiedWorker] = useState(false);

  // Reactive subscription to DataService
  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setReports(DataService.getReports());
    });
    return unsubscribe;
  }, []);

  const d1SchemaSql = DataService.generateD1SchemaSql();
  const workerCode = DataService.generateCloudflareWorkerExample();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await AuthService.loginDemo({ username, password });
    setIsSubmitting(false);

    if (res.success) {
      onLoginSuccess();
    } else {
      setErrorMsg(res.error || 'Username atau kata sandi tidak cocok.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    setUsername(DEMO_CREDENTIALS.username);
    setPassword(DEMO_CREDENTIALS.password);

    const res = await AuthService.loginDemo(DEMO_CREDENTIALS);
    setIsSubmitting(false);

    if (res.success) {
      onLoginSuccess();
    }
  };

  const handleUpdateReportStatus = (id: string, newStatus: CitizenReport['status']) => {
    DataService.updateReportStatus(id, newStatus);
    setReports(DataService.getReports());
  };

  const handleResetData = () => {
    if (window.confirm('Kembalikan semua data ke dummy bawaan awal Griya Adika Narama?')) {
      DataService.resetAllData();
      alert('Data berhasil di-reset ke versi awal.');
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(d1SchemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleCopyWorker = () => {
    navigator.clipboard.writeText(workerCode);
    setCopiedWorker(true);
    setTimeout(() => setCopiedWorker(false), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-8 sm:py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-900 text-emerald-100 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Login Administrasi Blok H</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Masuk untuk mengelola pengumuman, agenda kegiatan, kas keuangan, dan aspirasi warga.
            </p>
          </div>

          {/* Architectural Notice: Demo Authentication Only */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Akses Demo Pengurus:</span>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Ini adalah simulasi autentikasi percontohan. Pada tahap produksi, sesi ini akan digantikan oleh Cloudflare Access / JWT Session terverifikasi.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username Admin</label>
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors shadow-xs"
            >
              {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Panel Pengurus'}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isSubmitting}
              className="w-full py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
              <span>Gunakan Kredensial Demo (1-Klik Masuk)</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-1.5">
              Demo: username: <code className="font-mono">admin</code> · kata sandi:{' '}
              <code className="font-mono">narama2026</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Mode Administrasi (Simulasi Demo)</span>
            <span aria-hidden="true">·</span>
            <span>Pengurus Paguyuban Blok H</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Panel Pengurus Griya Adika Narama
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/80">
            Kelola konten portal, tindak lanjuti keluhan warga, dan siapkan integrasi Cloudflare D1.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onLogout}
            className="px-3.5 py-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>

      {/* Admin Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectTab('pengumuman')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 text-left space-y-1 shadow-2xs transition-colors"
        >
          <Bell className="w-4 h-4 text-emerald-700" />
          <span className="block text-xs font-bold text-slate-800">Kelola Pengumuman</span>
          <span className="text-[11px] text-slate-500 block">Buat & sematkan berita</span>
        </button>

        <button
          onClick={() => onSelectTab('agenda')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 text-left space-y-1 shadow-2xs transition-colors"
        >
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="block text-xs font-bold text-slate-800">Kelola Agenda</span>
          <span className="text-[11px] text-slate-500 block">Jadwal kerja bakti & rapat</span>
        </button>

        <button
          onClick={() => onSelectTab('keuangan')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 text-left space-y-1 shadow-2xs transition-colors"
        >
          <Wallet className="w-4 h-4 text-emerald-700" />
          <span className="block text-xs font-bold text-slate-800">Buku Kas & IPL</span>
          <span className="text-[11px] text-slate-500 block">Catat masuk & keluar kas</span>
        </button>

        <button
          onClick={() => onSelectTab('proker')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 text-left space-y-1 shadow-2xs transition-colors"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="block text-xs font-bold text-slate-800">Program Kerja</span>
          <span className="text-[11px] text-slate-500 block">Atur progres & anggaran</span>
        </button>
      </div>

      {/* Sub-tabs for Admin Management */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setAdminTab('laporan')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            adminTab === 'laporan'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Aspirasi & Lapor Warga ({reports.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('cloudflare')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            adminTab === 'cloudflare'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Kesiapan Cloudflare D1 & Workers</span>
        </button>

        <button
          onClick={() => setAdminTab('data')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            adminTab === 'data'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Pengaturan Data Mock</span>
        </button>
      </div>

      {/* Tab 1: Aspirasi & Laporan Warga */}
      {adminTab === 'laporan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Daftar Keluhan & Masukan Masuk</h3>
            <span className="text-xs text-slate-500">
              Total {reports.length} laporan dari warga Blok H
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{rep.residentName}</span>
                    <span className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Rumah {rep.houseNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{rep.date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase text-[11px] font-semibold text-slate-700">
                      {rep.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Status:</span>
                    <select
                      value={rep.status}
                      onChange={(e) => handleUpdateReportStatus(rep.id, e.target.value as any)}
                      className="text-xs font-semibold rounded-md border border-slate-300 py-1 px-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="menunggu">Menunggu Tindak Lanjut</option>
                      <option value="diproses">Sedang Diproses Satpam/Seksi</option>
                      <option value="selesai">Selesai Ditangani</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{rep.title}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{rep.description}</p>
                </div>

                {rep.phone && rep.phone !== '-' && (
                  <div className="text-[11px] text-slate-500 pt-1">
                    Kontak Pelapor:{' '}
                    <a
                      href={`https://wa.me/${rep.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-800 font-semibold hover:underline"
                    >
                      {rep.phone} (Hubungi via WA)
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Cloudflare Workers / D1 Readiness Console */}
      {adminTab === 'cloudflare' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
              <Cloud className="w-5 h-5 text-emerald-700" />
              <span>Kesiapan Arsitektur Cloudflare Workers & D1 Database</span>
            </div>
            <p className="leading-relaxed">
              Arsitektur aplikasi ini telah dimodularisasi penuh melalui <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">dataService.ts</code> dan model domain terpusat di <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">src/types/portal.ts</code>. Ketika beralih ke backend serverless Cloudflare Workers dan D1 SQLite Database, skrip DDL SQL di bawah ini dapat langsung di-deploy melalui Cloudflare Wrangler CLI.
            </p>
          </div>

          {/* D1 SQL Schema Preview */}
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
                <Terminal className="w-4 h-4" />
                <span>schema.sql (Cloudflare D1 SQLite DDL)</span>
              </div>
              <button
                onClick={handleCopySchema}
                className="px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'Tersalin' : 'Salin SQL Schema'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono leading-relaxed overflow-x-auto max-h-72 p-2 scrollbar-thin text-slate-300">
              {d1SchemaSql}
            </pre>
          </div>

          {/* Cloudflare Worker Code Template */}
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
                <FileCode className="w-4 h-4" />
                <span>src/worker.ts (Cloudflare Workers API Handler)</span>
              </div>
              <button
                onClick={handleCopyWorker}
                className="px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copiedWorker ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWorker ? 'Tersalin' : 'Salin Worker Code'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono leading-relaxed overflow-x-auto max-h-64 p-2 scrollbar-thin text-slate-300">
              {workerCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Pengaturan Data */}
      {adminTab === 'data' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Manajemen Data Mock Sementara</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Semua manipulasi data di panel pengurus saat ini ditangani secara tersentralisasi melalui <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">dataService.ts</code>. Komponen antarmuka tidak mengakses penyimpanan peramban secara langsung.
          </p>

          <div className="pt-2">
            <button
              onClick={handleResetData}
              className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Kembali ke Data Mock Awal Blok H</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
