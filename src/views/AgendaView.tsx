import React, { useState, useEffect } from 'react';
import { AgendaItem, RondaSchedule } from '../types/portal';
import { DataService } from '../services/dataService';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  Pencil,
  CalendarPlus,
  Shield,
  X,
  AlertCircle,
} from 'lucide-react';

interface AgendaViewProps {
  isAdmin: boolean;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ isAdmin }) => {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewTab, setViewTab] = useState<'kegiatan' | 'ronda'>('kegiatan');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming');

  const [rondaSchedules, setRondaSchedules] = useState<RondaSchedule[]>([]);
  const [isRondaLoading, setIsRondaLoading] = useState(true);
  const [rondaErrorMessage, setRondaErrorMessage] = useState('');
  const [isRondaModalOpen, setIsRondaModalOpen] = useState(false);
  const [editingRonda, setEditingRonda] = useState<RondaSchedule | null>(null);
  const [rondaDay, setRondaDay] = useState('');
  const [rondaTeam, setRondaTeam] = useState('');
  const [rondaCoordinator, setRondaCoordinator] = useState('');
  const [rondaHouses, setRondaHouses] = useState('');
  const [isRondaSaving, setIsRondaSaving] = useState(false);

  useEffect(() => {
  let mounted = true;

  const loadRondaSchedules = async () => {
    try {
      setIsRondaLoading(true);
      setRondaErrorMessage('');

      const data = await DataService.fetchRondaSchedules();

      if (mounted) {
        setRondaSchedules(data);
      }
    } catch (error) {
      console.error('[AgendaView] Gagal memuat jadwal ronda:', error);

      if (mounted) {
        setRondaErrorMessage(
          error instanceof Error
            ? error.message
            : 'Gagal memuat jadwal ronda.'
        );
        setRondaSchedules([]);
      }
    } finally {
      if (mounted) {
        setIsRondaLoading(false);
      }
    }
  };

  loadRondaSchedules();

  return () => {
    mounted = false;
  };
}, []);

  // Add Agenda Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-10-15');
  const [newTime, setNewTime] = useState('08:00 - 10:00 WIB');
  const [newLocation, setNewLocation] = useState('Taman Narama Blok H');
  const [newCategory, setNewCategory] = useState<AgendaItem['category']>('kerja-bakti');
  const [newPic, setNewPic] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const openAddRondaModal = () => {
  setEditingRonda(null);
  setRondaDay('');
  setRondaTeam('');
  setRondaCoordinator('');
  setRondaHouses('');
  setRondaErrorMessage('');
  setIsRondaModalOpen(true);
};

const openEditRondaModal = (ronda: RondaSchedule) => {
  setEditingRonda(ronda);
  setRondaDay(ronda.day);
  setRondaTeam(ronda.team);
  setRondaCoordinator(ronda.coordinator);
  setRondaHouses(ronda.houses.join(', '));
  setRondaErrorMessage('');
  setIsRondaModalOpen(true);
};

const handleRondaSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (
    !rondaDay.trim() ||
    !rondaTeam.trim() ||
    !rondaCoordinator.trim()
  ) {
    return;
  }

  const houses = rondaHouses
    .split(',')
    .map((house) => house.trim())
    .filter(Boolean);

  try {
    setIsRondaSaving(true);
    setRondaErrorMessage('');

    if (editingRonda) {
      const updated = await DataService.updateRondaSchedule(
        editingRonda.id,
        {
          day: rondaDay.trim(),
          team: rondaTeam.trim(),
          coordinator: rondaCoordinator.trim(),
          houses,
        }
      );

      setRondaSchedules((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );
    } else {
      const created = await DataService.addRondaSchedule({
        day: rondaDay.trim(),
        team: rondaTeam.trim(),
        coordinator: rondaCoordinator.trim(),
        houses,
      });

      setRondaSchedules((current) => [...current, created]);
    }

    setIsRondaModalOpen(false);
    setEditingRonda(null);
  } catch (error) {
    console.error('[AgendaView] Gagal menyimpan jadwal ronda:', error);

    setRondaErrorMessage(
      error instanceof Error
        ? error.message
        : 'Gagal menyimpan jadwal ronda.'
    );
  } finally {
    setIsRondaSaving(false);
  }
};

