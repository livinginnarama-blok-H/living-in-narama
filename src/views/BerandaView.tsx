import React, { useState, useEffect } from 'react';
import { TabKey, Announcement, EventAgenda, RondaSchedule, Household, FinancialTransaction } from '../types/portal';
import { DataService } from '../services/dataService';
import heroImage from '@/src/assets/images/hero_mountain_housing_1790351060957.jpg';
import {
  Trees,
  Shield,
  Wallet,
  Calendar,
  Bell,
  ArrowRight,
  MessageSquare,
  Users,
  Compass,
  CheckCircle,
  ExternalLink,
  PhoneCall,
  Clock,
  Sparkles,
  Mail,
} from 'lucide-react';

interface BerandaViewProps {
  onSelectTab: (tab: TabKey) => void;
  onOpenEmergency: () => void;
  onOpenReport: () => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({
  onSelectTab,
  onOpenEmergency,
  onOpenReport,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => DataService.getAnnouncements());
  const [agendas, setAgendas] = useState<EventAgenda[]>(() => DataService.getAgendas());
  const [metrics, setMetrics] = useState(() => DataService.getFinancialMetrics());
  const [rondaSchedules, setRondaSchedules] = useState<RondaSchedule[]>([]);
  const [households, setHouseholds] = useState<Household[]>(() => DataService.getHouseholds());
  const [lastFinanceUpdate, setLastFinanceUpdate] = useState<string | null>(null);

  // Centralized DataService Subscription
  useEffect(() => {
  let cancelled = false;

  const loadData = async () => {
    try {
      const fetchedAnnouncements = await DataService.fetchAnnouncements();

      if (!cancelled) {
        setAnnouncements(fetchedAnnouncements);
      }
    } catch (error) {
      console.error('[BerandaView] Gagal memuat pengumuman:', error);
    }

    try {
      const fetchedAgendas = await DataService.fetchAgendas();

      if (!cancelled) {
        setAgendas(fetchedAgendas);
      }
    } catch (error) {
      console.error('[BerandaView] Gagal memuat agenda:', error);
    }
    try {
      const fetchedRondaSchedules = await DataService.fetchRondaSchedules();

      if (!cancelled) {
        setRondaSchedules(fetchedRondaSchedules);
      }
    } catch (error) {
      console.error('[BerandaView] Gagal memuat jadwal ronda:', error);
    }
    // Load transaksi keuangan terbaru dari Supabase
    try {
      await DataService.fetchTransactions(true);

if (!cancelled) {
  setMetrics(DataService.getFinancialMetrics());

  const transactions = DataService.getTransactions(true);

  const latestTransaction = transactions
    .filter((transaction) => transaction.type === 'in' || transaction.type === 'out')
    .reduce<FinancialTransaction | null>((latest, transaction) => {
      const transactionTime = new Date(
        transaction.updatedAt || transaction.createdAt || transaction.date
      ).getTime();

      if (!latest) return transaction;

      const latestTime = new Date(
        latest.updatedAt || latest.createdAt || latest.date
      ).getTime();

      return transactionTime > latestTime ? transaction : latest;
    }, null);

  setLastFinanceUpdate(
    latestTransaction?.updatedAt ||
    latestTransaction?.createdAt ||
    null
  );
}
    } catch (error) {
      console.error('[BerandaView] Gagal memuat transaksi keuangan:', error);
    }
        // Load data rumah warga terbaru dari Supabase
    try {
      const fetchedHouseholds = await DataService.fetchHouseholds();

      if (!cancelled) {
        setHouseholds(fetchedHouseholds);
      }
    } catch (error) {
      console.error('[BerandaView] Gagal memuat data rumah warga:', error);
    }
  };

  loadData();

  const unsubscribe = DataService.subscribe(() => {
    if (cancelled) return;

    setAnnouncements(DataService.getAnnouncements());
    setAgendas(DataService.getAgendas());
    setMetrics(DataService.getFinancialMetrics());
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}, []);
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

// Find today's ronda team
const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const todayName = dayNames[new Date().getDay()];
const todayRonda =
  rondaSchedules.find(
    (r) => r.day.toLowerCase() === todayName.toLowerCase()
  ) || null;

const pinnedAnnouncement = announcements.find((a) => a.isPinned) || announcements[0];

const today = new Date();
today.setHours(0, 0, 0, 0);

const upcomingAgendas = agendas
  .filter((a) => {
    const agendaDate = new Date(a.date);
    agendaDate.setHours(0, 0, 0, 0);

    return agendaDate >= today;
  })
  .sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  .slice(0, 2);

  // Selected announcement for quick modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-emerald-900/15 shadow-sm bg-emerald-950 text-white">
        {/* Background Image with mountain contrast scrim */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Pemandangan Kompleks Griya Adika Narama Blok H"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-45 mix-blend-luminosity scale-102 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/85 to-emerald-900/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-16 max-w-4xl space-y-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-300">
            <Trees className="w-4 h-4 text-emerald-400" />
            <span>Kawasan Hunian Asri Pegunungan</span>
            <span aria-hidden="true">·</span>
            <span>Blok H</span>
            <span className="text-[10px] bg-emerald-800 text-emerald-200 font-semibold px-2 py-0.5 rounded">
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight sm:leading-tight">
            Portal Warga <br className="hidden sm:inline" />
            Griya Adika Narama · Blok H
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl text-pretty">
            Pusat komunikasi resmi, koordinasi kegiatan, dan transparansi administrasi warga Blok H.
            Mari rawat kenyamanan, ketertiban, dan kebersamaan di lingkungan pegunungan yang sejuk.
          </p>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectTab('pengumuman')}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Bell className="w-4 h-4 text-emerald-800" />
              <span>Pengumuman Warga</span>
            </button>

            <button
              onClick={onOpenReport}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-600/40 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>Lapor / Saran Warga</span>
            </button>

            <button
              onClick={onOpenEmergency}
              className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800/50 transition-colors flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-rose-300" />
              <span>Kontak Darurat</span>
            </button>
          </div>
        </div>

{/* Mountain Highlight Bar */}
<div className="relative z-10 bg-emerald-900/80 backdrop-blur-md border-t border-emerald-800/60 px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
  <div>
    <span className="block text-emerald-300 text-[11px] font-medium">Unit Hunian Warga</span>
    <span className="text-sm sm:text-base font-bold text-white">
      {activeHouseholds.length > 0
        ? `${activeHouseholds.length} Unit Terdata`
        : '[Menunggu Data Resmi]'}
    </span>
    {activeHouseholds.length > 0 && (
      <span className="block mt-1 text-[10px] sm:text-[11px] text-emerald-100/90 font-medium">
        {huniCount} Huni · {semiHuniCount} Semi Huni · {kosongCount} Kosong
      </span>
    )}
  </div>

  <div>
  <span className="block text-emerald-300 text-[11px] font-medium">Saldo Kas</span>
  <span className="text-sm sm:text-base font-bold text-white tabular-nums">
    {formatCurrency(metrics.currentBalance)}
  </span>

  {lastFinanceUpdate && (
    <span className="block mt-1 text-[10px] sm:text-[11px] text-emerald-100/90 font-medium">
      Diperbarui: {new Date(lastFinanceUpdate).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })} WIB
    </span>
  )}
</div>
</div>
      </section>

      {/* Pinned Announcement Highlight */}
      {pinnedAnnouncement && (
        <section className="bg-white rounded-2xl border border-emerald-900/10 p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-700" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <span className="uppercase tracking-wider">Pengumuman Penting</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 font-normal">{pinnedAnnouncement.date}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 font-normal">{pinnedAnnouncement.author}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {pinnedAnnouncement.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {pinnedAnnouncement.content}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => setSelectedAnnouncement(pinnedAnnouncement)}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Baca Selengkapnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3-Column Bento Grid: Agenda Terdekat, Transparansi Kas, Jadwal Ronda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Agenda Terdekat */}
        <div className="bg-white rounded-2xl border border-emerald-900/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Agenda Kegiatan Terdekat</h3>
              </div>
              <button
                onClick={() => onSelectTab('agenda')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-0.5"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingAgendas.length > 0 ? (
              <div className="space-y-3">
                {upcomingAgendas.map((agenda) => (
                  <div
                    key={agenda.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                      <span>{agenda.date}</span>
                      <span>{agenda.time}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                      {agenda.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{agenda.location}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada agenda terdekat.</p>
            )}
          </div>

          <button
            onClick={() => onSelectTab('agenda')}
            className="w-full py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center"
          >
            Buka Kalender Kegiatan Warga
          </button>
        </div>

        {/* Card 2: Transparansi Keuangan */}
        <div className="bg-white rounded-2xl border border-emerald-900/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Transparansi Kas Blok H</h3>
              </div>
              <button
                onClick={() => onSelectTab('keuangan')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-0.5"
              >
                <span>Rincian</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <span className="text-[11px] text-emerald-800 font-medium">Saldo Kas Aktif</span>
              <p className="text-xl font-extrabold text-emerald-950 tabular-nums">
                {formatCurrency(metrics.currentBalance)}
              </p>
              <p className="text-[11px] text-emerald-700">
                Pembaruan buku kas per {metrics.asOfDate}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Pemasukan Bulan Ini</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(metrics.currentMonthIn)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Pengeluaran Bulan Ini</span>
                <span className="font-bold text-rose-700 tabular-nums">
                  {formatCurrency(metrics.currentMonthOut)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('keuangan')}
            className="w-full py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center"
          >
            Lihat Laporan Buku Kas Lengkap
          </button>
        </div>

        {/* Card 3: Jadwal Ronda Malam Hari Ini */}
        <div className="bg-white rounded-2xl border border-emerald-900/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Jadwal Siskamling Ronda
                </h3>
              </div>

              {todayRonda && (
                <span className="text-xs font-semibold text-emerald-700">
                  Hari {todayRonda.day}
                </span>
              )}
            </div>

            {todayRonda ? (
              <>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {todayRonda.team}
                    </span>

                    <span className="text-[10px] text-emerald-800 font-medium px-2 py-0.5 bg-emerald-100 rounded-md">
                      Pukul 22.00 - 04.00
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Koordinator:{' '}
                    <span className="font-medium text-slate-900">
                      {todayRonda.coordinator}
                    </span>
                  </p>

                  <div className="pt-1">
                    <span className="text-[11px] text-slate-500 block mb-1">
                      Anggota Warga Rumah:
                    </span>

                    <div className="flex flex-wrap gap-1">
                      {todayRonda.houses.map((house) => (
                        <span
                          key={house}
                          className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-white border border-slate-200 text-slate-700 rounded"
                        >
                          {house}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  Titik kumpul: Pos Portal Utama Blok H bersama petugas satpam
                  jaga.
                </p>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <Shield className="w-7 h-7 text-emerald-700 mx-auto mb-2" />

                <p className="text-xs font-bold text-slate-900">
                  Jadwal Siskamling Belum Tersedia
                </p>

                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Jadwal ronda akan diperbarui oleh pengurus setelah hasil
                  koordinasi dan kesepakatan warga Blok H.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectTab('agenda')}
            className="w-full py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center"
          >
            Lihat Jadwal Lengkap 7 Hari
          </button>
        </div>
      </div>

      {/* Profil Singkat Lingkungan Blok H */}
      <section className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <Compass className="w-4 h-4" />
            <span>Mengenal Lingkungan Kita</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Hunian Harmonis di Gunung Sindur Griya Adika Narama
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Portal resmi ini dipersiapkan sebagai media koordinasi, informasi, dan transparansi warga Blok H.
            Mewujudkan lingkungan perumahan yang asri, aman, tertib, dan guyub rukun.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-emerald-900/50 border border-emerald-800/80 rounded-xl p-3.5 space-y-1">
            <h4 className="text-xs font-bold text-white">Keamanan & Ketertiban</h4>
            <p className="text-[11px] text-emerald-200/80">
              Koordinasi pos keamanan terpadu dan keterbukaan informasi lingkungan.
            </p>
          </div>
          <div className="bg-emerald-900/50 border border-emerald-800/80 rounded-xl p-3.5 space-y-1">
            <h4 className="text-xs font-bold text-white">Kebersihan & Lingkungan Asri</h4>
            <p className="text-[11px] text-emerald-200/80">
              Pemeliharaan berkala fasilitas umum dan pelestarian area hijau bersama.
            </p>
          </div>
          <div className="bg-emerald-900/50 border border-emerald-800/80 rounded-xl p-3.5 space-y-1">
            <h4 className="text-xs font-bold text-white">Transparansi & Kebersamaan</h4>
            <p className="text-[11px] text-emerald-200/80">
              Akses terbuka pelaporan kas warga dan sarana penyampaian aspirasi online.
            </p>
          </div>
        </div>
      </section>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setSelectedAnnouncement(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <span className="uppercase">{selectedAnnouncement.category}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedAnnouncement.date}</span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{selectedAnnouncement.title}</h3>
            <p className="text-xs text-slate-500 font-medium">
              Diterbitkan oleh: {selectedAnnouncement.author}
            </p>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
              {selectedAnnouncement.content}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
