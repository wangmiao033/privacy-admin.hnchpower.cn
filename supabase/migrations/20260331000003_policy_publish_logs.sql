-- 隐私政策发布记录（前台发布后写入，后台管理员只读）

create table if not exists public.policy_publish_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  company_name text,
  app_name text,
  publish_url text
);

create index if not exists policy_publish_logs_created_at_idx on public.policy_publish_logs (created_at desc);

alter table public.policy_publish_logs enable row level security;

drop policy if exists "policy_publish_logs_insert_authenticated" on public.policy_publish_logs;
create policy "policy_publish_logs_insert_authenticated"
  on public.policy_publish_logs for insert
  with check (auth.uid() is not null);

drop policy if exists "policy_publish_logs_select_admin" on public.policy_publish_logs;
create policy "policy_publish_logs_select_admin"
  on public.policy_publish_logs for select
  using (public.is_admin());

grant insert on table public.policy_publish_logs to authenticated;
grant select on table public.policy_publish_logs to authenticated;

comment on table public.policy_publish_logs is '隐私政策生成/发布记录';
