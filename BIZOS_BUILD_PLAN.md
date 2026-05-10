# 📘 KẾ HOẠCH BUILD HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP

> **Đối tượng:** SME 10-50 người tại Việt Nam
> **Nền tảng kế thừa:** BIZOS Company OS (Next.js 16 + Supabase)
> **Tài liệu này gồm:** Định hướng sản phẩm · Phân tích gap · Lộ trình 6 phase · Kiến trúc kỹ thuật · Tính năng nâng cao · Khuyến nghị go-to-market

---

## 🎯 PHẦN 1 — ĐỊNH HƯỚNG SẢN PHẨM

### 1.1. Triết lý thiết kế

Với SME 10-50 người, **đừng cố làm SAP**. SME ghét phần mềm nặng nề. Triết lý nên là:

1. **"30 giây hiểu, 3 phút làm xong"** — mỗi tác vụ phổ biến (chấm công, duyệt nghỉ phép, tạo task) phải xong trong vài click.
2. **Mobile-first cho người dùng cuối, desktop-first cho admin** — nhân viên dùng điện thoại để chấm công/xin nghỉ, HR/CEO dùng máy tính để xem báo cáo.
3. **Tự động hóa thay vì form-driven** — thay vì bắt user nhập 20 trường, hãy tự suy luận từ data sẵn có.
4. **Một sản phẩm — nhiều persona** — CEO, HR, Kế toán, Trưởng phòng, Nhân viên đều dùng chung một app, mỗi người thấy những gì họ cần.
5. **Tuân thủ luật VN ra-of-the-box** — thuế TNCN, BHXH, hợp đồng lao động, hóa đơn điện tử.

### 1.2. Personas chính

| Persona | Tỷ lệ truy cập | Nhu cầu cốt lõi |
|---|---|---|
| **Nhân viên** | 80% lượng truy cập (chủ yếu mobile) | Chấm công, xin nghỉ, xem lương, làm task, xem KPI cá nhân |
| **Trưởng phòng** | 10% | Duyệt nghỉ phép/OT, giao task, xem KPI team, đánh giá nhân viên |
| **HR Admin** | 5% | Quản lý hồ sơ, hợp đồng, payroll, tuyển dụng, onboarding |
| **Kế toán** | 3% | Hóa đơn, công nợ, báo cáo thuế, sao kê ngân hàng |
| **CEO/Founder** | 2% | Dashboard, KPI cascade, P&L, forecast, duyệt cấp cao |

### 1.3. Định vị so với đối thủ

Thị trường VN hiện có:
- **Base.vn** — mạnh HRM, payroll, tuyển dụng, nhưng giá cao và rời rạc nhiều module.
- **MISA AMIS** — mạnh kế toán, mỏng HRM/operations.
- **Tanca** — chấm công GPS tốt, hạn chế phần khác.
- **Fastwork, 1Office** — tổng hợp nhưng UX cũ.
- **Nhân tế Bizfly** — tập trung CRM.

**Khoảng trống:** Một sản phẩm "all-in-one" cho SME 10-50 người với UX hiện đại, mobile-first, có tích hợp AI assistant, giá rẻ hơn enterprise tools. Đây là chỗ bạn có thể chen vào.


---

## 🔍 PHẦN 2 — PHÂN TÍCH GAP TRÊN BIZOS HIỆN TẠI

BIZOS đã có nền tốt nhưng vẫn ở mức "demo-grade". Dưới đây là tóm tắt cô đọng:

### 2.1. ✅ Đã có (nền tảng tốt)

- 19 màn hình UI scaffold, mockup đẹp
- 66 bảng Postgres + RLS cho 7 role
- KPI cascade engine (formula AST evaluator)
- Compensation rule engine (5-tier threshold + multiplier)
- P&L / BS / Cashflow scaffold
- Forecast simulator (what-if slider)
- i18n VI/EN cơ bản
- Demo mode chạy không cần Supabase

### 2.2. ❌ Thiếu — phải có (must-have cho SME VN)

| # | Module | Mức độ thiếu | Lý do bắt buộc |
|---|---|---|---|
| 1 | **Chấm công & Nghỉ phép** | Thiếu hoàn toàn | SME nào cũng cần — không có là không bán được |
| 2 | **Payroll VN (TNCN + BHXH)** | Có engine, thiếu phần luật VN | Luật bắt buộc, sai là phạt |
| 3 | **Hợp đồng & Hồ sơ pháp lý** | Thiếu hoàn toàn | Bắt buộc theo Bộ luật Lao động |
| 4 | **Onboarding/Offboarding** | Thiếu | HR thật sự dùng hằng ngày |
| 5 | **CRUD đầy đủ + bulk import** | Chỉ có Create | Foundation kỹ thuật |
| 6 | **File upload (Supabase Storage)** | Có config, chưa dùng | Cần cho mọi module |
| 7 | **Notifications realtime + email** | Schema có, UI thiếu | UX cơ bản |
| 8 | **2FA + Session management** | Thiếu | Bảo mật cơ bản |
| 9 | **Audit log thực sự** | Bảng có, chưa log | Tuân thủ + truy vết |
| 10 | **Mobile responsive / PWA** | Hạn chế | 80% user dùng mobile |

### 2.3. ⚡ Nên có (nâng cao trải nghiệm)

| # | Module | Lợi ích |
|---|---|---|
| 11 | **CRM lite** | Mở rộng từ HRM → Business OS thật |
| 12 | **Hóa đơn điện tử (e-invoice)** | Bắt buộc với DN có doanh thu |
| 13 | **Quản lý mua hàng & kho** | DN sản xuất/thương mại cần |
| 14 | **Performance Review 360°** | Văn hóa hiện đại |
| 15 | **AI Assistant nội bộ** | Khác biệt cạnh tranh |
| 16 | **Anomaly detection trên KPI** | CEO thích |
| 17 | **Mobile app (React Native/Expo)** | Trải nghiệm chấm công tốt hơn web |


---

## 🛣️ PHẦN 3 — LỘ TRÌNH 6 PHASE (12 tháng)

### Tổng quan timeline

```
Phase 0: Foundation hardening      → Tháng 1        (4 tuần)
Phase 1: HRM Core (chấm công)      → Tháng 2-3      (8 tuần)
Phase 2: Payroll VN                → Tháng 4        (4 tuần)
Phase 3: Operations & Performance  → Tháng 5-6      (8 tuần)
Phase 4: Finance & Accounting VN   → Tháng 7-8      (8 tuần)
Phase 5: CRM & Sales               → Tháng 9-10     (8 tuần)
Phase 6: AI, Mobile & Polish       → Tháng 11-12    (8 tuần)
```

> **Khuyến nghị:** Đừng cố làm hết một lúc. Bán được Phase 0+1+2 đã có thể có khách hàng đầu tiên. Mỗi phase nên ship được, có khách dùng, lấy feedback rồi mới làm phase tiếp.

---

### 📍 PHASE 0 — Foundation Hardening (Tháng 1)

**Mục tiêu:** Biến BIZOS từ demo-grade thành production-grade trước khi build tính năng mới.

> **Tiến độ thực thi:**
> - [x] **Đợt A** — Form primitives (RHF+Zod) + CRUD Update/Delete cho **Employees & Departments** ✅
> - [x] **Đợt A2** — CRUD Update/Delete cho **KPIs, Projects, Job Requisitions, SOPs, Accounting Entries** ✅
> - [x] **Đợt B** — Audit metadata (IP/UA/request_id) + UI Audit log đọc data thật + filter multi-select + pagination + export CSV ✅
> - [x] **Đợt C** — Notifications Realtime + Notification Center trong Topbar (email hoãn vô thời hạn theo yêu cầu) ✅
> - [x] **Đợt D** — Storage buckets + Upload UI (migration + local bucket config + Profile upload UI) ✅
>   - Cần cung cấp khi chạy thật: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, rồi apply migration `20260426133000_storage_buckets.sql`.
> - [x] **Đợt E** — Bulk Import/Export với SheetJS (Employees / KPIs / Accounting Entries / Requisitions). Operations bị Phase 0 loại trừ ✅
> - [x] **Đợt F** — Vitest + GitHub Actions CI (lint + typecheck + test) ✅
>   - Cần cung cấp khi bật observability: `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
> - [x] Đợt G — Auth/MFA/Session/Reset password/Rate limit ✅ (đầy đủ scaffold; chờ Supabase Auth thật để test end-to-end)
>   - **MFA TOTP**: `ProfileMfaPanel` enroll → challenge → verify → unenroll qua `supabase.auth.mfa.*`
>   - **Reset password**: `sendReset` → email link → `/update-password` page với `UpdatePasswordForm`
>   - **Đổi mật khẩu**: `changePasswordAction` server-side với rate limit (5/15 phút) + reauth bằng `signInWithPassword(currentPassword)` + `signOut({scope:"others"})` sau khi đổi
>   - **Session management**: list device + `signOutOtherSessionsAction`
>   - **Rate limit** áp cho login (8/5 phút), signup (5/10 phút), reset (3/15 phút), change-password (5/15 phút)
>   - **Phụ trợ**: `SecurityQuestionsDialog`, `RecoveryMethodsDialog`, `RolesManageDialog`, `IntegrationsManageDialog`
>   - Cần cung cấp khi chạy thật: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`; bật Email Auth, thêm redirect URL `/update-password`, bật MFA TOTP và cấu hình SMTP/email provider.
> - [~] ~~Đợt H — Mobile responsive + bottom nav + PWA~~ — **BỎ** (không làm mobile app)
>
> **Loại trừ:** Module Operations (`/operations`, `lib/repositories/operations.ts`, các bảng `tasks*`) — không động vào trong Phase 0.

