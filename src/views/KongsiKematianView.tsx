
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ShieldCheck,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  fetchPublicKongsiParticipants,
  PublicKongsiParticipant,
} from '../services/dataService';

const getOccupancyInfo = (status: string) => {
  const normalized = status.toLowerCase().replace(/_/g, '-');

  switch (normalized) {
    case 'huni':
      return {
        label: 'Huni',
        className: 'bg-emerald-50 text-emerald-700',
      };
    case 'semi-huni':
      return {
        label: 'Semi-Huni',
        className: 'bg-blue-50 text-blue-700',
      };
    case 'kosong':
      return {
        label: 'Kosong',
        className: 'bg-slate-100 text-slate-600',
      };
    default:
      return {
        label: status || 'Belum diisi',
        className: 'bg-amber-50 text-amber-700',
      };
  }
};

export const KongsiKematianView: React.FC = () => {
  const [participants, setParticipants] = useState<PublicKongsiParticipant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadParticipants = async () => {
    setLoading(true);
    setError('');

    try {
      setParticipants(await fetchPublicKongsiParticipants());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memuat data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadParticipants();
  }, []);

  const filteredParticipants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return participants;

    return participants.filter(
      (item) =>
        item.houseNumber.toLowerCase().includes(keyword) ||
        item.fullName.toLowerCase().includes(keyword)
    );
  }, [participants, search]);

    const occupancyStats = useMemo(() => {
    const stats = {
      total: participants.length,
      huni: 0,
      semiHuni: 0,
      kosong: 0,
    };

    participants.forEach((participant) => {
      const status = (participant.residenceStatus || '')
        .trim()
        .toLowerCase()
        .replace(/_/g, '-');

      if (status === 'huni') {
        stats.huni++;
      } else if (status === 'semi-huni') {
        stats.semiHuni++;
      } else if (status === 'kosong') {
        stats.kosong++;
      }
    });

    return stats;
  }, [participants]);

  return (
    <section className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-8 sm:px-9 sm:py-10 text-white shadow-lg">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/5" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-50">
            <ShieldCheck className="h-4 w-4" />
            INFORMASI PUBLIK BLOK H
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Kepesertaan Kongsi Kematian
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/85 sm:text-base">
            Daftar warga yang telah terdaftar sebagai peserta Kongsi
            Kematian Paguyuban Warga Griya Adika Narama Blok H.
          </p>
        </div>
      </div>

      
      {/* Summary Statistics */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          {/* Total Peserta */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Total Peserta
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
              {loading || error ? '—' : occupancyStats.total}
            </p>
            <p className="text-xs text-slate-400">Rumah terdaftar</p>
          </div>

          {/* Huni */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Huni
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {loading || error ? '—' : occupancyStats.huni}
            </p>
            <p className="text-xs text-slate-400">Rumah terdaftar</p>
          </div>

          {/* Semi-Huni */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Semi-Huni
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {loading || error ? '—' : occupancyStats.semiHuni}
            </p>
            <p className="text-xs text-slate-400">Rumah terdaftar</p>
          </div>

          {/* Kosong */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Kosong
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {loading || error ? '—' : occupancyStats.kosong}
            </p>
            <p className="text-xs text-slate-400">Rumah terdaftar</p>
          </div>

        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void loadParticipants()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Perbarui Data
          </button>
        </div>
      </div>

      {/* Participant List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Daftar Peserta
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Informasi nomor rumah, nama warga, status tinggal, dan kepesertaan.
            </p>
          </div>

          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor rumah atau nama warga..."
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              aria-label="Cari nomor rumah atau nama warga"
            />
          </label>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Memuat daftar peserta...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />

            <p className="max-w-lg text-sm text-slate-600">
              {error}
            </p>

            <button
              onClick={() => void loadParticipants()}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-700">
              {participants.length === 0
                ? 'Belum ada peserta yang dapat ditampilkan.'
                : 'Data tidak ditemukan.'}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {participants.length === 0
                ? 'Data akan muncul setelah status kepesertaan diverifikasi dan ditetapkan terdaftar oleh pengurus.'
                : 'Coba gunakan kata kunci pencarian yang berbeda.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[650px]">

                {/* Table Header */}
                <div className="grid grid-cols-[0.8fr_1.5fr_1fr_auto] gap-3 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Nomor Rumah</span>
                  <span>Nama Warga</span>
                  <span>Status Tinggal</span>
                  <span>Status Kongsi</span>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-100">
                  {filteredParticipants.map((participant) => {
                    const occupancy = getOccupancyInfo(
                      participant.residenceStatus
                    );

                    return (
                      <div
                        key={participant.houseNumber}
                        className="grid grid-cols-[0.8fr_1.5fr_1fr_auto] items-center gap-3 px-5 py-4 transition hover:bg-emerald-50/40"
                      >
                        <span className="font-semibold text-slate-800">
                          {participant.houseNumber}
                        </span>

                        <span className="text-sm font-medium text-slate-700">
                          {participant.fullName}
                        </span>

                        <span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${occupancy.className}`}
                          >
                            {occupancy.label}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Terdaftar
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              Menampilkan {filteredParticipants.length} dari {participants.length} rumah terdaftar.
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs leading-relaxed text-slate-500">
        Informasi ini bersumber dari data administrasi Paguyuban Blok H.
      </p>

    </section>
  );
};
