import React, { useState, useEffect } from 'react';
import { Announcement } from '../types/portal';
import { DataService } from '../services/dataService';
import {
  Bell,
  Search,
  Pin,
  Calendar,
  User,
  Plus,
  Trash2,
  Share2,
  Check,
  X,
  FileText,
} from 'lucide-react';

interface PengumumanViewProps {
  isAdmin: boolean;
}

export const PengumumanView: React.FC<PengumumanViewProps> = ({ isAdmin }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    DataService.getAnnouncements()
  );
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe to centralized DataService
  useEffect(() => {
  const loadAnnouncements = async () => {
    try {
      const data = await DataService.fetchAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('[PengumumanView] Gagal memuat pengumuman:', error);
    }
  };

  loadAnnouncements();

  const unsubscribe = DataService.subscribe(() => {
    setAnnouncements(DataService.getAnnouncements());
  });

  return unsubscribe;
}, []);

  // Admin New Announcement Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Announcement['category']>('umum');
  const [newAuthor, setNewAuthor] = useState('Pengurus Blok H');
  const [newContent, setNewContent] = useState('');
  const [newIsPinned, setNewIsPinned] = useState(false);

  const categories = [
    { id: 'semua', label: 'Semua Pengumuman' },
    { id: 'penting', label: 'Penting' },
    { id: 'iuran', label: 'Iuran Lingkungan' },
    { id: 'keamanan', label: 'Keamanan' },
    { id: 'kerja-bakti', label: 'Kerja Bakti' },
    { id: 'kegiatan', label: 'Kegiatan Warga' },
  ];

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesCategory =
      activeCategory === 'semua' ||
      (activeCategory === 'penting' && item.isPinned) ||
      item.category === activeCategory;

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

    const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      await DataService.addAnnouncement({
        title: newTitle.trim(),
        category: newCategory,
        author: newAuthor.trim(),
        content: newContent.trim(),
        date: today,
        isPinned: newIsPinned,
      });

      const data = await DataService.fetchAnnouncements();
      setAnnouncements(data);

      setIsAddModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewIsPinned(false);
    } catch (error) {
      console.error('[PengumumanView] Gagal menambah pengumuman:', error);
      window.alert(
        error instanceof Error
          ? error.message
          : 'Gagal menambahkan pengumuman.'
      );
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Hapus pengumuman ini?')) return;

    try {
      await DataService.deleteAnnouncement(id);

      const data = await DataService.fetchAnnouncements();
      setAnnouncements(data);

      if (selectedAnnouncement?.id === id) {
        setSelectedAnnouncement(null);
      }
    } catch (error) {
      console.error('[PengumumanView] Gagal menghapus pengumuman:', error);
      window.alert(
        error instanceof Error
          ? error.message
          : 'Gagal menghapus pengumuman.'
      );
    }
  };

  const handleShare = (item: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `*Pengumuman Blok H*: ${item.title}\n\n${item.content}\n\n- ${item.author} (${item.date})`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <Bell className="w-4 h-4 text-emerald-700" />
            <span>Papan Informasi Resmi</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Pengumuman Warga Blok H
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Informasi dan pemberitahuan resmi untuk warga Griya Adika Narama Blok H.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pengumuman Baru</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Tabs (Segmented filter control) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
          />
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">Tidak ada pengumuman</h3>
          <p className="text-xs text-slate-500">
            Tidak ditemukan pengumuman sesuai filter atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAnnouncements.map((item) => (
            <article
              key={item.id}
              onClick={() => setSelectedAnnouncement(item)}
              className={`bg-white rounded-xl border p-5 sm:p-6 transition-all cursor-pointer hover:border-emerald-600/40 hover:shadow-xs relative ${
                item.isPinned ? 'border-emerald-700/40 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Top Unboxed Metadata Bar */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                <div className="flex items-center gap-2">
                  {item.isPinned && (
                    <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                      <Pin className="w-3.5 h-3.5 fill-emerald-800" />
                      <span>Sematkan</span>
                      <span aria-hidden="true">·</span>
                    </span>
                  )}
                  <span className="uppercase font-semibold tracking-wide text-emerald-800 text-[11px]">
                    {item.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.date}</span>
                  <span aria-hidden="true" className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">{item.author}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleShare(item, e)}
                    className="p-1 text-slate-400 hover:text-emerald-700 rounded transition-colors"
                    title="Bagikan ke WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Content */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {item.content}
              </p>

              {/* Footer row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-semibold group-hover:underline">
                  Baca detail pengumuman &rarr;
                </span>
                <span className="text-slate-400 text-[11px]">Griya Adika Narama</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setSelectedAnnouncement(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <span className="uppercase">{selectedAnnouncement.category}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedAnnouncement.date}</span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {selectedAnnouncement.title}
            </h3>

            <div className="flex items-center gap-4 text-xs text-slate-500 py-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{selectedAnnouncement.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{selectedAnnouncement.date}</span>
              </div>
            </div>

            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line py-2">
              {selectedAnnouncement.content}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={(e) => handleShare(selectedAnnouncement, e)}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan ke Grup WhatsApp</span>
              </button>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Announcement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Buat Pengumuman Baru</h3>
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
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Penyemprotan Fogging Demam Berdarah"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="umum">Umum</option>
                    <option value="iuran">Iuran Lingkungan</option>
                    <option value="keamanan">Keamanan</option>
                    <option value="kerja-bakti">Kerja Bakti</option>
                    <option value="kegiatan">Kegiatan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penerbit / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Pengumuman
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan isi pengumuman lengkap untuk warga..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={newIsPinned}
                  onChange={(e) => setNewIsPinned(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-700"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Sematkan di Beranda Utama (Pengumuman Prioritas)
                </label>
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
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