const handleDeleteRonda = async (id: string) => {
  if (!window.confirm('Hapus jadwal ronda ini?')) return;

  try {
    setRondaErrorMessage('');

    await DataService.deleteRondaSchedule(id);

    setRondaSchedules((current) =>
      current.filter((item) => item.id !== id)
    );
  } catch (error) {
    console.error('[AgendaView] Gagal menghapus jadwal ronda:', error);

    setRondaErrorMessage(
      error instanceof Error
        ? error.message
        : 'Gagal menghapus jadwal ronda.'
    );
  }
};
  const filteredAgendas = agendas.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  // Calculate next upcoming agenda
  const nextAgenda = agendas
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
  const newAgenda = await DataService.addAgenda({
    title: newTitle.trim(),
    date: newDate,
    time: newTime,
    location: newLocation,
    category: newCategory,
    pic: newPic || 'Pengurus Blok H',
    description: newDescription,
    status: 'upcoming',
  });

  setAgendas((current) => [newAgenda, ...current]);

  setIsAddModalOpen(false);
  setNewTitle('');
  setNewDescription('');
  setErrorMessage('');
} catch (error) {
  console.error('[AgendaView] Gagal menambah agenda:', error);

  setErrorMessage(
    error instanceof Error
      ? error.message
      : 'Gagal menambah agenda'
  );
}
  };

 const handleDelete = async (id: string) => {
  if (!window.confirm('Hapus agenda ini?')) return;

  try {
    await DataService.deleteAgenda(id);

    setAgendas((current) =>
      current.filter((item) => item.id !== id)
    );

    setErrorMessage('');
  } catch (error) {
    console.error('[AgendaView] Gagal menghapus agenda:', error);

    setErrorMessage(
      error instanceof Error
        ? error.message
        : 'Gagal menghapus agenda'
    );
  }
};

  const handleAddToCalendar = (item: AgendaItem) => {
    const title = encodeURIComponent(`[Warga Blok H] ${item.title}`);
    const details = encodeURIComponent(`${item.description}\nLokasi: ${item.location}\nPIC: ${item.pic}`);
    const location = encodeURIComponent(item.location);
    // Format YYYYMMDD
    const dateFormatted = item.date.replace(/-/g, '');
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateFormatted}T070000Z/${dateFormatted}T100000Z`;
    window.open(gCalUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Kalender Lingkungan & Siskamling</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Agenda Kegiatan Warga
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Agenda kegiatan, informasi lingkungan, dan jadwal siskamling warga Blok H.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda Baru</span>
          </button>
        )}
      </div>

      {/* Primary Toggle: Kegiatan vs Siskamling Ronda */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setViewTab('kegiatan')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              viewTab === 'kegiatan'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal Kegiatan Warga</span>
          </button>
          <button
            onClick={() => setViewTab('ronda')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              viewTab === 'ronda'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Jadwal Ronda Siskamling</span>
          </button>
        </div>

        {viewTab === 'kegiatan' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'upcoming'
                  ? 'bg-emerald-800 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Mendatang
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-800 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Riwayat Terlaksana
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-emerald-800 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua
            </button>
          </div>
        )}
      </div>

      {viewTab === 'kegiatan' ? (
        <div className="space-y-6">
          {/* Highlight Next Agenda */}
          {nextAgenda && statusFilter !== 'completed' && (
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                <span className="uppercase tracking-wider">Agenda Terdekat Berikutnya</span>
                <span>{nextAgenda.date}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold">{nextAgenda.title}</h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
                {nextAgenda.description}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-emerald-200">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{nextAgenda.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{nextAgenda.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PIC: {nextAgenda.pic}</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleAddToCalendar(nextAgenda)}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 border border-emerald-600/50 transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Simpan ke Google Calendar</span>
                </button>
              </div>
            </div>
          )}

          {/* Agenda List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAgendas.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-emerald-800 font-semibold uppercase text-[11px]">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-medium ${
                          item.status === 'completed' ? 'text-slate-400' : 'text-emerald-700'
                        }`}
                      >
                        {item.status === 'completed' ? 'Selesai' : 'Mendatang'}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                  <div className="pt-2 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {item.date} · {item.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>PIC: {item.pic}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleAddToCalendar(item)}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Tambahkan ke Kalender</span>
                  </button>
                  <span className="text-[11px] text-slate-400">Blok H</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
                /* Ronda Siskamling Tab */
        <div className="space-y-4">
          {isAdmin && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openAddRondaModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Jadwal Ronda
            </button>
          </div>
        )}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />

            <div className="space-y-1">
              <h4 className="font-bold text-sm">
                Informasi Jadwal Siskamling Ronda Blok H
              </h4>

              <p className="leading-relaxed">
                Jadwal siskamling berikut merupakan informasi jadwal keamanan
                lingkungan Blok H. Perubahan jadwal, regu jaga, dan nomor rumah
                akan diperbarui oleh pengurus sesuai hasil koordinasi warga.
              </p>
            </div>
          </div>

          {isRondaLoading ? (
  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
    <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-emerald-200 border-t-emerald-700 animate-spin" />

    <h4 className="font-bold text-sm text-slate-900">
      Memuat Jadwal Siskamling
    </h4>

    <p className="text-xs text-slate-500 mt-2">
      Sedang mengambil jadwal ronda dari sistem.
    </p>
  </div>
) : rondaErrorMessage ? (
  <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />

    <h4 className="font-bold text-sm text-slate-900">
      Jadwal Siskamling Gagal Dimuat
    </h4>

    <p className="text-xs text-red-600 mt-2 leading-relaxed max-w-lg mx-auto">
      {rondaErrorMessage}
    </p>
  </div>
) : rondaSchedules.length === 0 ? (
  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
    <Shield className="w-8 h-8 text-emerald-700 mx-auto mb-3" />

    <h4 className="font-bold text-sm text-slate-900">
      Jadwal Siskamling Belum Tersedia
    </h4>

    <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-lg mx-auto">
      Jadwal siskamling, regu jaga, dan nomor rumah akan diperbarui
      oleh pengurus setelah hasil koordinasi dan kesepakatan warga
      Blok H.
    </p>
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {rondaSchedules.filter(Boolean).map((ronda, idx) => (
      <div
        key={ronda.id}
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 hover:border-emerald-300 transition-colors"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-sm font-bold text-slate-900">
            Malam {ronda.day}
          </span>

          <span className="text-xs font-semibold text-emerald-800">
            {ronda.team}
          </span>
        </div>

        <div className="text-xs space-y-1">
          <span className="text-slate-500">
            Koordinator Regu:
          </span>

          <p className="font-semibold text-slate-800">
            {ronda.coordinator}
          </p>
        </div>

        <div className="pt-1">
          <span className="text-[11px] text-slate-500 block mb-1.5">
            Anggota Warga Rumah:
          </span>

          <div className="flex flex-wrap gap-1.5">
            {ronda.houses.map((house) => (
              <span
                key={house}
                className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 text-slate-800 rounded-md"
              >
                {house}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-50">
          Standby di Pos Satpam Blok H
        </div>
        {isAdmin && (
  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
    <button
      type="button"
      onClick={() => openEditRondaModal(ronda)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
    >
      <Pencil className="w-3.5 h-3.5" />
      Edit
    </button>

    <button
      type="button"
      onClick={() => handleDeleteRonda(ronda.id)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Hapus
    </button>
  </div>
)}
      </div>
    ))}
  </div>
)}
        </div>
      )}
      {/* Admin Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Agenda Kegiatan Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kegiatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Senam Sehat & Cek Gula Darah Warga"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    required
                    placeholder="07:00 - 10:00 WIB"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Kegiatan
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="kerja-bakti">Kerja Bakti</option>
                    <option value="rapat">Rapat Paguyuban</option>
                    <option value="posyandu">Posyandu & Kesehatan</option>
                    <option value="olahraga">Olahraga</option>
                    <option value="sosial">Sosial / Keagamaan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penanggung Jawab (PIC)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Irwan (H-11)"
                  value={newPic}
                  onChange={(e) => setNewPic(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Keterangan perlengkapan yang perlu dibawa warga atau rincian agenda..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
            {/* Admin Ronda Modal */}
      {isRondaModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (!isRondaSaving) {
                setIsRondaModalOpen(false);
              }
            }}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRonda
                    ? 'Edit Jadwal Ronda'
                    : 'Tambah Jadwal Ronda'}
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Atur regu dan rumah warga yang bertugas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRondaModalOpen(false)}
                disabled={isRondaSaving}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rondaErrorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {rondaErrorMessage}
              </div>
            )}

            <form onSubmit={handleRondaSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Malam / Hari
                </label>

                <input
                  type="text"
                  required
                  placeholder="Contoh: Senin"
                  value={rondaDay}
                  onChange={(e) => setRondaDay(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Regu
                </label>

                <input
                  type="text"
                  required
                  placeholder="Contoh: Regu 1"
                  value={rondaTeam}
                  onChange={(e) => setRondaTeam(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Koordinator Regu
                </label>

                <input
                  type="text"
                  required
                  placeholder="Contoh: Ketua Regu"
                  value={rondaCoordinator}
                  onChange={(e) => setRondaCoordinator(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Rumah
                </label>

                <input
                  type="text"
                  placeholder="Contoh: HA-01, HA-02, HA-03"
                  value={rondaHouses}
                  onChange={(e) => setRondaHouses(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />

                <p className="text-[11px] text-slate-400 mt-1">
                  Pisahkan setiap nomor rumah dengan tanda koma.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRondaModalOpen(false)}
                  disabled={isRondaSaving}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isRondaSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isRondaSaving
                    ? 'Menyimpan...'
                    : editingRonda
                      ? 'Simpan Perubahan'
                      : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
