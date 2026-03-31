-- 发布成功时刻字段 + 收紧 insert：仅能为自己 user_id 写入（防伪造他人记录）

alter table public.policy_publish_logs
  add column if not exists publish_time timestamptz;

update public.policy_publish_logs
set publish_time = coalesce(publish_time, created_at)
where publish_time is null;

alter table public.policy_publish_logs
  alter column publish_time set default now();

-- 无历史脏数据时可为 NOT NULL；若仍有 null 请先清洗再执行下一行
do $$
begin
  if not exists (
    select 1 from public.policy_publish_logs where publish_time is null
  ) then
    alter table public.policy_publish_logs
      alter column publish_time set not null;
  end if;
end $$;

drop policy if exists "policy_publish_logs_insert_authenticated" on public.policy_publish_logs;
drop policy if exists "policy_publish_logs_insert_own_user" on public.policy_publish_logs;

create policy "policy_publish_logs_insert_own_user"
  on public.policy_publish_logs for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

comment on column public.policy_publish_logs.publish_time is '业务发布成功时间；列表优先展示，缺省与 created_at 一致';
