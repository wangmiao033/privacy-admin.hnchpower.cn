-- 页面访问日志（前台埋点写入，后台仅管理员只读）

create table if not exists public.page_visit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text not null,
  url text,
  page_type text,
  referrer text,
  user_agent text,
  ip_hash text,
  ip_masked text,
  country text,
  region text,
  city text,
  visitor_key text,
  session_id text,
  user_id uuid references auth.users (id) on delete set null,
  is_logged_in boolean not null default false
);

create index if not exists page_visit_logs_created_at_idx on public.page_visit_logs (created_at desc);
create index if not exists page_visit_logs_path_idx on public.page_visit_logs (path);
create index if not exists page_visit_logs_visitor_key_idx on public.page_visit_logs (visitor_key);
create index if not exists page_visit_logs_user_id_idx on public.page_visit_logs (user_id);

alter table public.page_visit_logs enable row level security;

-- 匿名与登录用户均可上报访问（前台使用 anon key + 可选 JWT）
drop policy if exists "page_visit_logs_insert_public" on public.page_visit_logs;
create policy "page_visit_logs_insert_public"
  on public.page_visit_logs for insert
  with check (true);

drop policy if exists "page_visit_logs_select_admin" on public.page_visit_logs;
create policy "page_visit_logs_select_admin"
  on public.page_visit_logs for select
  using (public.is_admin());

grant insert on table public.page_visit_logs to anon, authenticated;
grant select on table public.page_visit_logs to authenticated;

comment on table public.page_visit_logs is '页面 PV 日志；列表展示 ip_masked，勿存明文完整 IP 到可读列';
