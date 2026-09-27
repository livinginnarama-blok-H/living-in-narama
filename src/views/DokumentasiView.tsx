import React, { useState, useEffect } from 'react';
import { DocumentationItem } from '../types/portal';
import { DataService } from '../services/dataService';
import { Camera, Calendar, User, Plus, X, ZoomIn, Image as ImageIcon } from 'lucide-react';

interface DokumentasiViewProps {
  isAdmin: boolean;
}

export const DokumentasiView: React.FC<DokumentasiViewProps> = ({ isAdmin }) => {
  const [items, setItems] = useState<DocumentationItem[]>(() => DataService.getDocumentation());
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [selectedPhoto, setSelectedPhoto] = useState<DocumentationItem | null>(null);

  // Subscribe to centralized DataService
  useEffect(() => {
  let mounted = true;

  const loadDocumentation = async () => {
    try {
      const data = await DataService.fetchDocumentation();

      if (mounted) {
        setItems(data);
      }
    } catch (error) {
      console.error('Gagal memuat dokumentasi:', error);
    }
  };

  loadDocumentation();

  const unsubscribe = DataService.subscribe(() => {
    if (mounted) {
      setItems(DataService.getDocumentation());
    }
  });

  return () => {
    mounted = false;
    unsubscribe();
  };
}, []);
  // Admin Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentationItem['category']>('kerja-bakti');
  const [newDate, setNewDate] = useState('September 2026');
  const [newDescription, setNewDescription] = useState('');
 const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newPhotographer, setNewPhotographer] = useState('Warga Blok H');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    { id: 'semua', label: 'Semua Dokumentasi' },
    { id: 'lingkungan', label: 'Lingkungan & Asri' },
    { id: 'kerja-bakti', label: 'Kerja Bakti' },
    { id: 'pembangunan', label: 'Fasilitas & Fasum' },
    { id: 'sosial', label: 'Kegiatan Sosial' },
  ];

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'semua') return true;
    return item.category === activeCategory;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!newTitle.trim()) return;

  if (!newImageFile) {
    setErrorMessage('Silakan pilih foto dokumentasi terlebih dahulu.');
    return;
  }

  try {
    setIsSaving(true);
    setErrorMessage('');

    const saved = await DataService.addDocumentation(
      {
        title: newTitle.trim(),
        category: newCategory,
        date: newDate,
        description: newDescription,
        photographer: newPhotographer,
      },
      newImageFile
    );
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewImageFile(null);
    setNewPhotographer('Warga Blok H');
  } catch (error) {
    console.error('Gagal menyimpan dokumentasi:', error);

    setErrorMessage(
      error instanceof Error
        ? error.message
        : 'Gagal menyimpan dokumentasi.'
    );
  } finally {
    setIsSaving(false);
  }
};

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>Galeri & Arsip Kegiatan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dokumentasi Lingkungan Blok H
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Koleksi foto simulasi untuk demonstrasi fitur galeri kegiatan warga dan arsip penataan lingkungan.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Foto Baru</span>
          </button>
        )}
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            onClick={() => setSelectedPhoto(item)}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-600/40 hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Image Container with Fallback */}
            <div className="relative aspect-4/3 overflow-hidden bg-emerald-950">
              <img
                src={item.image}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs font-medium flex items-center gap-1.5">
                  <ZoomIn className="w-4 h-4 text-emerald-300" />
                  <span>Perbesar Foto</span>
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                  <span className="uppercase font-semibold text-emerald-800">
                    {item.category.replace('-', ' ')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.date}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-900 transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate max-w-[140px]">{item.photographer}</span>
                </div>
                <span className="text-emerald-800 font-medium">Griya Adika Narama</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setSelectedPhoto(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-emerald-400">
                {selectedPhoto.category.replace('-', ' ')} · {selectedPhoto.date}
              </span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo */}
            <div className="relative max-h-[60vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.image}
                alt={selectedPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            </div>

            {/* Caption */}
            <div className="p-5 space-y-2 bg-white">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {selectedPhoto.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedPhoto.description}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span>Fotografer: {selectedPhoto.photographer}</span>
                <span>Kompleks Griya Adika Narama Blok H</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Photo Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Dokumentasi Baru</h3>
              <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Foto Dokumentasi
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) => {
                  setNewImageFile(e.target.files?.[0] || null);
                  setErrorMessage('');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />

              <p className="text-[11px] text-slate-500 mt-1">
                Format JPG, PNG, atau WebP. Maksimal 50 MB.
              </p>
            </div>
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
                  Judul Foto / Kegiatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perbaikan Paving Blok & Taman Bunga"
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
                    <option value="lingkungan">Lingkungan & Asri</option>
                    <option value="kerja-bakti">Kerja Bakti</option>
                    <option value="pembangunan">Fasilitas & Fasum</option>
                    <option value="sosial">Sosial / Warga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fotografer / Pengunggah
                </label>
                <input
                  type="text"
                  required
                  value={newPhotographer}
                  onChange={(e) => setNewPhotographer(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Dokumentasi
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Keterangan singkat mengenai foto kegiatan ini..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              {errorMessage && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {errorMessage}
                </div>
              )}
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
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isSaving ? 'Mengunggah...' : 'Simpan ke Galeri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
