import React from 'react';
import { TabKey } from '../types/portal';
import { Trees, MapPin, Phone, ShieldCheck, Mail } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: TabKey) => void;
  onOpenEmergency: () => void;
  onOpenReport: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenEmergency,
  onOpenReport,
}) => {
  return (
    <footer className="bg-emerald-950 text-emerald-100/90 pt-12 pb-24 md:pb-12 border-t border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-emerald-900/60">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-200">
                <Trees className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Griya Adika Narama · Blok H
              </span>
            </div>
            <p className="text-sm text-emerald-200/80 leading-relaxed max-w-md">
              Portal informasi, transparansi keuangan, dan koordinasi warga rukun tetangga Blok H.
              Mewujudkan lingkungan hunian pegunungan yang asri, guyub rukun, aman, dan modern.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-300/80 pt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>Kompleks Griya Adika Narama Blok H (Portal Warga)</span>
            </div>
          </div>

          {/* Col 2: Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Menu Warga
            </h4>
            <ul className="space-y-2 text-sm text-emerald-200/80">
              <li>
                <button
                  onClick={() => onSelectTab('beranda')}
                  className="hover:text-white transition-colors"
                >
                  Beranda Lingkungan
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('pengumuman')}
                  className="hover:text-white transition-colors"
                >
                  Pengumuman Resmi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('agenda')}
                  className="hover:text-white transition-colors"
                >
                  Jadwal Kegiatan & Ronda
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('komunitas')}
                  className="hover:text-white transition-colors"
                >
                  Komunitas Blok H
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('keuangan')}
                  className="hover:text-white transition-colors"
                >
                  Transparansi Kas & IPL
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Layanan & Akses */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Layanan Warga
            </h4>
            <ul className="space-y-2 text-sm text-emerald-200/80">
              <li>
                <button
                  onClick={onOpenReport}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aspirasi & Lapor Sarpras</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenEmergency}
                  className="hover:text-rose-300 transition-colors text-left flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  <span>Kontak Darurat & Satpam</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('admin')}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Administrasi Pengurus</span>
                </button>
              </li>
               <li>
                <a
                  href="mailto:livinginnarama@gmail.com"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>livinginnarama@gmail.com</span>
                </a>
              </li>
                            <li>
                <a
                  href="https://www.instagram.com/livinginnarama/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                  aria-label="Instagram @livinginnarama"
                >
                  <svg
                    className="w-3.5 h-3.5 text-emerald-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
                  </svg>
                  <span>@livinginnarama</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/60 gap-3">
          <p>© {new Date().getFullYear()} Paguyuban Warga Griya Adika Narama Blok H. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Kawasan Sejuk Pegunungan</span>
           </div>
        </div>
      </div>
    </footer>
  );
};
