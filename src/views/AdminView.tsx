import React, { useState, useEffect } from 'react';
import {
  TabKey,
  CitizenReport,
  Household,
  OccupancyStatus,
} from '../types/portal';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import {
  Lock,
  UserCheck,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Bell,
  Calendar,
  Wallet,
  CheckCircle2,
  MessageSquare,
  Cloud,
  Terminal,
  Database,
  AlertTriangle,
  Users,
  Plus,
  Search,
  Pencil,
  UserX,
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin sub-tabs: Laporan Warga vs Cloudflare D1 Console vs Pengaturan Data
  const [adminTab, setAdminTab] = useState<
  'laporan' | 'warga' | 'cloudflare' | 'data'
  >('laporan'); 
  const [reports, setReports] = useState<CitizenReport[]>(() => DataService.getReports());
  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdSearch, setHouseholdSearch] = useState('');
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [isSavingHousehold, setIsSavingHousehold] = useState(false);
  const [householdError, setHouseholdError] = useState('');

  const [houseNumber, setHouseNumber] = useState('');
  const [residentName, setResidentName] = useState('');
  const [occupancyStatus, setOccupancyStatus] =
    useState<OccupancyStatus>('huni');
  const [phone, setPhone] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [householdNotes, setHouseholdNotes] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedWorker, setCopiedWorker] = useState(false);

  // Reactive subscription to DataService
  useEffect(() => {
    let cancelled = false;

    const loadReports = async () => {
      try {
        const data = await DataService.fetchReports();

        if (!cancelled) {
          setReports(data);
        }
      } catch (err) {
        console.error('[AdminView] Gagal memuat laporan warga:', err);
      }
    };

    const loadHouseholds = async () => {
      try {
        const data = await DataService.fetchHouseholds();

        if (!cancelled) {
          setHouseholds(data);
        }
      } catch (err) {
        console.error('[AdminView] Gagal memuat data warga:', err);
      }
    };

    void loadReports();
    void loadHouseholds();

    const unsubscribe = DataService.subscribe(() => {
      void loadReports();
      void loadHouseholds();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const d1SchemaSql = DataService.generateD1SchemaSql();
  const workerCode = DataService.generateCloudflareWorkerExample();

  const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsSubmitting(true);
  setErrorMsg('');

  const res = await AuthService.login(email, password);

  setIsSubmitting(false);

  if (res.success) {
    onLoginSuccess();
  } else {
    setErrorMsg(res.error || 'Email atau kata sandi tidak cocok.');
  }
};

  const handleUpdateReportStatus = async (
  id: string,
  newStatus: CitizenReport['status']
) => {
  try {
    await DataService.updateReportStatus(id, newStatus);

    const data = await DataService.fetchReports();
    setReports(data);
  } catch (err) {
    console.error('[AdminView] Gagal memperbarui status laporan:', err);
  }
};
  const resetHouseholdForm = () => {
  setHouseNumber('');
  setResidentName('');
  setOccupancyStatus('huni');
  setPhone('');
  setFamilyMembers('');
  setHouseholdNotes('');
  setHouseholdError('');
  setEditingHousehold(null);
};

const openAddHousehold = () => {
  resetHouseholdForm();
  setIsHouseholdModalOpen(true);
};

const openEditHousehold = (household: Household) => {
  setEditingHousehold(household);
  setHouseNumber(household.houseNumber);
  setResidentName(household.residentName);
  setOccupancyStatus(household.occupancyStatus);
  setPhone(household.phone || '');
  setFamilyMembers(
    household.familyMembers !== undefined
      ? String(household.familyMembers)
      : ''
  );
  setHouseholdNotes(household.notes || '');
  setHouseholdError('');
  setIsHouseholdModalOpen(true);
};

const handleSaveHousehold = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!houseNumber.trim()) {
    setHouseholdError('Nomor rumah wajib diisi.');
    return;
  }

  if (!residentName.trim()) {
    setHouseholdError('Nama warga/kepala keluarga wajib diisi.');
    return;
  }

  setIsSavingHousehold(true);
  setHouseholdError('');

  try {
    if (editingHousehold) {
      await DataService.updateHousehold({
        ...editingHousehold,
        houseNumber: houseNumber.trim(),
        residentName: residentName.trim(),
        occupancyStatus,
        phone: phone.trim() || undefined,
        familyMembers: familyMembers
          ? Number(familyMembers)
          : undefined,
        notes: householdNotes.trim() || undefined,
      });
    } else {
      await DataService.addHousehold({
        houseNumber: houseNumber.trim(),
        residentName: residentName.trim(),
        occupancyStatus,
        isActive: true,
        phone: phone.trim() || undefined,
        familyMembers: familyMembers
          ? Number(familyMembers)
          : undefined,
        notes: householdNotes.trim() || undefined,
      });
    }

    setHouseholds(await DataService.fetchHouseholds());
    setIsHouseholdModalOpen(false);
    resetHouseholdForm();
  } catch (err) {
    setHouseholdError(
      err instanceof Error
        ? err.message
        : 'Gagal menyimpan data warga.'
    );
  } finally {
    setIsSavingHousehold(false);
  }
};

const handleDeactivateHousehold = async (household: Household) => {
  const confirmed = window.confirm(
    `Nonaktifkan data ${household.houseNumber} - ${household.residentName}?\n\n` +
      `Data tidak akan dihapus agar histori transaksi tetap tersimpan.`
  );

  if (!confirmed) return;

  try {
    await DataService.deactivateHousehold(household.id);
    setHouseholds(await DataService.fetchHouseholds());
  } catch (err) {
    alert(
      err instanceof Error
        ? err.message
        : 'Gagal menonaktifkan data warga.'
    );
  }
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
  const filteredHouseholds = households
  .filter((h) => {
    const keyword = householdSearch.trim().toLowerCase();

    if (!keyword) return true;

    return (
      h.houseNumber.toLowerCase().includes(keyword) ||
      h.residentName.toLowerCase().includes(keyword) ||
      (h.phone || '').toLowerCase().includes(keyword)
    );
  })
  .sort((a, b) =>
    a.houseNumber.localeCompare(b.houseNumber, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );

const activeHouseholds = households.filter((h) => h.isActive);
const huniCount = activeHouseholds.filter(
  (h) => h.occupancyStatus === 'huni'
).length;
const semiHuniCount = activeHouseholds.filter(
  (h) => h.occupancyStatus === 'semi-huni'
).length;
const kosongCount = activeHouseholds.filter(
  (h) => h.occupancyStatus === 'kosong'
).length;

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

          {/* Supabase Authentication Notice  */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Akses Pengurus:</span>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Gunakan akun pengurus yang telah terdaftar pada sistem untuk mengakses panel administrasi Blok H.
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Admin
              </label>

              <input
                type="email"
                required
                placeholder="email pengurus"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"/>      
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
            <span>Mode Administrasi</span>
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
      <button
        onClick={() => setAdminTab('warga')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
          adminTab === 'warga'
            ? 'bg-emerald-800 text-white'
            : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        <span>Data Warga ({activeHouseholds.length})</span>
      </button>

      {/* Tab Data Warga */}
{adminTab === 'warga' && (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Master Data Warga
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Data ini menjadi referensi unit rumah untuk Keuangan dan IPL.
        </p>
      </div>

      <button
        onClick={openAddHousehold}
        className="px-3 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Tambah Data Warga
      </button>
    </div>

    {/* Statistik */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] text-slate-500">
      Total Rumah
    </div>
    <div className="text-xl font-bold text-slate-900 mt-1">
      {households.length}
    </div>
  </div>

  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] text-slate-500">
      Huni
    </div>
    <div className="text-xl font-bold text-emerald-700 mt-1">
      {huniCount}
    </div>
  </div>

  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] text-slate-500">
      Semi Huni
    </div>
    <div className="text-xl font-bold text-slate-900 mt-1">
      {semiHuniCount}
    </div>
  </div>

  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] text-slate-500">
      Kosong
    </div>
    <div className="text-xl font-bold text-slate-500 mt-1">
      {kosongCount}
    </div>
  </div>
</div>

    {/* Search */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

      <input
        type="text"
        value={householdSearch}
        onChange={(e) => setHouseholdSearch(e.target.value)}
        placeholder="Cari nomor rumah, nama warga, atau nomor HP..."
        className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
      />
    </div>

    {/* Table */}
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                No. Rumah
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Nama Warga
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Status Tinggal
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Anggota
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Status
              </th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredHouseholds.map((household) => (
              <tr
                key={household.id}
                className={!household.isActive ? 'bg-slate-50/70' : ''}
              >
                <td className="px-4 py-3 font-mono font-semibold text-emerald-800">
                  {household.houseNumber}
                </td>

                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">
                    {household.residentName}
                  </div>

                  {household.phone && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {household.phone}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {household.occupancyStatus === 'huni'
                  ? 'Huni'
                  : household.occupancyStatus === 'semi-huni'
                  ? 'Semi Huni'
                  : 'Kosong'}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {household.familyMembers ?? '-'}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 rounded-md text-[10px] font-semibold ${
                      household.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {household.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditHousehold(household)}
                      title="Edit data"
                      className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {household.isActive && (
                      <button
                        onClick={() =>
                          handleDeactivateHousehold(household)
                        }
                        title="Nonaktifkan data"
                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-rose-700 hover:border-rose-300"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredHouseholds.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-xs text-slate-400"
                >
                  Belum ada data warga yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
      {isHouseholdModalOpen && (
  <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {editingHousehold
              ? 'Edit Data Warga'
              : 'Tambah Data Warga'}
          </h3>

          <p className="text-[11px] text-slate-500 mt-0.5">
            Data warga menjadi master referensi unit rumah.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsHouseholdModalOpen(false);
            resetHouseholdForm();
          }}
          className="text-slate-400 hover:text-slate-700 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={handleSaveHousehold}
        className="p-5 space-y-4"
      >
        {householdError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs">
            {householdError}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nomor Rumah *
          </label>

          <input
            value={houseNumber}
            onChange={(e) =>
              setHouseNumber(e.target.value.toUpperCase())
            }
            placeholder="Contoh: HA-01"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nama Warga / Kepala Keluarga *
          </label>

          <input
            value={residentName}
            onChange={(e) => setResidentName(e.target.value)}
            placeholder="Nama lengkap"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Status Tinggal *
          </label>

          <select
            value={occupancyStatus}
            onChange={(e) =>
              setOccupancyStatus(
                e.target.value as OccupancyStatus
              )
            }
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="huni">Huni</option>
            <option value="semi-huni">Semi Huni</option>
            <option value="kosong">Kosong</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor HP
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Anggota Keluarga
            </label>

            <input
              type="number"
              min="1"
              value={familyMembers}
              onChange={(e) => setFamilyMembers(e.target.value)}
              placeholder="Contoh: 4"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan
          </label>

          <textarea
            value={householdNotes}
            onChange={(e) => setHouseholdNotes(e.target.value)}
            rows={3}
            placeholder="Catatan internal pengurus..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setIsHouseholdModalOpen(false);
              resetHouseholdForm();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSavingHousehold}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
          >
            {isSavingHousehold
              ? 'Menyimpan...'
              : editingHousehold
              ? 'Simpan Perubahan'
              : 'Simpan Data Warga'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};
