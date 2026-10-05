import { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import type { EmergencyContact } from '../types/portal';
import React from 'react';
import {
  X,
  Phone,
  ShieldAlert,
  Ambulance,
  Flame,
  Zap,
  Users,
} from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const getEmergencyIcon = (iconName: string) => {
  switch (iconName) {
    case 'Ambulance':
      return Ambulance;
    case 'Flame':
      return Flame;
    case 'Zap':
      return Zap;
    case 'Users':
      return Users;
    case 'ShieldAlert':
    default:
      return ShieldAlert;
  }
};
export const EmergencyModal: React.FC<EmergencyModalProps> = ({

  isOpen,
  onClose,
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadContacts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await DataService.fetchEmergencyContacts();

        if (!cancelled) {
          setContacts(data.filter((contact) => contact.isActive));
        }
      } catch (err) {
        console.error('[EmergencyModal] Gagal memuat kontak darurat:', err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat kontak darurat'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadContacts();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);
  if (!isOpen) {
    return null;
  }

  

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-rose-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-800">
              <Phone className="h-4 w-4 text-rose-200" />
            </div>

            <div>
              <h3
                id="emergency-modal-title"
                className="text-base font-bold"
              >
                Kontak Penting & Darurat
              </h3>

              <p className="mt-0.5 text-xs text-rose-200">
                Griya Adika Narama Blok H
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-rose-200 transition-colors hover:bg-rose-800 hover:text-white"
            aria-label="Tutup kontak darurat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informasi */}
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-xs leading-relaxed text-slate-600">
            Gunakan kontak berikut sesuai dengan kebutuhan.
            Untuk kondisi yang mengancam keselamatan jiwa,
            segera hubungi layanan darurat publik.
          </p>
        </div>

        {/* Daftar Kontak */}
        <div className="space-y-3 overflow-y-auto p-4 sm:p-5">
          {contacts.map((contact) => {
            const Icon = getEmergencyIcon(contact.icon);
            const isAvailable = contact.phone !== '';

            return (
              <div
                key={contact.title}
                className={
                  'rounded-xl border p-3.5 transition-all hover:shadow-sm ' +
                  contact.color
                }
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {contact.title}
                      </h4>

                      <span className="rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        {contact.badge}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {contact.name}
                    </p>

                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {contact.description}
                    </p>
                  </div>
                </div>

                {/* Nomor Telepon */}
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/5 pt-2.5">
                  {isAvailable ? (
                    <span className="font-mono text-sm font-bold text-slate-800">
                      {contact.phone}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500">
                      Nomor kontak belum diperbarui
                    </span>
                  )}

                  {isAvailable && (
                    <a
                      href={'tel:' + contact.phone}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-900"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Telepon</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};