#### 0.1. CRUD đầy đủ + Form thực
- [x] **Form primitives RHF + Zod**: `lib/validation/schemas.ts`, `lib/actions/result.ts`, `components/ui/{toast,dialog,confirm-dialog,form-field}.tsx`, Toaster mount ở `app/layout.tsx`.
- [x] **Employees**: Create/Edit qua dialog (RHF + Zod), Soft-delete (set `status=terminated`), Confirm dialog. Action: `upsertEmployeeAction`, `deleteEmployeeAction`.
- [x] **Departments**: Create/Edit qua dialog, Hard-delete (chặn nếu còn nhân sự), Confirm dialog. Action: `upsertDepartmentAction`, `deleteDepartmentAction`.
- [x] Loading state (isSubmitting disable button), error state (server error banner + field errors map từ Zod), toast success/fail.
- [x] **KPIs**: Edit dialog 11 trường (level, đơn vị, owner, weight, parent, active...), soft-delete (`active=false`), chặn xoá nếu còn KPI con. Action: `upsertKpiAction`, `deleteKpiAction`.
- [x] **Projects**: Edit dialog 8 trường + status enum, soft-delete (`status=cancelled`). Action: `upsertProjectAction`, `deleteProjectAction`.
- [x] **Job Requisitions**: Edit dialog + cancel (set `status=cancelled, closed_at=now`). Action: `upsertRequisitionAction`, `deleteRequisitionAction`.
- [x] **SOPs**: Edit dialog (textarea body, auto-bump version mỗi lần edit), hard delete. Action: `upsertSopAction`, `deleteSopAction`.
- [x] **Accounting Entries**: Inline manager (table với Edit/Delete inline), validate ít nhất 1 vế (debit hoặc credit > 0). Action: `upsertAccountingEntryAction`, `deleteAccountingEntryAction`.
- [ ] Optimistic UI (đang dùng `router.refresh()` — đủ cho hiện tại; có thể nâng `useOptimistic` ở đợt sau nếu cần).

#### 0.2. Bulk Import / Export
- Import từ Excel/CSV cho: nhân viên, KPI, task, hợp đồng, accounting entries
- Sử dụng SheetJS phía client để parse → preview → confirm → server insert
- Export PDF/Excel cho mọi báo cáo
- Dùng bảng `import_jobs` đã có để track tiến trình

#### 0.3. Auth & Security
- **2FA bằng TOTP** (Google Authenticator) — dùng Supabase Auth MFA
- **Session management UI** — list device đang đăng nhập, revoke session
- **Password policy** — độ mạnh, lịch sử password
- **Reset password flow** hoàn chỉnh (link qua email, expire 15 phút)
- **Rate limiting** Server Actions (chống brute force)

#### 0.4. Audit Log thực sự
- Middleware tự động ghi log mọi mutation (insert/update/delete) vào `audit_logs`
- Lưu: who, what, when, before, after, IP, user-agent
- UI Audit log hiện tại chỉ là demo — phải hiển thị data thật từ DB
- Filter theo user/entity/khoảng thời gian
- Export PDF cho kiểm toán

#### 0.5. Notifications Realtime + Email
- Dùng **Supabase Realtime** subscribe vào bảng `notifications`
- Toast notification khi có sự kiện (task mới, duyệt nghỉ, ...)
- Notification center (dropdown trên topbar) với mark-as-read
- Email transactional qua **Resend.com** hoặc **AWS SES**
- Template email VN (SMTP fallback)

#### 0.6. File Upload & Document Management
- Cấu hình Supabase Storage buckets:
  - `avatars` (public)
  - `documents` (private — RLS)
  - `payslips` (private — chỉ owner + HR)
  - `contracts` (private — chỉ HR + owner)
- Upload UI với drag-drop, progress bar, preview ảnh
- Virus scan optional (ClamAV qua Edge Function)

#### 0.7. Testing & Quality Foundation
- **Vitest** cho unit test (rule engines, utils)
- **Playwright** cho E2E (login, tạo employee, chấm công)
- **Sentry** cho error tracking
- **PostHog** hoặc **Plausible** cho analytics
- GitHub Actions CI: lint + typecheck + test trên mỗi PR

#### 0.8. Mobile Responsive
- Audit toàn bộ 19 trang trên iPhone SE (375px) và Galaxy A (360px)
- Sidebar → bottom nav trên mobile
- Touch-friendly (44px tap target)
- PWA manifest + service worker (offline cho chấm công)

**Deliverable Phase 0:** BIZOS chạy production thật, có thể onboard 1 khách hàng pilot.


---

### 📍 PHASE 1 — HRM Core: Chấm công & Nghỉ phép (Tháng 2-3)

**Mục tiêu:** Build module HRM cốt lõi mà mọi SME VN đều cần dùng hằng ngày.

