import React, { useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { DataService } from '../services/dataService';
import { CitizenReport } from '../types/portal';

interface LaporWargaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSubmitted?: () => void;
}

export const LaporWargaModal: React.FC<LaporWargaModalProps> = ({
  isOpen,
  onClose,
  onSuccessSubmitted,
}) => {
  const [residentName, setResidentName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<CitizenReport['category']>('fasilitas');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<CitizenReport | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[LaporWargaModal] handleSubmit terpanggil');

    if (!residentName || !houseNumber || !title || !description) return;

    try {
    const savedReport = await DataService.submitReport({
        residentName,
        houseNumber,
        phone: phone || '-',
        category,
        title,
        description,
      });

      setSubmittedReport(savedReport);
      setIsSubmitted(true);

      if (onSuccessSubmitted) {
        onSuccessSubmitted();
      }
      
    } catch (error) {
      console.error('[LaporWargaModal] Gagal mengirim laporan:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Gagal mengirim laporan warga.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Layanan Aspirasi & Lapor Warga</h3>
            <p className="text-xs text-emerald-200">Griya Adika Narama Blok H</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
        <div className="p-8 text-center space-y-5">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />

          <div>
            <h4 className="text-lg font-bold text-slate-900">
              Laporan Berhasil Terkirim!
            </h4>

            <p className="text-sm text-slate-600 mt-1">
              Terima kasih atas kepedulian Anda. Pengurus Paguyuban Blok H akan segera menindaklanjuti laporan ini.
            </p>
          </div>

          {submittedReport?.reportNumber && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Nomor Laporan
              </p>

              <p className="text-xl font-bold text-emerald-900 font-mono mt-1">
                {submittedReport.reportNumber}
              </p>

              <p className="text-[11px] text-emerald-700 mt-2">
                Simpan nomor ini untuk referensi laporan Anda.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setResidentName('');
              setHouseNumber('');
              setPhone('');
              setTitle('');
              setDescription('');
              setSubmittedReport(null);
              onClose();
            }}
            className="w-full px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-xs text-slate-500">
              Sampaikan keluhan fasilitas lingkungan, masukan keamanan, atau usulan kegiatan untuk kemajuan bersama Blok H.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Warga <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Contoh 01"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Rumah Blok H <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Blok H No. XX"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Keluhan / Aspirasi
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                >
                  <option value="fasilitas">Fasilitas / Sarana Prasarana</option>
                  <option value="kebersihan">Kebersihan & Sampah</option>
                  <option value="keamanan">Keamanan & Ketertiban</option>
                  <option value="saran">Usul & Saran Kegiatan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Laporan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Lampu jalan di tanjakan Blok H mati"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan Lengkap & Lokasi Detail <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Jelaskan detail permasalahan agar tim satpam/seksi sarpras dapat segera mengecek ke lokasi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Laporan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
