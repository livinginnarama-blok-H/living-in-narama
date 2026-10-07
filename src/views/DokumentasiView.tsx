import React, { useState, useEffect } from 'react';
import { DocumentationItem } from '../types/portal';
import { DataService } from '../services/dataService';
import {
  Camera,
  User,
  Plus,
  X,
  ZoomIn,
  Pencil,
  Trash2,
} from 'lucide-react';

interface DokumentasiViewProps {
  isAdmin: boolean;
}

export const DokumentasiView: React.FC<DokumentasiViewProps> = ({ isAdmin }) => {
    const [items, setItems] = useState<DocumentationItem[]>(
    () => DataService.getDocumentation()
  );
  useEffect(() => {
    let cancelled = false;

    const loadDocumentation = async () => {
      try {
        const latest = await DataService.fetchDocumentation();

        if (!cancelled) {
          setItems(latest);
        }
      } catch (error) {
        console.error('Gagal memuat dokumentasi terbaru:', error);
      }
    };

    loadDocumentation();

    return () => {
      cancelled = true;
    };
  }, []);
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [selectedPhoto, setSelectedPhoto] =
    useState<DocumentationItem | null>(null);

  // Admin Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Admin Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<DocumentationItem | null>(null);

  // Delete
  const [isDeleting, setIsDeleting] = useState(false);

  // Add form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] =
    useState<DocumentationItem['category']>('kerja-bakti');
  const [newDate, setNewDate] = useState('September 2026');
  const [newDescription, setNewDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newPhotographer, setNewPhotographer] =
    useState('Warga Blok H');

  // Edit form
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] =
    useState<DocumentationItem['category']>('kerja-bakti');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPhotographer, setEditPhotographer] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  // Status
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

  const latestItems = items.slice(0, 3);
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

      await DataService.addDocumentation(
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

  const handleEditOpen = (item: DocumentationItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditDate(item.date);
    setEditDescription(item.description);
    setEditPhotographer(item.photographer);
    setEditImageFile(null);
    setErrorMessage('');
    setSelectedPhoto(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingItem) return;

    try {
      setIsSaving(true);
      setErrorMessage('');

      const updated = await DataService.updateDocumentation(
        editingItem.id,
        {
          title: editTitle.trim(),
          category: editCategory,
          date: editDate,
          description: editDescription,
          photographer: editPhotographer,
        },
        editImageFile || undefined
      );

      setItems((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setIsEditModalOpen(false);
      setEditingItem(null);
      setEditImageFile(null);
    } catch (error) {
      console.error('Gagal memperbarui dokumentasi:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui dokumentasi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: DocumentationItem) => {
    const confirmed = window.confirm(
      `Hapus dokumentasi "${item.title}"?\n\nFoto dan data dokumentasi ini akan dihapus dari website.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setErrorMessage('');

      await DataService.deleteDocumentation(item.id);

      setItems((current) =>
        current.filter((doc) => doc.id !== item.id)
      );

      if (selectedPhoto?.id === item.id) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error('Gagal menghapus dokumentasi:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Gagal menghapus dokumentasi.'
      );
    } finally {
      setIsDeleting(false);
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
            Dokumentasi Blok H
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Merekam momen, menyimpan cerita, dan menjadi bagian dari perjalanan bersama.
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
      {/* Dokumentasi Terbaru */}
      {latestItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Dokumentasi Terbaru
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Momen terbaru dari kegiatan dan perjalanan warga Blok H.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {latestItems.map((item) => (
              <article
                key={`latest-${item.id}`}
                onClick={() => setSelectedPhoto(item)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-600/40 hover:shadow-md transition-all"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-emerald-950">
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-xs font-medium flex items-center gap-1.5">
                      <ZoomIn className="w-4 h-4 text-emerald-300" />
                      Perbesar Foto
                    </span>
                  </div>
                </div>

                <div className="p-3.5">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                    <span className="uppercase font-semibold text-emerald-800">
                      {item.category.replace('-', ' ')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.date}</span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {item.title}
                  </h4>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

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
            {/* Image Container */}
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

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 min-w-0">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                  <span className="truncate max-w-[120px]">
                    {item.photographer}
                  </span>
                </div>

                {isAdmin ? (
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleEditOpen(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Edit dokumentasi"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="Hapus dokumentasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-emerald-800 font-medium text-[11px]">
                    Griya Adika Narama
                  </span>
                )}
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
      {/* Edit Documentation Modal */}
      {isEditModalOpen && editingItem && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!isSaving) {
              setIsEditModalOpen(false);
              setEditingItem(null);
              setEditImageFile(null);
              setErrorMessage('');
            }
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Dokumentasi
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  ID: {editingItem.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isSaving) {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                    setEditImageFile(null);
                    setErrorMessage('');
                  }
                }}
                disabled={isSaving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                title="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-5 p-5">
              {/* Error Message */}
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Judul Dokumentasi
                </label>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  disabled={isSaving}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                  placeholder="Masukkan judul dokumentasi"
                />
              </div>

              {/* Category + Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Kategori
                  </label>

                  <select
                    value={editCategory}
                    onChange={(e) =>
                      setEditCategory(
                        e.target.value as DocumentationItem['category']
                      )
                    }
                    disabled={isSaving}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                  >
                    <option value="kerja-bakti">Kerja Bakti</option>
                    <option value="lingkungan">Lingkungan</option>
                    <option value="sosial">Sosial</option>
                    <option value="pembangunan">Pembangunan</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Tanggal
                  </label>

                  <input
                    type="text"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    disabled={isSaving}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                    placeholder="Contoh: September 2026"
                  />
                </div>
              </div>

              {/* Photographer */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Fotografer
                </label>

                <input
                  type="text"
                  value={editPhotographer}
                  onChange={(e) => setEditPhotographer(e.target.value)}
                  disabled={isSaving}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                  placeholder="Nama fotografer"
                />
              </div>

              {/* Current Photo */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Foto Saat Ini
                </label>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={editingItem.image}
                    alt={editingItem.title}
                    referrerPolicy="no-referrer"
                    className="h-48 w-full object-cover"
                  />
                </div>
              </div>

              {/* New Photo */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Ganti Foto
                  <span className="ml-1 font-normal text-slate-400">
                    (opsional)
                  </span>
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isSaving}
                  onChange={(e) => {
                    setEditImageFile(e.target.files?.[0] || null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                />

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Pilih foto baru jika ingin mengganti foto saat ini. Maksimal
                  50 MB.
                </p>

                {editImageFile && (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Foto baru: {editImageFile.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Deskripsi
                </label>

                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  disabled={isSaving}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                  placeholder="Masukkan deskripsi dokumentasi"
                />
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!isSaving) {
                      setIsEditModalOpen(false);
                      setEditingItem(null);
                      setEditImageFile(null);
                      setErrorMessage('');
                    }
                  }}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
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
