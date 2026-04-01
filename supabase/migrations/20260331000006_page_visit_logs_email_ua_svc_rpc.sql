-- 与前台埋点字段对齐 + 仅供 service_role 调用的统计 RPC（后台服务端读取，不依赖管理员 JWT）

alter table public.page_visit_logs add column if not exists email text;
alter table public.page_visit_logs add column if not exists ua text;

comment on column public.page_visit_logs.email is '埋点可选：当前用户邮箱快照';
comment on column public.page_visit_logs.ua is '埋点可选：User-Agent，与 user_agent 二选一或并存';

-- 统计 RPC：无 is_admin() 校验，禁止暴露给 anon/authenticated，仅 service_role 执行
create or replace function public.admin_visit_counts_svc(p_from timestamptz, p_to timestamptz)
returns table(pv bigint, uv bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*)::bigint,
    count(distinct coalesce(visitor_key, id::text))::bigint
  from public.page_visit_logs
  where created_at >= p_from and created_at < p_to;
$$;

create or replace function public.admin_top_paths_svc(p_from timestamptz, p_limit int default 30)
returns table(path text, cnt bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.path, count(*)::bigint as cnt
  from public.page_visit_logs p
  where p.created_at >= p_from
  group by p.path
  order by cnt desc
  limit p_limit;
$$;

create or replace function public.admin_visit_daily_series_svc(p_days int default 7)
returns table(day date, pv bigint, uv bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  d0 date := (current_timestamp at time zone 'UTC')::date;
begin
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

revoke all on function public.admin_visit_counts_svc(timestamptz, timestamptz) from public;
revoke all on function public.admin_top_paths_svc(timestamptz, int) from public;
revoke all on function public.admin_visit_daily_series_svc(int) from public;

grant execute on function public.admin_visit_counts_svc(timestamptz, timestamptz) to service_role;
grant execute on function public.admin_top_paths_svc(timestamptz, int) to service_role;
grant execute on function public.admin_visit_daily_series_svc(int) to service_role;