> **Tiến độ thực thi:**
> - [x] **Đợt 1A** — Schema migration `20260427090000_phase1_hr_core.sql`: 7 bảng attendance, 3 bảng leave, holidays_vn, contract_amendments + extend employment_contracts, employee_documents, employee_dependents, 4 bảng onboarding/offboarding + enums + RLS tenant_select ✅
> - [~] ~~Đợt 1B~~ — Seed lịch nghỉ lễ VN + leave_types mặc định — **BỎ** (mỗi công ty tự cấu hình; sẽ có nút "Import lịch lễ VN" trong settings ở 1D)
> - [x] **Đợt 1C** — Check-in/out web ✅
>   - Repository [lib/repositories/attendance.ts](lib/repositories/attendance.ts) với haversine GPS check + IP whitelist + auto-calc late/early/worked minutes
>   - Server actions [app/(app)/attendance/actions.ts](app/(app)/attendance/actions.ts) với rate limit (6/phút)
>   - Trang nhân viên [/attendance](app/(app)/attendance/page.tsx): Status card, GPS picker, check-in/out button, lịch sử tháng + summary
>   - Trang admin [/attendance/settings](app/(app)/attendance/settings/page.tsx): CRUD locations + shifts qua dialog
>   - Sidebar nav: thêm "Chấm công" trong nhóm People
>   - Audit log đầy đủ: `attendance.check_in`, `attendance.check_out`, `attendance.location.upsert/delete`, `attendance.shift.upsert/delete`
> - [x] **Đợt 1D** — Nghỉ phép ✅
>   - Repository [lib/repositories/leave.ts](lib/repositories/leave.ts) với working-days calculator (loại trừ T7/CN), pending/used/entitled tracking
>   - Server actions [app/(app)/leave/actions.ts](app/(app)/leave/actions.ts): submit/cancel/decide + leave_types CRUD + holidays CRUD/import VN
>   - Trang [/leave](app/(app)/leave/page.tsx): 4 thẻ quota (còn / đã dùng / chờ duyệt), form submit (loại nghỉ + ngày + nửa ngày + bàn giao), card ngày lễ sắp tới, lịch sử + huỷ đơn
>   - Trang [/leave/approvals](app/(app)/leave/approvals/page.tsx): danh sách chờ duyệt + approve/reject với note + lịch sử quyết định
>   - Trang [/leave/calendar](app/(app)/leave/calendar/page.tsx): grid 7 cột với navigation tháng trước/sau, hiển thị tên người + tô màu theo status, badge ngày lễ
>   - Trang [/leave/settings](app/(app)/leave/settings/page.tsx): CRUD leave_types + holidays + nút "Import lịch lễ VN" (preset 6 ngày, year-aware)
>   - Sidebar nav: thêm "Nghỉ phép" trong nhóm People
>   - Audit log: `leave.request.submit/approve/reject/cancel`, `leave.type.upsert/delete`, `leave.holiday.upsert/delete/import_vn`
> - [x] **Approval Center Phase 1** — Queue MVP / demo-safe ✅
>   - Trang [/approvals](app/(app)/approvals/page.tsx): filter theo trạng thái, loại request, từ khóa; danh sách pending/approved/rejected/cancelled
>   - Approve/reject có `decision_note`, `decided_at`, `decided_by`; demo mode lưu trạng thái ngay trong mock store để test được sau khi bấm
>   - Audit log: `approval.approved/rejected` ghi before/after gồm ghi chú quyết định
> - [x] **Approval Center Phase 2** — Rule-based routing / demo-safe ✅
>   - Route request theo `kind`, amount/headcount/target trong payload; hiển thị rule và current approver trên [/approvals](app/(app)/approvals/page.tsx)
> - [x] **Approval Center Phase 3** — Multi-step approval ✅
>   - Workflow nhiều bước lưu trong `payload.approvalWorkflow`; approve từng bước, chỉ chuyển `approved` khi hết step pending
> - [x] **Approval Center Phase 4** — Reassign & delegation ✅
>   - Form chuyển người duyệt và uỷ quyền ngay trên từng request; ghi history trong workflow payload + audit log
> - [x] **Approval Center Phase 5** — Bulk approve MVP ✅
>   - Bulk approve các request đang lọc; chỉ duyệt current step, không bypass các step sau
> - [x] **Approval Builder Phase 2 MVP** — Lark-style 4-step template builder ✅
>   - Trang [/approvals/builder](app/(app)/approvals/builder/page.tsx): Basic Info, Form Design, Process Design, More
>   - Schema template/form/process tách riêng ở [lib/approvals/templateSchema.ts](lib/approvals/templateSchema.ts)
>   - Form builder có widget palette + phone preview + field property panel; process builder có node dọc + panel cấu hình approver
>   - Có nút submit test request bằng flow đang cấu hình để nối sang runtime approval hiện tại
> - [x] **Approval Addendum Route Refactor** — tách 5 vùng chức năng theo addendum ✅
>   - `/approval`: Submit Request, browse template và gửi form theo schema demo
>   - `/approval/inbox`: Approval Center với tabs Pending / Approved / CC / My requests
>   - `/approval/admin`: Admin Console quản lý template; `/approval/admin/createApproval`: builder 4 bước
>   - `/approval/analytics`: Efficiency Diagnosis MVP; `/approval/data`: Data Management MVP
>   - Step 4 More chỉ giữ cấu hình; Preview/submit test chuyển sang modal riêng; không còn label UI kiểu `Phase` / `Lark-style Builder`
> - [x] **Approval Request Detail Page** — xem chi tiết phiếu đề xuất end-to-end ✅
>   - Trang `/approval/requests/[id]`: request info, nội dung form, routing hiện tại, timeline workflow, approve/reject, chuyển người duyệt, uỷ quyền
>   - Inbox có nút "Xem chi tiet phieu" để mở full request detail thay vì chỉ xem nhanh trong danh sách
>   - Server actions revalidate thêm `/approval/requests/[id]` sau approve/reject/reassign/delegate
> - [x] **Approval Advanced Actions MVP** — thao tác request giống approval thật hơn ✅
>   - Thêm `returnCurrentApprovalStep`, `insertApprovalStep`, `appendApprovalComment` trong [lib/approvals/workflow.ts](lib/approvals/workflow.ts)
>   - Repository/server actions hỗ trợ: trả về bước trước, thêm người duyệt trước/sau bước hiện tại, bình luận nội bộ
>   - UI `/approval/requests/[id]` có form Return / Add approver / Comment và timeline hiển thị bình luận/thao tác bổ sung
>   - Test mới [test/approval-workflow.test.ts](test/approval-workflow.test.ts): return step, insert approver, append comment
> - [x] **Approval Template Publish Store** — publish template hiện ngay ở trang Submit Request ✅
>   - Builder `/approval/admin/createApproval` gọi server action publish thay vì chỉ lưu `localStorage`
>   - Template publish được lưu vào file store demo [lib/repositories/approval-template-store.ts](lib/repositories/approval-template-store.ts)
>   - `/approval` và `/approval/admin` đọc danh sách template đã publish để hiện mẫu mới tạo
> - [x] **Approval Phase 2/3 Hardening** — widget schema, validation, admin lifecycle ✅
>   - Mở rộng [lib/approvals/templateSchema.ts](lib/approvals/templateSchema.ts) lên nhóm 25+ widget kiểu Lark: input, textarea, amount, formula, select, date interval, data link, field list, signature...
>   - Thêm validator Zod [lib/approvals/templateValidation.ts](lib/approvals/templateValidation.ts); Publish sẽ chặn template thiếu tên, thiếu field hoặc workflow thiếu Submit/End
>   - Admin template có Duplicate / Archive / Restore; trang Submit Request chỉ hiện template `published`
>   - Submit Request render được select, multi-select, textarea, static text, attachment/image/signature ở mức MVP
> - [x] **Approval Data Management MVP+** — bảng dữ liệu theo field + export CSV ✅
>   - `/approval/data` hiển thị cột form data theo field thay vì JSON thô
>   - Route `/approval/data/export` xuất CSV các request đã hoàn tất
> - [x] **Approval Widget Renderer Fix** — render đúng input type theo widget ✅
>   - Tách renderer [components/approvals/ApprovalFormFieldRenderer.tsx](components/approvals/ApprovalFormFieldRenderer.tsx) để field ảnh/hóa đơn dùng upload ảnh, attachment dùng file upload, contact/department dùng selector, date range dùng 2 ngày, signature dùng canvas, geolocation dùng browser GPS
>   - Server action lưu file upload thành metadata + data URL demo cho ảnh/PDF nhỏ; detail request hiển thị preview ảnh minh chứng
>   - Default field `Hoa don minh chung` đổi sang widget `image`, không còn text input
> - [x] **KPI Execution Phase 2** — Personal KPI Execution theo task có trọng số ✅
>   - Thay bảng Employee Execution bằng Personal KPI Execution: group task theo nhân sự/tháng, tính `SUM(task_weight * completion_percent / 100) / SUM(task_weight) * 100`
>   - Thêm helper [lib/kpi/personalExecution.ts](lib/kpi/personalExecution.ts) + test case Hiếu: weight 7/3, completion 80%/100% => Personal KPI 86%
>   - Task có thêm `task_weight`; create/update task và modal task detail cho phép Lead nhập trọng số, mục tiêu cần đạt, kết quả thực tế
>   - UI có expanded detail theo nhân sự: Task, KPI, Action Plan, Weight, Completion %, Weighted Score, Status, Due Date, Lead/Owner
>   - [x] Update: bỏ nhập tay Completion %, hệ thống tự tính từ `action_actual_value / action_target_value * 100`; cho phép vượt 100%, task done nhưng thiếu actual vẫn tính 0%
> - [~] ~~Đợt 1E~~ — Selfie verification + Storage bucket `attendance` (bỏ — không làm)
> - [x] **Đợt 1F** — Bảng công cuối tháng + lock/unlock ✅
>   - Migration `20260427170000_attendance_monthly_timesheets.sql`: thêm `attendance_monthly_periods`, `attendance_monthly_rows`, enum trạng thái + RLS/write policies cho CEO/HR Admin.
>   - Repository [lib/repositories/attendance-timesheets.ts](lib/repositories/attendance-timesheets.ts): tổng hợp ngày làm, nghỉ lương, nghỉ không lương, OT, đi muộn, về sớm theo tháng; cho phép manual adjustment trước khi chốt payroll.
>   - UI [/attendance/timesheets](app/(app)/attendance/timesheets/page.tsx): xem bảng công theo tháng, tổng hợp lại, chỉnh tay, khóa/mở khóa; trang [/attendance](app/(app)/attendance/page.tsx) có link nhanh sang bảng công tháng.
> - [~] Đợt 1G — Contract workspace & hồ sơ: đã có workspace, upload hồ sơ, amendment/versioning, cảnh báo hết hạn; phần "form linh hoạt theo công ty" vẫn còn có thể mở rộng thêm
> - [~] Đợt 1H — Onboarding/Offboarding checklist + dashboard tracking đã có; phần liên kết trạng thái hợp đồng hiện mới ở mức workflow mềm/chưa auto-sync rõ ràng
> - [~] ~~Đợt 1I~~ — Google Calendar sync (hoãn — không bắt buộc)
> - [~] ~~Đợt 1J~~ — Ký số hợp đồng VNPT-CA/FPT-CA (hoãn — không bắt buộc)

