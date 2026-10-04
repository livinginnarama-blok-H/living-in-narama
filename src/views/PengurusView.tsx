import { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { DataService } from '../services/dataService';
import type { OrganizationMember } from '../types/portal';

function MemberCard({
  member,
  compact = false,
}: {
  member?: OrganizationMember;
  compact?: boolean;
}) {
  if (!member) {
    return (
      <div className="flex h-[180px] w-[210px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
        <div>
          <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-xs text-slate-400">
            Data belum tersedia
          </p>
        </div>
      </div>
    );
  }

  /*
   * CARD UNTUK BAGAN ORGANISASI
   */
  if (compact) {
    return (
      <article className="flex w-[210px] shrink-0 flex-col items-center rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">
        <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-100 bg-emerald-50">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={`Foto ${member.name}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-emerald-700">
              <Users className="h-8 w-8" />
            </div>
          )}
        </div>

        <h3 className="mt-4 text-sm font-bold leading-tight text-slate-900">
          {member.name}
        </h3>

        <p className="mt-1 text-xs font-semibold leading-snug text-emerald-700">
          {member.position}
        </p>

        {member.division && (
          <p className="mt-1 text-xs text-slate-500">
            {member.division}
          </p>
        )}
      </article>
    );
  }

  /*
   * CARD PROFIL LENGKAP
   */
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      {/* Foto */}
      <div className="flex justify-center bg-gradient-to-b from-emerald-50 to-white px-5 pt-7 pb-5">
        <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-emerald-50 shadow-md ring-1 ring-emerald-100">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={`Foto ${member.name}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-emerald-700">
              <Users className="h-12 w-12" />
            </div>
          )}
        </div>
      </div>

      {/* Identitas */}
      <div className="flex flex-1 flex-col px-5 pb-6 text-center">
        <h3 className="text-lg font-bold leading-tight text-slate-900">
          {member.name}
        </h3>

        <p className="mt-2 text-sm font-semibold leading-snug text-emerald-700">
          {member.position}
        </p>

        {member.division && (
          <p className="mt-1 text-xs font-medium text-slate-500">
            {member.division}
          </p>
        )}

        {/* Garis pemisah */}
        {(member.responsibilities || member.bio) && (
          <div className="my-5 h-px bg-slate-100" />
        )}

        {/* Tanggung Jawab */}
        {member.responsibilities && (
          <div className="text-left">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              Tanggung Jawab
            </p>

            <p className="text-sm leading-relaxed text-slate-600">
              {member.responsibilities}
            </p>
          </div>
        )}

        {/* Bio */}
        {member.bio && (
          <div className="mt-4 text-left">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              Tentang
            </p>

            <p className="text-sm leading-relaxed text-slate-600">
              {member.bio}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function VerticalLine({
  height = 'h-6',
}: {
  height?: string;
}) {
  return (
    <div
      className={`w-px shrink-0 bg-emerald-200 ${height}`}
    />
  );
}

function DepartmentColumn({
  coordinator,
  deputy,
}: {
  coordinator?: OrganizationMember;
  deputy?: OrganizationMember;
}) {
  return (
    <div className="flex w-[210px] shrink-0 flex-col items-center">
      <MemberCard member={coordinator} compact />

      {deputy && (
        <>
          <VerticalLine />
          <MemberCard member={deputy} compact />
        </>
      )}
    </div>
  );
}

function KarangTarunaColumn({
  coordinator,
  deputy1,
  deputy2,
}: {
  coordinator?: OrganizationMember;
  deputy1?: OrganizationMember;
  deputy2?: OrganizationMember;
}) {
  return (
    <div className="flex w-[210px] shrink-0 flex-col items-center">
      <MemberCard member={coordinator} compact />

      {deputy1 && (
        <>
          <VerticalLine />
          <MemberCard member={deputy1} compact />
        </>
      )}

      {deputy2 && (
        <>
          <VerticalLine />
          <MemberCard member={deputy2} compact />
        </>
      )}
    </div>
  );
}

export default function PengurusView() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await DataService.fetchOrganizationMembers();

        if (mounted) {
          setMembers(data);
        }
      } catch (err) {
        console.error(
          '[PengurusView] Failed to load organization members:',
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat data pengurus.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Posisi bagan ditentukan berdasarkan jabatan.
   * parentId dan displayOrder tidak digunakan untuk layout.
   */
  const organization = useMemo(() => {
    const normalize = (value: string) => {
      return value
        .toLowerCase()
        .replace(/&/g, 'dan')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const find = (...positions: string[]) => {
      const wanted = positions.map(normalize);

      return members.find((member) => {
        return wanted.includes(normalize(member.position));
      });
    };

    return {
      chairman: find('Ketua Koordinator'),

      viceChairman: find(
        'Wakil Ketua Koordinator',
        'Wakil Ketua'
      ),

      secretary: find('Sekretaris'),

      viceSecretary: find(
        'Wakil Sekretaris',
        'Wakil Keretatis'
      ),

      treasurer: find('Bendahara'),

      viceTreasurer: find('Wakil Bendahara'),

      social: find(
        'Koordinator Sosial & Lingkungan',
        'Koordinator Sosial dan Lingkungan'
      ),

      viceSocial: find(
        'Wakil Sosial & Lingkungan',
        'Wakil Sosial dan Lingkungan'
      ),

      youth: find('Koordinator Karang Taruna'),

      viceYouth1: find(
        'Wakil Karang Taruna I',
        'Wakil Karang Taruna 1'
      ),

      viceYouth2: find(
        'Wakil Karang Taruna II',
        'Wakil Karang Taruna 2'
      ),

      advisor: find(
        'Penasehat',
        'Penasihat'
      ),
    };
  }, [members]);

  const profileMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      return a.displayOrder - b.displayOrder;
    });
  }, [members]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />

          <p className="text-sm text-slate-500">
            Memuat struktur pengurus...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Users className="mx-auto mb-4 h-10 w-10 text-slate-300" />

          <h2 className="font-semibold text-slate-800">
            Data pengurus belum tersedia
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Data struktur pengurus belum tersedia di sistem.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      {/* HEADER */}
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Griya Adika Narama · Blok H
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Profil & Struktur Pengurus
        </h1>

        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-emerald-600" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Periode 2026–2029
        </p>
      </div>

      {/* BAGAN ORGANISASI */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[980px] rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/70 via-white to-white px-6 py-10 shadow-sm">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Struktur Organisasi
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Kepengurusan Blok H Griya Adika Narama
            </p>
          </div>

          {/* KETUA */}
          <div className="flex flex-col items-center">
            <MemberCard
              member={organization.chairman}
            />

            <VerticalLine height="h-7" />

            <MemberCard
              member={organization.viceChairman}
              compact
            />
          </div>

          {/* GARIS PEMISAH */}
          <div className="mx-auto my-10 h-px w-[900px] bg-emerald-200" />

          {/* EMPAT BIDANG */}
          <div className="mx-auto flex w-[900px] items-start justify-between gap-5">
            <DepartmentColumn
              coordinator={organization.secretary}
              deputy={organization.viceSecretary}
            />

            <DepartmentColumn
              coordinator={organization.treasurer}
              deputy={organization.viceTreasurer}
            />

            <DepartmentColumn
              coordinator={organization.social}
              deputy={organization.viceSocial}
            />

            <KarangTarunaColumn
              coordinator={organization.youth}
              deputy1={organization.viceYouth1}
              deputy2={organization.viceYouth2}
            />
          </div>

          {/* PENASEHAT TERPISAH */}
          <div className="mt-16 border-t border-dashed border-slate-200 pt-10">
            <div className="mb-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Unsur Pendamping
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Penasehat
              </p>
            </div>

            <div className="flex justify-center">
              <MemberCard
                member={organization.advisor}
                compact
              />
            </div>
          </div>
        </div>
      </div>

      {/* PROFIL PENGURUS */}
      <div className="mt-12">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
            Profil
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Profil Pengurus
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Daftar pengurus aktif periode 2026–2029.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {profileMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
            />
          ))}
        </div>
      </div>
    </section>
  );
}