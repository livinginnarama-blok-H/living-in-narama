-- Living In Narama: daftar publik peserta Kongsi Kematian
-- Fungsi ini hanya mengembalikan nomor rumah, tanpa data pribadi lainnya.

create or replace function public.get_public_kongsi_participants()
returns table (house_number text)
language sql
stable
security definer
set search_path = public
as $function$
  with current_household_status as (
    select h.id, h.house_number, h.is_active,
      coalesce(
        (
          select sh.kongsi_status::text
          from public.household_status_history sh
          where sh.household_id = h.id
            and sh.is_cancelled = false
            and sh.effective_from <= date_trunc('month', current_date)::date
          order by sh.effective_from desc
          limit 1
        ),
        h.kongsi_status::text,
        'belum_diverifikasi'
      ) as effective_kongsi_status
    from public.households h
  )
  select chs.house_number::text
  from current_household_status chs
  where chs.is_active is distinct from false
    and chs.effective_kongsi_status = 'terdaftar'
  order by chs.house_number;
$function$;

revoke all on function public.get_public_kongsi_participants() from public;
grant execute on function public.get_public_kongsi_participants() to anon, authenticated;