#### 1.1. Chấm công (Time Tracking) — [x] Đã có bản web vận hành được

**Tính năng:**
- **Check-in / Check-out** từ web hoặc mobile (PWA)
- **GPS verification** — chấm công chỉ khi ở trong bán kính X mét quanh văn phòng (cấu hình per office)
- **IP whitelist** — option chấm công qua WiFi công ty
- **Selfie verification** — chụp ảnh khi chấm công (chống chấm hộ)
- **Face recognition** (optional, dùng face-api.js client-side)
- **Multi-shift** — quản lý ca làm (sáng/chiều/đêm, shift A/B/C)
- **Linh hoạt** — flex-time, remote, hybrid
- **Tự động phát hiện đi muộn / về sớm / quên chấm** + thông báo

**Bảng DB cần thêm:**
```
attendance_devices       -- thiết bị chấm công (web/mobile/máy chấm vân tay)
attendance_locations     -- địa điểm văn phòng (lat/lng/radius)
attendance_shifts        -- định nghĩa ca
attendance_shift_assignments -- gán ca cho nhân viên
attendance_records       -- bản ghi check-in/out
attendance_corrections   -- xin chỉnh sửa khi quên chấm
overtime_requests        -- xin OT
```

**Tích hợp ngoài:**
- Máy chấm công Ronald Jack, ZKTeco — pull data qua webhook hoặc polling
- Excel/CSV import cho khách dùng máy chấm cũ

#### 1.2. Nghỉ phép (Leave Management) — [x] Đã có bản vận hành được

**Loại nghỉ phép theo luật VN:**
- **Phép năm** (12 ngày + 1 ngày/5 năm thâm niên)
- **Nghỉ lễ** (10 ngày lễ chính thức + Tết)
- **Nghỉ ốm có lương** (BHXH chi trả)
- **Nghỉ thai sản** (6 tháng cho nữ, 5-14 ngày cho nam)
- **Nghỉ kết hôn** (3 ngày), **nghỉ hiếu** (3 ngày)
- **Nghỉ không lương**
- **Nghỉ bù** (sau OT hoặc làm cuối tuần)

**Workflow:**
- Nhân viên submit đơn → manager duyệt → HR ghi nhận → tự động trừ phép
- **Quota tracking** — còn bao nhiêu ngày phép
- **Carry-over** — dồn phép sang năm sau (theo policy công ty)
- **Calendar view** — team xem ai nghỉ ngày nào (tránh trùng)
- **Notification** auto cho manager khi có đơn mới
- **Tích hợp Google Calendar / Outlook** đẩy event nghỉ phép

#### 1.3. Lịch nghỉ lễ VN — [~] Đã có CRUD + import preset, chưa auto nghỉ bù/loại trừ holiday khỏi phép

- Pre-load 10 ngày lễ VN cho 5 năm tới
- Tính cả nghỉ bù khi lễ rơi vào cuối tuần
- Custom holiday cho công ty (nghỉ team building, nghỉ Tết dài hơn luật)
- Tự động không trừ phép vào ngày lễ

#### 1.4. Bảng công cuối tháng — [x] Đã có

- Tổng hợp tự động: số ngày làm, số ngày nghỉ phép, số ngày nghỉ không lương, OT, đi muộn về sớm
- Đẩy data trực tiếp vào module Payroll
- HR có thể chỉnh sửa thủ công trước khi chốt
- Lock bảng công sau khi chốt — chỉ admin được mở khóa

#### 1.5. Contract Workspace & Hồ sơ — [~] Đã có phần lớn

**Nguyên tắc scope:**
- Không hard-code nội dung hợp đồng theo luật VN vào sản phẩm.
- App đóng vai trò **workspace quản lý hợp đồng và hồ sơ**, còn nội dung pháp lý do công ty/law firm tự quyết.
- Chỉ chuẩn hóa metadata, quy trình, file, version và trạng thái hoàn tất.

**Quản lý hợp đồng:**
- **Form linh hoạt theo công ty**: HR tự cấu hình hoặc chọn template nội bộ cho từng loại hợp đồng/phụ lục.
- **Metadata chuẩn**: mã hợp đồng, nhân sự, loại nội bộ, trạng thái, ngày hiệu lực, ngày hết hạn (nếu có), người ký, ghi chú.
- **Custom fields** theo template: lương, phụ cấp, địa điểm làm việc, chức danh, điều khoản đặc thù, hoặc các field riêng của công ty.
- **File-first workflow**: cho phép upload DOCX/PDF gốc do công ty soạn; generate Word/PDF từ template chỉ là tính năng bổ sung về sau.
- **Versioning / phụ lục**: mỗi lần thay đổi lương, vị trí, địa điểm hoặc điều khoản thì tạo amendment mới, không ghi đè lịch sử.
- **Cảnh báo hết hạn** trước 30 ngày nếu hợp đồng có `ends_at`; không tự suy luận chuyển vô thời hạn theo luật.
- **Out of scope**: legal rule engine, auto-drafting theo luật VN, auto-validate điều khoản pháp lý.

**Hồ sơ nhân sự đi kèm:**
- CCCD/CMND (front + back)
- Sổ BHXH, mã số thuế cá nhân (MST)
- Bằng cấp, chứng chỉ
- Sơ yếu lý lịch
- Hợp đồng/phụ lục đã ký (PDF/DOCX)
- Người phụ thuộc (cho giảm trừ TNCN)

#### 1.6. Onboarding / Offboarding — [~] Đã có checklist/dashboard, còn chỗ để siết integration

**Nguyên tắc scope:**
- `1H` chỉ quản lý **checklist, owner, deadline, trạng thái và dashboard tiến độ**.
- `1H` không đọc hay phân tích nội dung pháp lý của hợp đồng.
- Tích hợp với `1G` theo kiểu **state-based**: chỉ quan tâm hợp đồng đã draft, sent, signed hay uploaded.

**Onboarding workflow:**
1. HR tạo nhân viên mới → chọn template onboarding phù hợp.
2. Hệ thống tự động tạo checklist:
   - Hoàn tất hợp đồng (HR) — link tới contract record ở `1G`
   - Cấp tài khoản email/Slack (IT)
   - Cấp laptop/thẻ ra vào (Admin)
   - Đăng ký BHXH (HR)
   - Buddy assignment (Manager)
   - Lịch review 30/60/90 ngày
3. Mỗi task có người phụ trách, deadline, trạng thái, ghi chú.
4. Dashboard theo dõi tiến độ onboard theo nhân sự, phòng ban, overdue task.

**Offboarding workflow:**
1. Khi nhân viên nghỉ → chọn template offboarding và trigger checklist:
   - Bàn giao công việc + tài liệu
   - Thu hồi laptop/thẻ
   - Disable email/Slack/hệ thống
   - Tính lương cuối kỳ + thanh toán phép tồn
   - Chốt BHXH / hồ sơ liên quan
   - Exit interview
2. Lock account sau ngày cuối làm việc hoặc khi checklist critical đã hoàn tất.
3. Dashboard theo dõi task nào còn treo, ai đang phụ trách, hạng mục nào quá hạn.

**Điểm nối giữa `1G` và `1H`:**
- `1H` chỉ cần biết contract record đang ở trạng thái nào: `draft`, `sent`, `signed`, `uploaded`, `completed`.
- Khi hợp đồng đạt trạng thái yêu cầu thì task “Hoàn tất hợp đồng” trong onboarding được tick xong.

**Deliverable Phase 1:** Khách hàng pilot có thể dùng app thay thế Excel chấm công + xin nghỉ.


---

### 📍 PHASE 2 — Payroll Việt Nam (Tháng 4)

**Mục tiêu:** Build payroll engine tuân thủ 100% luật thuế và BHXH VN.

#### 2.1. Tính thuế TNCN theo luật VN

**Biểu thuế lũy tiến từng phần (7 bậc):**

| Bậc | Thu nhập tính thuế/tháng | Thuế suất |
|---|---|---|
| 1 | đến 5 triệu | 5% |
| 2 | trên 5 đến 10 triệu | 10% |
| 3 | trên 10 đến 18 triệu | 15% |
| 4 | trên 18 đến 32 triệu | 20% |
| 5 | trên 32 đến 52 triệu | 25% |
| 6 | trên 52 đến 80 triệu | 30% |
| 7 | trên 80 triệu | 35% |

