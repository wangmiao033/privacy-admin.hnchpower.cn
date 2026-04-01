-- 日报任务日志：防重复发送、审计；由服务端 service_role 读写，默认 RLS 无策略即拒绝 anon/authenticated

create table if not exists public.daily_report_job_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  report_date date not null,
  kind text not null default 'daily',
  status text not null,
  detail text
);

create index if not exists daily_report_job_log_report_date_idx
  on public.daily_report_job_log (report_date desc);

create index if not exists daily_report_job_log_created_at_idx
  on public.daily_report_job_log (created_at desc);

alter table public.daily_report_job_log enable row level security;

comment on table public.daily_report_job_log is '日报发送记录；保留期由后台 JOB_LOG_RETENTION_DAYS 清理，建议 90 天';
