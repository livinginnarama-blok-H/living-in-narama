import { useEffect, useMemo, useState } from 'react';
import { DataService } from '../services/dataService';
import type { OrganizationMember } from '../types/portal';
import { Users } from 'lucide-react';

type OrgNodeProps = {
  member: OrganizationMember;
  children: OrganizationMember[];
  membersByParent: Map<string, OrganizationMember[]>;
  level?: number;
};

function MemberCard({
  member,
  compact = false,
}: {
  member: OrganizationMember;
  compact?: boolean;
}) {
  return (
    <article
      className={`relative w-full rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md ${
        compact ? 'max-w-[260px] p-4' : 'max-w-[320px] p-5'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`shrink-0 overflow-hidden rounded-full border-2 border-emerald-100 bg-emerald-50 ${
            compact ? 'h-16 w-16' : 'h-20 w-20'
          }`}
        >
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={`Foto ${member.name}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-emerald-700">
              <Users className={compact ? 'h-7 w-7' : 'h-8 w-8'} />
            </div>
          )}
        </div>

        <div className="min-w-0 text-left">
          <h2
            className={`font-bold leading-tight text-slate-900 ${
              compact ? 'text-sm' : 'text-base'
            }`}
          >
            {member.name}
          </h2>

          <p
            className={`mt-1 font-semibold text-emerald-700 ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            {member.position}
          </p>

          {member.division && (
            <p className="mt-1 text-xs text-slate-500">
              {member.division}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function OrgNode({
  member,
  children,
  membersByParent,
}: OrgNodeProps) {
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <MemberCard member={member} />

      {hasChildren && (
        <>
          <div className="h-8 w-px bg-emerald-200" />

          <div className="relative flex w-full justify-center">
            {children.length > 1 && (
              <div className="absolute left-[calc(50%/var(--child-count))] right-[calc(50%/var(--child-count))] top-0 hidden h-px bg-emerald-200 md:block" />
            )}

            <div
              className={`flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center ${
                children.length > 1 ? 'md:gap-8' : ''
              }`}
            >
              {children.map((child) => {
                const grandchildren = membersByParent.get(child.id) ?? [];

                return (
                  <div
                    key={child.id}
                    className="relative flex w-full flex-col items-center md:w-auto"
                  >
                    <div className="hidden h-6 w-px bg-emerald-200 md:block" />

                    <MemberCard member={child} compact />

                    {grandchildren.length > 0 && (
                      <>
                        <div className="h-6 w-px bg-emerald-200" />

                        <div className="flex flex-wrap justify-center gap-4">
                          {grandchildren.map((grandchild) => (
                            <MemberCard
                              key={grandchild.id}
                              member={grandchild}
                              compact
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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

        const data = await DataService.fetchOrganizationMembers();

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

  const membersByParent = useMemo(() => {
    const map = new Map<string, OrganizationMember[]>();

    members.forEach((member) => {
      if (!member.parentId) {
        return;
      }

      const current = map.get(member.parentId) ?? [];
      current.push(member);
      map.set(member.parentId, current);
    });

    map.forEach((items) => {
      items.sort((a, b) => a.displayOrder - b.displayOrder);
    });

    return map;
  }, [members]);

  const rootMembers = useMemo(() => {
    return members
      .filter((member) => !member.parentId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
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
      {/* Header */}
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

      {/* Organization Chart */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[760px] rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/60 via-white to-white px-6 py-10 shadow-sm">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Struktur Organisasi
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Kepengurusan Blok H Griya Adika Narama
            </p>
          </div>

          <div className="flex justify-center">
            {rootMembers.map((root) => (
              <OrgNode
                key={root.id}
                member={root}
                children={membersByParent.get(root.id) ?? []}
                membersByParent={membersByParent}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Profile List */}
      <div className="mt-10">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Profil Pengurus
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Daftar pengurus aktif periode 2026–2029.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((member) => (
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