**Giảm trừ:**
- Bản thân: 11 triệu/tháng
- Người phụ thuộc: 4.4 triệu/người/tháng
- Đóng BHXH bắt buộc
- Đóng quỹ từ thiện, khuyến học
- Đóng Quỹ hưu trí tự nguyện (tối đa 1 triệu/tháng)

> ⚠️ **Lưu ý:** Số liệu trên có thể đã thay đổi. Khi build cần verify với Thông tư mới nhất từ Tổng cục Thuế. Nên thiết kế config-driven (bảng `tax_brackets` theo năm) để dễ update.

#### 2.2. BHXH / BHYT / BHTN (theo luật VN)

**Tỷ lệ đóng** (kiểm tra lại tại thời điểm build vì có thể thay đổi):
- BHXH: NLĐ 8%, DN 17.5%
- BHYT: NLĐ 1.5%, DN 3%
- BHTN: NLĐ 1%, DN 1%

**Cơ sở tính:** lương cơ bản (không phải tổng thu nhập), trần đóng = 20 lần lương cơ sở.

**Tính năng:**
- Engine tính BHXH theo từng nhân viên + công ty
- Tự động exclude nhân viên thử việc (nếu policy không đóng)
- Báo cáo D02-TS, D03-TS, D04-TS để nộp BHXH
- Cảnh báo khi mức đóng vượt trần

#### 2.3. Lương Net ↔ Gross Converter

- User nhập lương net → system tính ngược ra gross + thuế + BHXH
- Hoặc nhập gross → tính ra net
- Đặc biệt quan trọng khi đàm phán lương với ứng viên

#### 2.4. Phiếu lương (Payslip)

- Sinh PDF phiếu lương cho từng nhân viên
- Layout chuẩn VN: thu nhập / khấu trừ / lương thực nhận
- Email tự động đến nhân viên (PDF có password = CCCD)
- Nhân viên xem trên app + download
- Lưu trữ Supabase Storage (private bucket)

#### 2.5. File chi lương cho ngân hàng VN

Tích hợp format file Excel/text cho các ngân hàng phổ biến:
- Vietcombank
- Techcombank
- BIDV
- ACB
- VPBank
- MB Bank
- TPBank

User chọn ngân hàng → system xuất file đúng format → upload vào internet banking công ty.

#### 2.6. Báo cáo thuế

- **Tờ khai 05/KK-TNCN** — quyết toán thuế quý/năm
- **Tờ khai 02/KK-TNCN** — khấu trừ tháng/quý
- **Bảng kê 05-1/BK-TNCN** — danh sách nhân viên có thu nhập
- Export định dạng XML để upload lên HTKK của Tổng cục Thuế

#### 2.7. Adjustment & Bonus

- Thưởng KPI (kéo từ KPI engine sẵn có)
- Thưởng Tết / lễ
- Thưởng dự án
- Phụ cấp ăn trưa, đi lại, điện thoại (có quy định miễn thuế)
- Khấu trừ vi phạm, tạm ứng
- Workflow duyệt cho khoản > X triệu

**Deliverable Phase 2:** Doanh nghiệp có thể chạy payroll thật, in phiếu lương, nộp thuế qua app.


---

### 📍 PHASE 3 — Operations & Performance (Tháng 5-6)

**Mục tiêu:** Hoàn thiện và nâng cấp module Operations + Performance Review hiện có.

#### 3.1. Operations / Task Management nâng cao

BIZOS đã có task board cơ bản. Cần thêm:

- **Kanban + List + Calendar + Gantt view** chuyển đổi linh hoạt
- **Task templates** — task lặp lại hàng tuần (báo cáo thứ 6, weekly meeting)
- **Recurring tasks** với cron-like rule
- **Subtasks + checklist** trong task
- **Comment + @mention + attachment**
- **Time tracking** trên task (start/stop timer) → nối vào timesheet
- **Task dependencies** (block / blocked-by)
- **SLA rules** — task type X phải xong trong Y giờ
- **Workload heatmap** — ai đang quá tải
- **Auto-assign** dựa trên skill/workload

#### 3.2. Project Management nâng cao

BIZOS có scaffold project, cần thêm:

- **Milestone tracking** với gantt chart
- **Project budget vs actual** realtime
- **Resource allocation** — ai đang work trên project nào, % bandwidth
- **Project ROI dashboard** — revenue/cost/margin
- **Risk register** — rủi ro + mitigation
- **Project templates** — copy từ project mẫu
- **Time billing** cho agency (billable vs non-billable hours)

#### 3.3. Performance Review (đánh giá hiệu suất)

**Build mới hoàn toàn:**

- **Review cycle config** — quý / 6 tháng / năm
- **Review templates** theo level (junior / mid / senior / manager / C-level)
- **Self review** — nhân viên tự đánh giá
- **Manager review** — quản lý đánh giá direct report
- **360° feedback** — đồng nghiệp + cross-team đánh giá
- **Calibration session** — meeting calibrate điểm giữa các manager
- **OKR/KPI integration** — kéo data thực tế từ KPI engine
- **Review form linh hoạt** — competency-based, OKR-based, hybrid
- **Career path** — visualize lộ trình thăng tiến
- **Promotion proposal** — workflow đề xuất tăng lương/thăng chức

#### 3.4. Skill Matrix & Training

BIZOS có schema, cần build UI:

- **Skill catalog** — danh mục kỹ năng theo phòng ban
- **Skill assessment** — self + manager rate (1-5)
- **Skill gap analysis** — so với yêu cầu vị trí
- **Training plan** cá nhân hóa
- **LMS lite** — upload video/doc, quiz đơn giản, tracking completion
- **Certificate** — cấp chứng chỉ nội bộ khi hoàn thành khóa học
- **Tích hợp Coursera/Udemy** (optional) — pull khóa học, track progress

#### 3.5. Goals & OKR nâng cao

BIZOS có OKR scaffold, cần thêm:

- **OKR template** theo phương pháp Google / Spotify / cá nhân hóa
- **Cascade visualization** — drag-drop align OKR cá nhân với company OKR
- **Check-in weekly** — update tiến độ KR
- **Confidence score** (1-10) thay vì chỉ % progress
- **Linking** OKR ↔ KPI ↔ Task ↔ Project (full traceability)
- **Quarter review** workflow

**Deliverable Phase 3:** SME có thể chạy hệ thống quản trị hiệu suất hiện đại, không cần Excel + email.


---

### 📍 PHASE 4 — Finance & Accounting Việt Nam (Tháng 7-8)

**Mục tiêu:** Build module kế toán-tài chính tuân thủ chế độ kế toán VN, có thể thay thế MISA cho SME nhỏ.

#### 4.1. Hóa đơn điện tử (E-invoice)

**Bắt buộc theo Nghị định 123/2020 + Thông tư 78/2021** — mọi DN VN phải dùng e-invoice.

**Tích hợp với nhà cung cấp e-invoice** (qua API):
- VNPT Invoice
- Viettel Invoice
- BKAV eHoaDon
- Misa MeInvoice
- M-Invoice (FPT)

**Tính năng:**
- Tạo hóa đơn từ dữ liệu sales/customer
- Ký số (USB token hoặc HSM cloud)
- Gửi cơ quan thuế tự động
- Lưu PDF + XML
- Email cho khách hàng
- Hủy hóa đơn / điều chỉnh
- Báo cáo hóa đơn theo kỳ

#### 4.2. Quản lý công nợ (AR/AP)

BIZOS có bảng `ar_ap_records`, cần build UI đầy đủ:

**Phải thu (AR):**
- Aging report — quá hạn 0-30, 30-60, 60-90, 90+
- Reminder tự động qua email/SMS/Zalo OA
- Tích hợp ngân hàng để đối soát thu (xem 4.3)
- Khấu trừ thanh toán (partial payment)

**Phải trả (AP):**
- Schedule thanh toán nhà cung cấp
- Cảnh báo deadline
- Approval workflow theo amount

#### 4.3. Đối soát ngân hàng (Bank Reconciliation)

- Import sao kê Excel/CSV từ ngân hàng (mỗi bank format khác nhau)
- Auto-match với invoice/payment record
- Manual adjust khi không match
- Reconciliation report cuối tháng
- API tích hợp ngân hàng (nếu có) — Vietcombank, Techcombank đã có API doanh nghiệp

#### 4.4. Sổ cái & Báo cáo tài chính

BIZOS có P&L/BS/CF scaffold, cần production-grade:

- **Chart of Accounts** theo TT 200/2014 (dành cho DN lớn) hoặc TT 133/2016 (DN nhỏ và vừa)
- **General Ledger** — sổ cái tài khoản
- **Journal entries** — bút toán định khoản
- **Trial balance** — bảng cân đối thử
- **P&L** — báo cáo kết quả kinh doanh
- **Balance Sheet** — bảng cân đối kế toán
- **Cash Flow** — báo cáo lưu chuyển tiền tệ
- **Notes** — thuyết minh báo cáo tài chính

