-- 管理员只读统计 RPC（内部校验 is_admin）

create or replace function public.admin_visit_counts(p_from timestamptz, p_to timestamptz)
returns table(pv bigint, uv bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return query
  select
    count(*)::bigint,
    count(distinct coalesce(visitor_key, id::text))::bigint
  from public.page_visit_logs
  where created_at >= p_from and created_at < p_to;
end;
$$;

grant execute on function public.admin_visit_counts(timestamptz, timestamptz) to authenticated;

create or replace function public.admin_top_paths(p_from timestamptz, p_limit int default 30)
returns table(path text, cnt bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return query
  select p.path, count(*)::bigint as cnt
  from public.page_visit_logs p
  where p.created_at >= p_from
  group by p.path
  order by cnt desc
  limit p_limit;
end;
$$;

grant execute on function public.admin_top_paths(timestamptz, int) to authenticated;

create or replace function public.admin_visit_daily_series(p_days int default 7)
returns table(day date, pv bigint, uv bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  d0 date := (current_timestamp at time zone 'UTC')::date;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return query
  with days as (
    select (d0 - (p_days - 1 - k))::date as d
    from generate_series(0, greatest(p_days, 1) - 1) as t(k)
  )
  select
    days.d as day,
    coalesce(v.pv, 0)::bigint,
    coalesce(v.uv, 0)::bigint
  from days
  left join lateral (
    select
      count(*)::bigint as pv,
      count(distinct coalesce(l.visitor_key, l.id::text))::bigint as uv
    from public.page_visit_logs l
    where l.created_at >= (days.d::timestamp at time zone 'UTC')
      and l.created_at < ((days.d + 1)::timestamp at time zone 'UTC')
  ) v on true
  order by days.d;
end;
$$;

grant execute on function public.admin_visit_daily_series(int) to authenticated;
