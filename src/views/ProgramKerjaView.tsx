import React, { useState, useEffect } from 'react';
import { WorkProgram } from '../types/portal';
import { DataService } from '../services/dataService';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Target,
  Plus,
  Coins,
  ArrowUpRight,
  Sparkles,
  X,
} from 'lucide-react';

interface ProgramKerjaViewProps {
  isAdmin: boolean;
}

export const ProgramKerjaView: React.FC<ProgramKerjaViewProps> = ({ isAdmin }) => {
  const [prokers, setProkers] = useState<WorkProgram[]>(() => DataService.getWorkPrograms());
  const [selectedTerm, setSelectedTerm] = useState<'all' | 'pendek' | 'menengah' | 'panjang'>('all');

  // Subscribe to centralized DataService
  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setProkers(DataService.getWorkPrograms());
    });
    return unsubscribe;
  }, []);

  // Admin Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTerm, setNewTerm] = useState<WorkProgram['term']>('pendek');
  const [newPeriod, setNewPeriod] = useState('Q4 2026');
  const [newDescription, setNewDescription] = useState('');
  const [newPic, setNewPic] = useState('Seksi Pembangunan');
  const [newBudget, setNewBudget] = useState(5000000);
  const [newTargets, setNewTargets] = useState('Survei awal; Pelaksanaan; Evaluasi hasil');

  const terms = [
    { id: 'all', label: 'Semua Program' },
    { id: 'pendek', label: 'Jangka Pendek (1-3 Bulan)' },
    { id: 'menengah', label: 'Jangka Menengah (6-12 Bulan)' },
    { id: 'panjang', label: 'Jangka Panjang (1-2 Tahun)' },
  ];

  const filteredProkers = prokers.filter((p) => {
    if (selectedTerm === 'all') return true;
    return p.term === selectedTerm;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: WorkProgram['status']) => {
    switch (status) {
      case 'selesai':
        return <span className="text-xs font-semibold text-emerald-700">Selesai 100%</span>;
      case 'berjalan':
        return <span className="text-xs font-semibold text-amber-700">Sedang Berjalan</span>;
      case 'rencana':
        return <span className="text-xs font-semibold text-blue-700">Rencana Kerja</span>;
      case 'evaluasi':
        return <span className="text-xs font-semibold text-purple-700">Tahap Evaluasi</span>;
    }
  };

  const handleProgressChange = (program: WorkProgram, newProgress: number) => {
    const updated: WorkProgram = {
      ...program,
      progress: newProgress,
      status: newProgress === 100 ? 'selesai' : newProgress > 0 ? 'berjalan' : 'rencana',
    };
    DataService.updateWorkProgram(updated);
    setProkers(DataService.getWorkPrograms());
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetsArray = newTargets
      .split(';')
      .map((t) => t.trim())
      .filter(Boolean);

    DataService.addWorkProgram({
      title: newTitle.trim(),
      term: newTerm,
      period: newPeriod,
      description: newDescription,
      pic: newPic,
      budgetEstimated: Number(newBudget),
      budgetRealized: 0,
      progress: 0,
      status: 'rencana',
      targets: targetsArray,
    });

    setProkers(DataService.getWorkPrograms());
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  // Aggregate stats
  const totalBudgetEst = prokers.reduce((acc, p) => acc + p.budgetEstimated, 0);
  const totalBudgetReal = prokers.reduce((acc, p) => acc + p.budgetRealized, 0);
  const completedCount = prokers.filter((p) => p.status === 'selesai').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <Briefcase className="w-4 h-4 text-emerald-700" />
            <span>Rencana Strategis Kepengurusan</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
              DATA DEMO
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Program Kerja Paguyuban Blok H
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar program di bawah ini merupakan data simulasi percontohan untuk menguji fitur pelacakan capaian dan anggaran program warga.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Program Baru</span>
          </button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block">Total Program Terdata</span>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {prokers.length} Program
            <span className="text-xs text-emerald-700 font-normal ml-2">
              ({completedCount} Terealisasi)
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block">Estimasi Kebutuhan Anggaran</span>
          <p className="text-xl font-bold text-emerald-900 tabular-nums">
            {formatCurrency(totalBudgetEst)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block">Realisasi Anggaran Terpakai</span>
          <p className="text-xl font-bold text-slate-800 tabular-nums">
            {formatCurrency(totalBudgetReal)}
          </p>
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {terms.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTerm(t.id as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedTerm === t.id
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Programs Cards */}
      <div className="space-y-4">
        {filteredProkers.map((program) => (
          <article
            key={program.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 hover:border-emerald-600/40 transition-colors"
          >
            {/* Header: Category + Period + Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="uppercase font-semibold text-emerald-800 text-[11px]">
                  Jangka {program.term}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Periode: {program.period}</span>
                </span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">PIC: {program.pic}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(program.status)}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {program.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {program.description}
              </p>
            </div>

            {/* Progress Bar & Financial stats */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Progres Capaian Kegiatan</span>
                <span className="font-bold text-emerald-800 tabular-nums">{program.progress}%</span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                  style={{ width: `${program.progress}%` }}
                />
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-slate-500">Ubah Progres:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={program.progress}
                    onChange={(e) => handleProgressChange(program, Number(e.target.value))}
                    className="w-48 accent-emerald-800"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Rencana Anggaran (RAPB):</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {formatCurrency(program.budgetEstimated)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Realisasi Kas Digunakan:</span>
                  <span className="font-semibold text-emerald-800 tabular-nums">
                    {formatCurrency(program.budgetRealized)}
                  </span>
                </div>
              </div>
            </div>

            {/* Targets Milestones */}
            {program.targets && program.targets.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tahapan & Rincian Target:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {program.targets.map((tgt, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-100 text-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{tgt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Admin Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Program Kerja Baru</h3>
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
                  Nama Program Kerja
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengadaan Mesin Potong Rumput & Komposter Daun"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jangka Waktu
                  </label>
                  <select
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="pendek">Jangka Pendek (1-3 Bulan)</option>
                    <option value="menengah">Jangka Menengah (6-12 Bulan)</option>
                    <option value="panjang">Jangka Panjang (1-2 Tahun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Periode</label>
                  <input
                    type="text"
                    required
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penanggung Jawab (PIC)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPic}
                    onChange={(e) => setNewPic(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rencana Anggaran (Rp)
                  </label>
                  <input
                    type="number"
                    step="500000"
                    required
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan tujuan dan ruang lingkup program kerja ini..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahapan / Target (Pisahkan dengan tanda titik koma ;)
                </label>
                <input
                  type="text"
                  placeholder="Target 1; Target 2; Target 3"
                  value={newTargets}
                  onChange={(e) => setNewTargets(e.target.value)}
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
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