#### 4.5. Báo cáo thuế

- **GTGT** — tờ khai 01/GTGT (VAT đầu ra/đầu vào)
- **TNDN** — tạm tính quý + quyết toán năm
- **TNCN** — đã làm ở Phase 2
- **Báo cáo tình hình sử dụng hóa đơn** (BC26-AC)
- Export XML cho HTKK

#### 4.6. Multi-currency

Dù target VN, nhiều SME có giao dịch USD/EUR:
- Tỷ giá hối đoái (lấy từ Vietcombank API hoặc nhập tay)
- Realized/unrealized FX gain/loss
- Báo cáo song ngữ

#### 4.7. Cost Center & Departmental P&L

BIZOS có `cost_centers` table, cần:
- Phân bổ chi phí chung theo phòng ban
- P&L riêng cho từng phòng ban
- So sánh ngân sách vs thực tế
- Drill-down từ company-level xuống department-level

**Deliverable Phase 4:** Kế toán SME dùng app thay thế MISA cho phần lớn nghiệp vụ.


---

### 📍 PHASE 5 — CRM & Sales (Tháng 9-10)

**Mục tiêu:** Mở rộng từ HRM/Finance sang Customer-facing — thực sự trở thành "Business OS".

#### 5.1. Customer Database

- **Lead / Contact / Account** model (kiểu Salesforce/HubSpot)
- **Lead source tracking** — Facebook Ads, Google Ads, referral, walk-in
- **Lead scoring** — auto-score dựa trên hành vi
- **Custom fields** linh hoạt cho từng ngành (nail salon vs SaaS vs F&B đều khác)
- **Tags + segments**
- **Duplicate detection** + merge

#### 5.2. Sales Pipeline

- **Deal stages** customizable (Lead → Qualified → Proposal → Negotiation → Won/Lost)
- **Kanban board** kéo thả deal
- **Pipeline forecast** — weighted revenue theo stage probability
- **Activity tracking** — call, email, meeting log
- **Quote / Proposal builder** — sinh PDF từ template
- **Conversion analytics** — funnel từ lead → won

#### 5.3. Marketing automation lite

- **Email campaign** (qua Resend/Mailgun/SendGrid)
- **SMS / Zalo ZNS** marketing — phổ biến ở VN
- **Drip campaign** — chuỗi email tự động theo trigger
- **Landing page builder** lite (optional)

#### 5.4. Customer Support

- **Ticket system** — email/Zalo/web form đẩy về 1 inbox
- **SLA tracking**
- **Knowledge base** (kế thừa từ module Knowledge của BIZOS)
- **Customer satisfaction (CSAT)** survey sau ticket

#### 5.5. Tích hợp kênh VN

- **Zalo Official Account** — nhắn tin 2 chiều với khách
- **Facebook Messenger** — inbox tích hợp
- **Tiktok Lead Form** (cho ngành đào tạo, BĐS)
- **SMS Brandname**
- **Call center lite** — tích hợp Stringee, FPT.AI Voice

#### 5.6. E-commerce sync (optional)

Nhiều SME bán trên Shopee/Lazada/Tiki:
- Pull đơn hàng từ Shopee/Lazada Open API
- Sync inventory
- Tự động tạo invoice

**Deliverable Phase 5:** SME có thể quản lý toàn bộ vòng đời khách hàng trong 1 app.


---

### 📍 PHASE 6 — AI, Mobile & Polish (Tháng 11-12)

**Mục tiêu:** Tạo điểm khác biệt cạnh tranh — AI + mobile native.

#### 6.1. AI Assistant nội bộ ("Hỏi đáp công ty")

Đây là **điểm khác biệt lớn nhất** so với Base/MISA hiện tại.

**Tính năng:**
- Chat assistant trên app — "Tháng này tôi còn mấy ngày phép?", "Doanh thu Q3 so với Q2 thế nào?", "Ai trong team Sales đang miss KPI?"
- Trả lời bằng tiếng Việt, có context của công ty
- Có thể thực hiện action: "Đăng ký nghỉ phép thứ 6 tuần sau" → AI tạo đơn → user confirm
- **Tech stack:** dùng Claude API hoặc OpenAI, kết hợp RAG (vector embedding của company data) hoặc function calling

**Implementation:**
- Định nghĩa **toolset** mà AI được phép gọi: `get_kpi`, `submit_leave`, `get_payroll`, `query_finance`, ...
- Mỗi tool có RLS check để không leak data
- Lưu chat history để cải thiện
- Có thể nhúng vào Slack/Zalo (chatbot)

#### 6.2. Anomaly Detection & Smart Alerts

- **KPI anomaly** — detect khi KPI dưới target X% so với pattern lịch sử
- **Cash flow alert** — cảnh báo dòng tiền âm trong N ngày tới (dựa trên AR/AP)
- **Attendance anomaly** — phát hiện nhân viên có dấu hiệu burnout (OT nhiều, đi muộn liên tục)
- **Sales anomaly** — deal có giá trị bất thường, churn cao
- **Cost anomaly** — chi phí bất thường so với ngân sách

Dùng simple statistics (z-score, IQR) hoặc ML model nhẹ (Isolation Forest).

#### 6.3. Forecasting với ML

BIZOS có simulator "what-if" — nâng cấp lên ML thật:

- **Revenue forecasting** — Prophet/ARIMA dự báo doanh thu 3-6 tháng
- **Cash flow forecasting** — dự báo dòng tiền dựa trên AR/AP + seasonality
- **Headcount planning** — gợi ý số lượng tuyển dựa trên growth + attrition rate
- **Demand forecasting** — cho SME thương mại (dựa trên doanh số quá khứ)

#### 6.4. Auto-summary cho Dashboard

Mỗi sáng/đầu tuần, AI tự sinh narrative cho CEO:
> "Tuần qua, doanh thu vượt 5% target, nhờ team Sales đóng được deal X. KPI chăm sóc khách hàng giảm 8% — anh nên check với head support. Nhân viên A có 12 giờ OT tuần này, có thể cần luân chuyển task."

Push qua email / app / Zalo.

#### 6.5. Mobile App (React Native / Expo)

Web PWA chỉ giải quyết được 70%. Để chấm công, push notification, offline tốt — cần native:

- **Tech:** Expo + React Native (share code với web qua Solito hoặc Tamagui — optional)
- **Tính năng ưu tiên cho mobile:**
  - Chấm công GPS + selfie
  - Xin nghỉ phép
  - Xem lương, phiếu lương
  - Task của tôi (todo list)
  - Notification realtime
  - Approval (cho manager)
  - Chat AI assistant
- **Push notification** qua Expo Push hoặc OneSignal
- **Offline-first** — chấm công vẫn được khi mất mạng, sync sau

#### 6.6. Tích hợp & Marketplace

- **Slack / MS Teams / Discord** — bot push notification, slash command
- **Google Workspace / Office 365** — calendar sync, SSO
- **Zapier / Make.com / n8n** — webhook in/out
- **API public** + documentation cho khách enterprise tích hợp
- **Chữ ký số** — VNPT-CA, FPT-CA, BKAV-CA
- **eKYC** cho onboarding nhân viên (chụp CCCD, đối chiếu khuôn mặt)

#### 6.7. Polish & Performance

- **Bundle size optimization** — code-splitting per route
- **Database query optimization** — index, materialized view cho dashboard
- **Caching layer** — Redis/Upstash cho data đọc nhiều
- **Image optimization** — Next.js Image với CDN
- **Internationalization** — refine VI/EN, format số/ngày theo locale
- **Accessibility (a11y)** — keyboard nav, screen reader, contrast WCAG AA
- [x] **Dark mode** ✅ (ThemeProvider + ThemeToggle, biến CSS theme trong `app/globals.css`)

**Deliverable Phase 6:** Sản phẩm đủ sức cạnh tranh với Base.vn, có điểm khác biệt rõ ràng (AI + mobile native + giá tốt).


---

## 🏗️ PHẦN 4 — KIẾN TRÚC KỸ THUẬT KHUYẾN NGHỊ

### 4.1. Stack đề xuất (giữ và bổ sung từ BIZOS)

**Giữ nguyên:**
- Next.js 16 + TypeScript + Tailwind v4
- Supabase (Postgres + Auth + Storage + Realtime)
- React Hook Form + Zod
- TanStack Table + Recharts + ReactFlow

