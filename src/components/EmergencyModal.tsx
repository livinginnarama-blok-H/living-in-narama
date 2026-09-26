import React from 'react';
import { X, Phone, ShieldAlert, Ambulance, Flame, Zap, MessageSquare, AlertTriangle } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const contacts = [
    {
      title: 'Pos Keamanan Lingkungan (Contoh)',
      name: 'Petugas Jaga [Data Demo]',
      phone: '08xxxxxxxxxx',
      desc: 'Standby di Pos Jaga Lingkungan Blok H (Data Contoh)',
      icon: ShieldAlert,
      badge: 'Demo',
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
    {
      title: 'Koordinator / Pengurus Paguyuban (Contoh)',
      name: 'Bpk. Contoh 01 [Pengurus Demo]',
      phone: '08xxxxxxxxxx',
      desc: 'Koordinasi perizinan dan ketertiban lingkungan (Data Contoh)',
      icon: ShieldAlert,
      badge: 'Demo',
      color: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    {
      title: 'Fasilitas Layanan Medis Terdekat (Contoh)',
      name: 'Layanan Ambulans / Puskesmas Terdekat [Demo]',
      phone: '119 / 08xxxxxxxxxx',
      desc: 'Penanganan gawat darurat medis warga (Data Contoh)',
      icon: Ambulance,
      badge: 'Medis',
      color: 'bg-rose-50 text-rose-900 border-rose-200',
    },
    {
      title: 'Pemadam Kebakaran (Damkar Publik)',
      name: 'Pos Pemadam Kebakaran Wilayah',
      phone: '113',
      desc: 'Layanan darurat kebakaran dan evakuasi kedaruratan umum',
      icon: Flame,
      badge: 'Publik',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    {
      title: 'Layanan Darurat Gangguan Listrik PLN',
      name: 'Call Center Layanan Gangguan PLN',
      phone: '123',
      desc: 'Penanganan gangguan jaringan listrik dan kabel darurat',
      icon: Zap,
      badge: 'PLN',
      color: 'bg-slate-50 text-slate-900 border-slate-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-800 flex items-center justify-center">
              <Phone className="w-4 h-4 text-rose-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Kontak Penting & Darurat</h3>
                <span className="text-[10px] bg-rose-800 text-rose-200 font-semibold px-2 py-0.5 rounded">
                  DATA DEMO
                </span>
              </div>
              <p className="text-xs text-rose-200">Griya Adika Narama Blok H</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of contacts */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {/* Demo Notice Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Pemberitahuan Demo:</strong> Nomor kontak personal berformat <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">08xxxxxxxxxx</code> merupakan data simulasi untuk keperluan prototipe portal. Kontak resmi pengurus dan satpam akan diperbarui saat situs resmi diluncurkan.
            </p>
          </div>

          {contacts.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl border ${c.color} transition-all`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-0.5">{c.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{c.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-slate-800">{c.phone}</span>
                  <div className="flex items-center gap-1.5">
                    {c.phone.startsWith('08') ? (
                      <span className="text-[11px] text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded">
                        Simulasi Demo
                      </span>
                    ) : (
                      <a
                        href={`tel:${c.phone}`}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-md flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Panggil Darurat</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
};
