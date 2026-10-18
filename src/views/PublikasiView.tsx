
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, FileText, Download, ExternalLink, Upload,
  Trash2, LoaderCircle, FolderOpen, FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Category =
  | 'Informasi Keuangan'
  | 'Informasi Paguyuban'
  | 'Informasi Umum';

type DocumentStatus = 'draft' | 'published';

interface PublicationDocument {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number;
  status: DocumentStatus;
  created_at: string;
  published_at: string | null;
}

interface PublikasiViewProps {
  isAdmin: boolean;
}

const CATEGORIES: Category[] = [
  'Informasi Keuangan',
  'Informasi Paguyuban',
  'Informasi Umum',
];

const BUCKET = 'publikasi-dokumen';
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const PublikasiView: React.FC<PublikasiViewProps> = ({
  isAdmin,
}) => {
  const [documents, setDocuments] = useState<PublicationDocument[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'Semua'>('Semua');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadCategory, setUploadCategory] =
    useState<Category>('Informasi Umum');
  const [status, setStatus] = useState<DocumentStatus>('draft');
  const [file, setFile] = useState<File | null>(null);

  const loadDocuments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('publikasi_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(`Gagal memuat dokumen: ${error.message}`);
    } else {
      setDocuments((data ?? []) as PublicationDocument[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return documents.filter((doc) => {
      const matchesCategory =
        category === 'Semua' || doc.category === category;

      const matchesSearch =
        !keyword ||
        [doc.title, doc.description ?? '', doc.file_name]
          .some((value) => value.toLowerCase().includes(keyword));

      return matchesCategory && matchesSearch;
    });
  }, [documents, search, category]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!isAdmin) return;

    if (!title.trim() || !file) {
      setMessage('Judul dan file dokumen wajib diisi.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage('Ukuran file maksimal 20 MB.');
      return;
    }

    setSaving(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

      const fileId =
        typeof globalThis.crypto?.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

      const filePath = `${authData.user.id}/${fileId}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('publikasi_documents')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category: uploadCategory,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type || null,
          file_size: file.size,
          status,
          created_by: authData.user.id,
          published_at: status === 'published'
            ? new Date().toISOString()
            : null,
        });

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        throw insertError;
      }

      setTitle('');
      setDescription('');
      setUploadCategory('Informasi Umum');
      setStatus('draft');
      setFile(null);

      const input = document.getElementById(
        'publikasi-file'
      ) as HTMLInputElement | null;

      if (input) input.value = '';

      setMessage('Dokumen berhasil diunggah.');
      await loadDocuments();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat mengunggah dokumen.'
      );
    } finally {
      setSaving(false);
    }
  };


  const handleOpen = async (
    doc: PublicationDocument,
    download = false
  ) => {
    if (!isAdmin && doc.status !== 'published') {
      setMessage('Dokumen Draft tidak tersedia untuk publik.');
      return;
    }

    setOpeningId(doc.id);
    setMessage('');

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(
          doc.file_path,
          60,
          download ? { download: doc.file_name } : undefined
        );

      if (error) throw error;
      if (!data?.signedUrl) {
        throw new Error('Tautan dokumen tidak tersedia.');
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Dokumen gagal dibuka.'
      );
    } finally {
      setOpeningId(null);
    }
  };



  const handleDelete = async (doc: PublicationDocument) => {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Hapus dokumen "${doc.title}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    setMessage('');
    setSaving(true);

    try {
      // Hapus file terlebih dahulu agar metadata tidak hilang
      // jika penghapusan file ditolak atau gagal.
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from('publikasi_documents')
        .delete()
        .eq('id', doc.id);

      if (deleteError) {
        setMessage(
          'File berhasil dihapus, tetapi metadata gagal dihapus. ' +
          'Coba hapus dokumen ini kembali atau periksa Supabase.'
        );
        await loadDocuments();
        return;
      }

      setMessage('Dokumen berhasil dihapus.');
      await loadDocuments();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Gagal menghapus dokumen: ${error.message}`
          : 'Gagal menghapus dokumen.'
      );
      await loadDocuments();
    } finally {
      setSaving(false);
    }
  };


  const handlePublish = async (
    doc: PublicationDocument,
    nextStatus: DocumentStatus
  ) => {
    if (!isAdmin) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('publikasi_documents')
      .update({
        status: nextStatus,
        published_at: nextStatus === 'published'
          ? new Date().toISOString()
          : null,
      })
      .eq('id', doc.id);

    if (error) {
      setMessage(`Gagal mengubah status: ${error.message}`);
    } else {
      setMessage('Status publikasi berhasil diperbarui.');
      await loadDocuments();
    }

    setSaving(false);
  };

  return (
    <section className="space-y-7">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 sm:p-9 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/15 p-3">
            <FolderOpen className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">
              Living In Narama · Blok H
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
              Pusat Publikasi Dokumen
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
              Akses informasi keuangan, paguyuban, dan informasi umum
              dalam satu tempat.
            </p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <form
          onSubmit={handleUpload}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Unggah Dokumen
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              Judul dokumen *
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={180}
                placeholder="Contoh: Laporan Kas September 2026"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Kategori *
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as Category)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
              Deskripsi
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Keterangan singkat dokumen (opsional)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              File dokumen * (maks. 20 MB)
              <input
                id="publikasi-file"
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-sm"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Status awal
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              >
                <option value="draft">Draft — belum tampil ke publik</option>
                <option value="published">Terbit — tampil ke publik</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {saving
              ? <LoaderCircle className="h-4 w-4 animate-spin" />
              : <Upload className="h-4 w-4" />}
            {saving ? 'Memproses...' : 'Unggah Dokumen'}
          </button>
        </form>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700"
        >
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Dokumen Tersedia
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredDocuments.length} dokumen ditemukan
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, deskripsi, atau nama file..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | 'Semua')}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Memuat dokumen...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">
              Belum ada dokumen yang sesuai
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Coba kata kunci atau kategori lainnya.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredDocuments.map((doc) => (
              <article
                key={doc.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
                    {doc.mime_type?.includes('spreadsheet') ||
                    doc.file_name.match(/\.(xls|xlsx|csv)$/i)
                      ? <FileSpreadsheet className="h-6 w-6" />
                      : <FileText className="h-6 w-6" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      {doc.category}
                    </span>
                    <h3 className="mt-2 break-words font-bold text-slate-900">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <p className="break-all">{doc.file_name}</p>
                  <p className="mt-1">
                    {formatSize(doc.file_size)} ·{' '}
                    {formatDate(doc.published_at ?? doc.created_at)}
                  </p>
                  {isAdmin && (
                    <p className="mt-2 font-semibold text-amber-700">
                      Status: {doc.status === 'published' ? 'Terbit' : 'Draft'}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={openingId === doc.id}
                    onClick={() => void handleOpen(doc)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka
                  </button>

                  <button
                    type="button"
                    disabled={openingId === doc.id}
                    onClick={() => void handleOpen(doc, true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Unduh
                  </button>

                  {isAdmin && doc.status === 'draft' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handlePublish(doc, 'published')}
                      className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800"
                    >
                      Terbitkan
                    </button>
                  )}

                  {isAdmin && doc.status === 'published' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handlePublish(doc, 'draft')}
                      className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800"
                    >
                      Jadikan Draft
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleDelete(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PublikasiView;