**Bổ sung:**
| Lớp | Lựa chọn | Lý do |
|---|---|---|
| Email transactional | **Resend** hoặc AWS SES | Rẻ, ổn định, có template |
| Push notification | **Expo Push** + Web Push API | Free, đủ dùng cho SME |
| Background jobs | **Trigger.dev** hoặc **Inngest** | Cron, retry, observability |
| Cache | **Upstash Redis** | Serverless, pay-per-use |
| Vector DB (cho AI) | **Supabase pgvector** | Tích hợp sẵn, đỡ thêm service |
| Monitoring | **Sentry** + **PostHog** | Error + product analytics |
| File storage lớn | **Cloudflare R2** | Rẻ hơn S3, không egress fee |
| LLM | **Claude API** + **OpenAI** fallback | Best for VN reasoning |
| OCR (CCCD, hóa đơn) | **FPT.AI Vision** hoặc **Mindee** | FPT.AI mạnh tiếng Việt |
| SMS | **eSMS.vn** hoặc **VietGuys** | Brandname, Zalo ZNS |
| Chữ ký số | **VNPT-CA** hoặc **EasyCA** | Phổ biến nhất VN |
| Mobile | **Expo (React Native)** | Cùng team, share logic |
| Testing | **Vitest** + **Playwright** | Hiện đại, fast |

### 4.2. Multi-tenancy

BIZOS hiện single-tenant. Để bán SaaS cho nhiều công ty, cần multi-tenant:

**Lựa chọn:**
- **Shared DB, RLS by company_id** (đã có sẵn) — đơn giản, tốt cho đến vài trăm tenant
- **Schema per tenant** — phức tạp, scale tốt hơn
- **DB per tenant** — đắt, chỉ cho enterprise

**Khuyến nghị:** Bắt đầu với shared DB + RLS. Khi có khách lớn yêu cầu tách biệt, mới làm DB per tenant cho riêng họ.

### 4.3. Modular Monolith (đừng tách microservice sớm)

Cấu trúc theo module thay vì tách service:
```
app/
  (auth)/
  (app)/
    hr/         -- chấm công, nghỉ phép, hồ sơ
    payroll/
    operations/
    crm/
    finance/
    ai/
lib/
  modules/
    hr/         -- repository, service, types
    payroll/
    ...
  shared/       -- common utils, components
```

Microservice chỉ tách khi:
- Có module load cực cao (AI, real-time chấm công GPS)
- Team > 20 người và cần độc lập deploy

### 4.4. Database Migration Strategy

BIZOS hiện dùng raw SQL. Nâng cấp:

- **Supabase CLI** + migration files (đã có folder `supabase/migrations`)
- **Mỗi PR** kèm migration file
- **Down migration** cho rollback
- **Test migration** trên staging trước production
- **Seed data** tách biệt cho dev/staging/prod

### 4.5. CI/CD

- **GitHub Actions:**
  - Lint + typecheck + unit test + E2E (trên PR)
  - Deploy preview lên Vercel cho mọi PR
  - Deploy production khi merge `main`
- **Database migration:** auto-run trên Supabase qua CLI
- **Secrets:** GitHub Secrets + Vercel env vars
- **Branch strategy:** `main` (prod) ← `staging` ← feature branches

### 4.6. Observability

Phải có ngay từ đầu:
- **Logs:** structured logging (pino), aggregate trên Axiom hoặc Better Stack
- **Errors:** Sentry với source map
- **Performance:** Vercel Analytics + Web Vitals
- **Product analytics:** PostHog (event tracking, funnel, retention)
- **Uptime:** Better Stack hoặc UptimeRobot


---

## 💡 PHẦN 5 — TÍNH NĂNG NÂNG CAO ĐỂ TẠO KHÁC BIỆT

Đây là những tính năng "wow" mà các đối thủ chưa làm tốt — bạn có thể tận dụng để tạo điểm khác biệt:

### 5.1. AI-first features

- **Phỏng vấn AI** — AI screen ứng viên qua chat/voice trước khi HR phỏng vấn thật
- **Auto job description** — nhập 3 dòng yêu cầu, AI viết JD đầy đủ
- **CV parsing tự động** — upload CV PDF → AI extract data → fill form
- **AI viết phản hồi review** — manager nhập bullet points, AI viết review draft
- **Smart task creation** — paste nội dung email/Slack, AI biến thành task có assignee + deadline
- **AI generated SOP** — AI viết quy trình từ mô tả ngắn
- **Meeting summarizer** — upload audio meeting, AI tóm tắt + action items (dùng Whisper)
- **OKR coach** — AI gợi ý KR cho objective, check OKR có SMART không

### 5.2. Workflow Automation Engine

Như Zapier nhưng nội bộ:
- Trigger: khi sự kiện X xảy ra (employee hire, KPI miss, deal won, ...)
- Action: gửi email, tạo task, đăng Slack, update field, gọi webhook
- UI builder kéo thả
- VD: "Khi deal > 100tr Won → tạo task onboarding khách + gửi Zalo welcome + tạo invoice"

### 5.3. Smart Approval Routing

Thay vì cấu hình cứng "manager → HR → CEO":
- Dynamic routing dựa trên amount, type, department
- Skip approval khi trùng người (manager xin nghỉ thì lên thẳng CEO)
- Auto-approve nếu không phản hồi trong N giờ (configurable)
- Delegation khi manager đi vắng
- Bulk approve

### 5.4. Real-time Collaboration

- **Live cursor** trên document (như Google Docs)
- **Comment + reaction** trên mọi entity (task, KPI, employee)
- **Mentions** + notification
- **Activity feed** theo entity
- **Co-editing** SOP/document (dùng Yjs + TipTap)

### 5.5. Gamification

Cho engagement nhân viên:
- **Badge** khi hoàn thành milestone (chấm công 100% tháng, đạt KPI 3 tháng liên tiếp)
- **Leaderboard** team/cá nhân (cẩn thận với văn hóa VN — option ẩn)
- **Birthday / work anniversary** wall
- **Kudos** — đồng nghiệp khen nhau công khai
- **Coin/point** đổi voucher (tích hợp với gift card platform VN)

### 5.6. Wellness & Engagement

- **Pulse survey** — khảo sát nhanh hàng tuần (eNPS, mood)
- **1-on-1 template** + tracking
- **Peer feedback** ẩn danh
- **Mental health** check-in
- **Birthday/milestone** automation

### 5.7. Document Intelligence

- **OCR CCCD/CMND** — chụp 1 ảnh, auto-fill toàn bộ thông tin
- **OCR hóa đơn** — chụp hóa đơn nhà cung cấp → tự động vào AP
- **Hợp đồng AI review** — AI đọc hợp đồng, highlight rủi ro
- **E-signature** — ký số trên hợp đồng nội bộ
- **Template editor** — tạo template hợp đồng kéo thả field

### 5.8. Data & BI

- **Custom dashboard builder** — kéo thả widget
- **Saved filter** + scheduled report (tự gửi email hàng tuần)
- **Embedded SQL editor** cho power user (kèm RLS để an toàn)
- **Connect Power BI / Tableau / Metabase** qua Postgres direct
- **Export Google Sheets** sync 2 chiều

### 5.9. Tích hợp đặc thù VN

- **VAT lookup** — gõ MST → tự động lấy thông tin DN từ Tổng cục Thuế
- **Bank lookup** — số tài khoản → tên chủ TK (tích hợp Casso, MoMo for business)
- **Address autocomplete** — Tỉnh/Huyện/Xã VN (dùng dataset chính thức của TCTK)
- **Lịch âm dương** — quan trọng với HR (đám cưới, giỗ chạp ảnh hưởng nghỉ phép)
- **Phong thủy/numerology** — ngày khai trương, ngày họp (tongue-in-cheek nhưng nhiều CEO VN thích)

### 5.10. Compliance & Security cao cấp

- **GDPR/Nghị định 13** — về bảo vệ dữ liệu cá nhân
- **Right to be forgotten** workflow
- **Data retention policy** — auto-delete data cũ
- **Encryption at rest** cho PII (CCCD, lương, BHXH)
- **SOC 2 Type II** — nếu nhắm enterprise


---

## 📊 PHẦN 6 — KHUYẾN NGHỊ TRIỂN KHAI & GO-TO-MARKET

### 6.1. Team size đề xuất

| Phase | Team tối thiểu |
|---|---|
| Phase 0-1 | 1 full-stack senior + 1 designer (part-time) |
| Phase 2-3 | + 1 backend, + 1 frontend |
| Phase 4-5 | + 1 mobile dev, + 1 QA |
| Phase 6 | + 1 ML/AI engineer, + 1 DevOps |

