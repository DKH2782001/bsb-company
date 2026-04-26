-- Đợt B (Phase 0) — Bổ sung metadata cho audit_logs:
-- * ip_address  — IP người gọi (lấy từ X-Forwarded-For)
-- * user_agent  — User-Agent header
-- * request_id  — id request (để correlate với log/Sentry sau này)
-- Tách thành migration riêng để dễ rollback nếu cần.

alter table public.audit_logs
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists request_id text;

-- Index tăng tốc cho 3 truy vấn phổ biến trên trang /audit:
-- 1. Lọc theo actor + thời gian
-- 2. Lọc theo entity + thời gian
-- 3. Lọc theo company + thời gian (mặc định mọi query)
create index if not exists audit_logs_actor_created_idx
  on public.audit_logs (company_id, actor, created_at desc);

create index if not exists audit_logs_action_created_idx
  on public.audit_logs (company_id, action, created_at desc);

create index if not exists audit_logs_company_created_idx
  on public.audit_logs (company_id, created_at desc);
