import React, { useState } from 'react';
import {
  X,
  Search,
  Loader2,
  CheckCircle2,
  Clock3,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import {
  PublicReportHistoryItem,
  PublicReportStatus,
} from '../types/portal';

interface CekLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<PublicReportStatus['status'], string> = {
  menunggu: 'Menunggu Tindak Lanjut',
  diproses: 'Sedang Diproses',
  selesai: 'Selesai Ditangani',
};

const STATUS_STYLES: Record<
  PublicReportStatus['status'],
  {
    icon: React.ReactNode;
    container: string;
    iconContainer: string;
  }
> = {
  menunggu: {
    icon: <Clock3 className="w-5 h-5" />,
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    iconContainer: 'bg-amber-100 text-amber-700',
  },
  diproses: {
    icon: <Wrench className="w-5 h-5" />,
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    iconContainer: 'bg-blue-100 text-blue-700',
  },
  selesai: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    iconContainer: 'bg-emerald-100 text-emerald-700',
  },
};

const CATEGORY_LABELS: Record<PublicReportStatus['category'], string> = {
  fasilitas: 'Fasilitas',
  keamanan: 'Keamanan',
  kebersihan: 'Kebersihan',
  saran: 'Saran',
};

const formatDate = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getHistoryStatusLabel = (
  status: PublicReportHistoryItem['status']
) => STATUS_LABELS[status];

export const CekLaporanModal: React.FC<CekLaporanModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [reportNumber, setReportNumber] = useState('');
  const [report, setReport] = useState<PublicReportStatus | null>(null);
  const [history, setHistory] = useState<PublicReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedReportNumber = reportNumber.trim();

    if (!normalizedReportNumber) {
      setErrorMessage('Masukkan nomor laporan terlebih dahulu.');
      setReport(null);
      setHistory([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setReport(null);
    setHistory([]);

    try {
      const [reportResult, historyResult] = await Promise.all([
        DataService.getPublicReportStatus(normalizedReportNumber),
        DataService.getPublicReportHistory(normalizedReportNumber),
      ]);

      if (!reportResult) {
        setErrorMessage(
          'Nomor laporan tidak ditemukan. Periksa kembali nomor laporan Anda.'
        );
        return;
      }

      setReport(reportResult);
      setHistory(historyResult);
    } catch (error) {
      console.error(
        '[CekLaporanModal] Gagal memeriksa laporan:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Gagal memeriksa status laporan.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReportNumber('');
    setReport(null);
    setHistory([]);
    setErrorMessage('');
    setIsLoading(false);
    onClose();
  };

  const statusStyle = report
    ? STATUS_STYLES[report.status]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">
              Cek Status Laporan
            </h3>
            <p className="text-xs text-emerald-200">
              Layanan Aspirasi & Lapor Warga · Blok H
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Search form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label
                htmlFor="report-number"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Nomor Laporan
              </label>

              <p className="text-xs text-slate-500 mb-2">
                Masukkan nomor laporan yang Anda terima setelah
                mengirim laporan.
              </p>

              <div className="flex gap-2">
                <input
                  id="report-number"
                  type="text"
                  value={reportNumber}
                  onChange={(e) => setReportNumber(e.target.value)}
                  placeholder="Contoh: LAP-H-20261006-9676"
                  className="flex-1 min-w-0 px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  autoComplete="off"
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    Cek
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* Error / not found */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />

              <p className="text-sm text-rose-800">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Result */}
          {report && statusStyle && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                      Nomor Laporan
                    </p>

                    <p className="mt-1 text-sm font-bold text-emerald-800 break-all">
                      {report.reportNumber}
                    </p>
                  </div>

                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600">
                    {CATEGORY_LABELS[report.category]}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                    Laporan
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {report.title}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[11px] text-slate-500">
                      Tanggal
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(report.date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500">
                      Pembaruan Terakhir
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(report.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current status */}
              <div
                className={`rounded-xl border p-4 ${statusStyle.container}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${statusStyle.iconContainer}`}
                  >
                    {statusStyle.icon}
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wide font-semibold opacity-70">
                      Status Saat Ini
                    </p>

                    <p className="text-sm font-bold mt-0.5">
                      {STATUS_LABELS[report.status]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {history.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3">
                    Riwayat Penanganan
                  </h4>

                  <div className="relative pl-5 space-y-4">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />

                    {history.map((item, index) => (
                      <div
                        key={`${item.createdAt}-${index}`}
                        className="relative"
                      >
                        <div className="absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white ring-1 ring-emerald-200" />

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {getHistoryStatusLabel(item.status)}
                          </p>

                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(item.createdAt)}
                          </p>

                          {item.note && (
                            <p className="text-xs text-slate-600 mt-1.5">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] leading-relaxed text-slate-500 border-t border-slate-100 pt-4">
                Informasi yang ditampilkan hanya status laporan.
                Data pribadi pelapor tidak ditampilkan untuk menjaga
                privasi warga.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};