Solo founder có thể làm Phase 0-1 trong 4-5 tháng (thay vì 3 tháng với team).

### 6.2. Pricing strategy

Với SME 10-50 người ở VN:

**Mô hình freemium:**
- **Free** — 5 user, tính năng cốt lõi (chấm công, task) — để hook
- **Starter** 49k/user/tháng — đầy đủ HRM + Operations
- **Professional** 99k/user/tháng — + Finance + CRM
- **Enterprise** — custom — + AI assistant unlimited, dedicated support

So sánh: Base.vn ~150-300k/user/tháng. Bạn có lợi thế giá nếu giữ chi phí thấp.

### 6.3. Go-to-market

- **Content marketing** — viết blog "Cách tính TNCN 2026", "Mẫu hợp đồng lao động", "Excel chấm công" — SEO tốt với từ khóa VN
- **Cộng đồng HR VN** — Facebook group, LinkedIn — tham gia giúp đỡ trước khi bán
- **Partnership** với:
  - Văn phòng kế toán/tư vấn thuế (referral)
  - Coworking space (HOLA, Toong, Dreamplex) — bundle với membership
  - Vườn ươm khởi nghiệp (NIC, Topica Founder Institute)
- **Trial 14 ngày** không cần thẻ tín dụng
- **Onboarding miễn phí** với khách trả phí (concierge — quan trọng vì SME VN ngại tự setup)

### 6.4. Khách hàng pilot

3 loại khách hàng pilot lý tưởng:
1. **Startup tech 10-30 người** — chấp nhận sản phẩm beta, feedback nhanh
2. **Công ty agency / dịch vụ 30-50 người** — dùng đủ module (HR + Project + Finance + CRM)
3. **Công ty truyền thống 20-40 người** (F&B chain, retail) — test khả năng đa dạng ngành

Xin được 3 khách pilot **trả phí** (dù giảm giá 50-80%) — không free, vì free thì khách không nghiêm túc dùng.

### 6.5. Rủi ro lớn nhất cần lường trước

| Rủi ro | Mitigation |
|---|---|
| **Luật VN thay đổi** (thuế, BHXH) | Config-driven (bảng versioned), cập nhật trong 30 ngày |
| **Khách lo lắng data nằm ở Supabase** (offshore) | Option self-host hoặc Supabase region Singapore + DPA |
| **Cạnh tranh Base/MISA** | Khác biệt bằng AI + UX + giá, đừng đua tính năng |
| **Onboarding khó** | Concierge service + video tutorial + AI assistant |
| **Sai luật → khách bị phạt** | Disclaimer + có advisory board là kế toán/luật sư |
| **Burnout vì làm quá nhiều module** | Strict phasing, không vì 1 khách yêu cầu mà nhảy phase |

### 6.6. Metric theo dõi

**Product metric:**
- DAU/MAU
- Feature adoption (% công ty dùng module X)
- Time to first value (từ signup đến chấm công đầu tiên)
- NPS (Net Promoter Score)

**Business metric:**
- MRR / ARR
- CAC / LTV
- Churn rate (tháng/năm)
- Trial → paid conversion

### 6.7. Lộ trình mở rộng dài hạn (sau 12 tháng)

- **Mở rộng quy mô khách** — từ 10-50 người lên 50-200 người
- **Industry vertical** — phiên bản chuyên cho F&B chain, salon, giáo dục, agency
- **Thị trường ĐNA** — Indonesia, Philippines, Thailand (luật khác)
- **Marketplace** — third-party plugin / tích hợp
- **AI agent layer** — autonomous agent chạy tác vụ thay người (book meeting, viết email, tạo report)


---

## ✅ PHẦN 7 — CHECKLIST HÀNH ĐỘNG TUẦN ĐẦU TIÊN

Nếu bạn bắt đầu ngay tuần này, đây là việc cần làm:

### Tuần 1: Setup & đánh giá

- [ ] Fork BIZOS repo về account riêng
- [ ] Setup Supabase project (Singapore region)
- [ ] Deploy version demo lên Vercel để team xem
- [ ] Chạy schema.sql + seed.sql, test demo flow
- [ ] Đọc kỹ code 5 module quan trọng nhất: KPI engine, payroll engine, supabase queries, RLS policies, layout
- [ ] List 10 thay đổi nhỏ cần làm để app "production-ready"
- [x] Setup GitHub Actions CI cơ bản
- [ ] Setup Sentry + PostHog free tier

### Tuần 2: Foundation

- [x] Implement đầy đủ CRUD cho Employee + Department (làm mẫu trước)
- [x] Setup Supabase Storage buckets + upload UI
- [ ] Setup Resend cho email transactional
- [ ] Bật 2FA cho Supabase Auth
- [ ] Audit responsive trên mobile, fix top 10 vấn đề

### Tuần 3-4: Quyết định phase 1

- [ ] Phỏng vấn 5-10 SME (HR, CEO) về pain point chấm công/nghỉ phép
- [ ] Wireframe module Attendance + Leave (Figma)
- [x] Schema migration cho 7 bảng chấm công (attendance_*, overtime_*)
- [x] Implement check-in/out cơ bản (web)
- [ ] Demo cho 2-3 khách pilot tiềm năng

### Tài liệu cần soạn song song

- [ ] **Product spec** chi tiết cho từng module (1 doc/module)
- [ ] **API documentation** (dùng tRPC hoặc OpenAPI)
- [ ] **User guide** tiếng Việt cho từng persona
- [ ] **Onboarding video** ngắn 2-3 phút/module
- [ ] **Knowledge base** câu hỏi thường gặp

---

## 📚 PHẦN 8 — TÀI NGUYÊN THAM KHẢO

### Luật & quy định VN cần biết

- **Bộ luật Lao động 2019** — quan trọng cho HR, payroll, hợp đồng
- **Luật Thuế TNCN** + Thông tư hướng dẫn
- **Luật BHXH** + các Nghị định
- **Nghị định 13/2023/NĐ-CP** — về bảo vệ dữ liệu cá nhân (giống GDPR)
- **Thông tư 200/2014** và **Thông tư 133/2016** — chế độ kế toán
- **Nghị định 123/2020** + **Thông tư 78/2021** — hóa đơn điện tử

> ⚠️ Luật/thông tư có thể được sửa đổi, bổ sung. Trước khi build module nào liên quan, hãy verify với văn bản pháp luật mới nhất hoặc tham vấn luật sư/kế toán.

### Sản phẩm cần nghiên cứu (đối thủ + best-in-class)

**VN:**
- Base.vn (Base HRM, Base Goal, Base Office)
- MISA AMIS
- Tanca, Bizfly, 1Office, Fastwork
- iHCM (cho enterprise)

**Quốc tế:**
- Rippling (HRM all-in-one — UX tham khảo)
- Deel (global payroll)
- Notion + Linear (UX & speed)
- Lattice (performance review)
- Pipedrive / HubSpot (CRM cho SME)
- Gusto (payroll Mỹ — engine reference)

### Open source nên đọc code

- **Erpnext** (Frappe) — full ERP open source, nhiều ý tưởng
- **Twenty.com** — CRM modern open source, code Next.js sạch
- **Cal.com** — booking, codebase Next.js production-grade
- **Documenso** — e-signature open source
- **Plane** — project management open source

---

## 🎬 KẾT LUẬN

BIZOS là điểm khởi đầu tốt — bạn không cần build từ con số 0. Nhưng từ "demo" đến "production cho SME thật" là **quãng đường rất dài**: ~12 tháng nếu có team, 18-24 tháng nếu solo.

**3 lời khuyên cuối:**

1. **Đừng cố làm hết cùng lúc.** Ship Phase 0-1-2 trước, có khách thật trước khi đụng Phase 3+. Một sản phẩm hoàn thiện 3 module > 12 module nửa vời.

2. **Khách hàng VN trả tiền cho "đỡ đau", không phải "tính năng cool".** Chấm công, lương, BHXH, hóa đơn — đó là pain thật. AI assistant là wow nhưng không phải lý do mua. Hãy build pain-killer trước, vitamin sau.

3. **Đầu tư vào onboarding & support**. SME VN không tự setup được. Một sản phẩm trung bình + concierge tốt > sản phẩm xuất sắc + tự phục vụ. Tính chi phí onboarding vào pricing model.

Chúc bạn build thành công. Khi gặp vấn đề cụ thể về thiết kế module nào, schema, code, hay quyết định kỹ thuật — cứ hỏi tiếp, tôi sẽ đi sâu vào từng phần.

— *Plan v1 · Tháng 4, 2026*
