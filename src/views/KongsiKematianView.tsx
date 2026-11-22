
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ShieldCheck,
  Users,
  RefreshCw,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  fetchPublicKongsiParticipants,
  PublicKongsiParticipant,
} from '../services/dataService';

const getOccupancyInfo = (status: string) => {
  const normalized = status.toLowerCase().replace(/_/g, '-');

  switch (normalized) {
    case 'huni':
      return { label: 'Huni', className: 'bg-emerald-50 text-emerald-700' };
    case 'semi-huni':
      return { label: 'Semi-Huni', className: 'bg-blue-50 text-blue-700' };
    case 'kosong':
      return { label: 'Kosong', className: 'bg-slate-100 text-slate-600' };
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
        item.fullName.toLowerCase().includes(keyword) ||
        item.participants.some((kk) =>
          kk.fullName.toLowerCase().includes(keyword)
        )
    );
  }, [participants, search]);

  const occupancyStats = useMemo(() => {
    const stats = { total: participants.length, huni: 0, semiHuni: 0, kosong: 0 };

    participants.forEach((item) => {
      const status = (item.residenceStatus || '')
        .trim()
        .toLowerCase()
        .replace(/_/g, '-');

      if (status === 'huni') stats.huni++;
      else if (status === 'semi-huni') stats.semiHuni++;
      else if (status === 'kosong') stats.kosong++;
    });

    return stats;
  }, [participants]);

  const totalKK = participants.reduce(
    (total, item) => total + item.participantCount,
    0
  );

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-8 sm:px-9 sm:py-10 text-white shadow-lg">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-50">
            <ShieldCheck className="h-4 w-4" />
            INFORMASI TERBATAS INTERNAL BLOK H
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Kepesertaan Kongsi Kematian
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/85 sm:text-base">
            Daftar rumah dan Kartu Keluarga yang telah terdaftar sebagai
            peserta Kongsi Kematian Paguyuban Warga Griya Adika Narama Blok H.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Rumah Terdaftar', value: occupancyStats.total, icon: Users },
            { label: 'Total KK', value: totalKK, icon: ShieldCheck },
            { label: 'Huni', value: occupancyStats.huni, icon: Users },
            { label: 'Semi-Huni', value: occupancyStats.semiHuni, icon: Users },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {loading || error ? '—' : item.value}
              </p>
            </div>
          ))}
        </div>

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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-bold text-slate-900">Daftar Peserta</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pilih rumah untuk melihat daftar KK yang terdaftar.
            </p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor rumah atau nama..."
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
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
            <p className="max-w-lg text-sm text-slate-600">{error}</p>
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
              Periksa kembali kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredParticipants.map((house) => {
              const occupancy = getOccupancyInfo(house.residenceStatus);

              return (
                <details key={house.houseNumber} className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-emerald-50/40">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800">{house.houseNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">{house.fullName}</p>
                    </div>

                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${occupancy.className}`}>
                      {occupancy.label}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {house.participantCount} KK Terdaftar
                    </span>

                    <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
                  </summary>

                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Detail Kartu Keluarga
                    </p>
                    {house.participants.map((kk) => (
                      <div
                        key={kk.id}
                        className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 last:mb-0"
                      >
                        <div>
                          <p className="text-xs font-semibold text-emerald-800">
                            KK {kk.kkNumber}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            {kk.fullName}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Terdaftar
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredParticipants.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Menampilkan {filteredParticipants.length} dari {participants.length} rumah terdaftar.
          </div>
        )}
      </div>

      <p className="text-center text-xs leading-relaxed text-slate-500">
        Informasi ini bersumber dari data administrasi Paguyuban Blok H.
      </p>
    </section>
  );
};
