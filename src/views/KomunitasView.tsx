import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Gamepad2,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Trophy,
  Users,
} from 'lucide-react';

import {
  CommunityAchievement,
  CommunityGroup,
} from '../types/portal';
import { DataService } from '../services/dataService';

interface KomunitasViewProps {
  isAdmin: boolean;
}

const KomunitasView: React.FC<KomunitasViewProps> = ({ isAdmin }) => {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [achievements, setAchievements] = useState<CommunityAchievement[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCommunity = async () => {
      try {
        setLoading(true);
        setError(null);

        const [communityGroups, communityAchievements] = await Promise.all([
          DataService.fetchCommunityGroups(),
          DataService.fetchCommunityAchievements(),
        ]);

        if (!mounted) return;

        setGroups(communityGroups);
        setAchievements(communityAchievements);
      } catch (err) {
        console.error('[KomunitasView] Gagal memuat data:', err);

        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat data komunitas.'
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCommunity();

    return () => {
      mounted = false;
    };
  }, []);

  const atletGroups = useMemo(
    () => groups.filter((group) => group.category === 'atlet'),
    [groups]
  );

  const gamersGroups = useMemo(
    () => groups.filter((group) => group.category === 'gamers'),
    [groups]
  );

  const openWhatsApp = (url?: string | null) => {
    if (!url) return;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const GroupCard = ({ group }: { group: CommunityGroup }) => {
    return (
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        {group.photoUrl ? (
          <img
            src={group.photoUrl}
            alt={group.name}
            className="h-52 w-full object-cover"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center bg-slate-100">
            {group.category === 'atlet' ? (
              <Users className="h-14 w-14 text-slate-300" />
            ) : (
              <Gamepad2 className="h-14 w-14 text-slate-300" />
            )}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">
              {group.name}
            </h3>

            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
              {group.category}
            </span>
          </div>

          {group.description && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {group.description}
            </p>
          )}

          {group.activityInfo && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Aktivitas
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {group.activityInfo}
              </p>
            </div>
          )}

          {group.schedule && (
            <div className="mt-4 flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Jadwal
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {group.schedule}
                </p>
              </div>
            </div>
          )}

          {group.whatsappGroupUrl && (
            <button
              type="button"
              onClick={() => openWhatsApp(group.whatsappGroupUrl)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Gabung Grup WhatsApp
            </button>
          )}
        </div>
      </article>
    );
  };

  const EmptyState = ({
    icon,
    title,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
          {icon}
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-800">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          {description}
        </p>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600">
          Komunitas Blok H
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Komunitas
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          Ruang untuk mengenal aktivitas, komunitas, dan berbagai prestasi
          warga Blok H Griya Adika Narama.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            Memuat data komunitas...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold">Data komunitas belum dapat dimuat.</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-12">
          {/* Atlet */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Atlet Blok H
                </h2>
                <p className="text-sm text-slate-500">
                  Komunitas dan aktivitas olahraga warga Blok H.
                </p>
              </div>
            </div>

            {atletGroups.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {atletGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="Belum ada komunitas atlet"
                description="Informasi komunitas atlet Blok H akan ditampilkan di sini."
              />
            )}
          </section>

          {/* Gamers */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Gamepad2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Gamers Blok H
                </h2>
                <p className="text-sm text-slate-500">
                  Komunitas gaming, kegiatan, dan jadwal mabar warga Blok H.
                </p>
              </div>
            </div>

            {gamersGroups.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {gamersGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Gamepad2 className="h-5 w-5" />}
                title="Belum ada komunitas gamers"
                description="Informasi komunitas gamers Blok H akan ditampilkan di sini."
              />
            )}
          </section>

          {/* Galeri Prestasi */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Trophy className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Galeri Prestasi
                </h2>
                <p className="text-sm text-slate-500">
                  Dokumentasi prestasi dan pencapaian warga Blok H.
                </p>
              </div>
            </div>

            {achievements.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => (
                  <article
                    key={achievement.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {achievement.photoUrl ? (
                      <img
                        src={achievement.photoUrl}
                        alt={achievement.title}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center bg-slate-100">
                        <ImageIcon className="h-14 w-14 text-slate-300" />
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900">
                        {achievement.title}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-emerald-600">
                        {achievement.recipient}
                      </p>

                      {achievement.achievementDate && (
                        <p className="mt-3 text-xs font-medium text-slate-500">
                          {new Date(
                            achievement.achievementDate
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}

                      {achievement.description && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                          {achievement.description}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Trophy className="h-5 w-5" />}
                title="Belum ada prestasi"
                description="Galeri prestasi warga Blok H akan ditampilkan di sini."
              />
            )}
          </section>
        </div>
      )}

      {isAdmin && (
        <div className="mt-10 rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Mode admin aktif. Pengelolaan komunitas akan tersedia di menu Admin.
        </div>
      )}
    </div>
  );
};

export default KomunitasView;