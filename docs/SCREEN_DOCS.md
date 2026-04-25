# BIZOS Company OS — Tài liệu chức năng các màn hình

> **Stack**: Next.js 16 (App Router) · Supabase (PostgreSQL) · TypeScript  
> **Local**: `http://localhost:3000` — Cần Docker + `npx supabase start`

---

## Mục lục

| # | Màn hình | Route |
|---|----------|-------|
| 1 | [Dashboard](#1-dashboard) | `/dashboard` |
| 2 | [KPI](#2-kpi) | `/kpi` |
| 3 | [Finance](#3-finance) | `/finance` |
| 4 | [Operations](#4-operations) | `/operations` |
| 5 | [People](#5-people) | `/people` |
| 6 | [Org Chart](#6-org-chart) | `/org` |
| 7 | [Compensation](#7-compensation) | `/compensation` |
| 8 | [Recruiting](#8-recruiting) | `/recruiting` |
| 9 | [OKR](#9-okr) | `/okr` |
| 10 | [Forecast](#10-forecast) | `/forecast` |
| 11 | [Alerts](#11-alerts) | `/alerts` |

---

## Cách chạy local

```bash
# 1. Mở Docker Desktop
# 2. Khởi động Supabase local
npx supabase start

# 3. Chạy app
pnpm dev   # → http://localhost:3000
```

**Supabase Studio**: `http://127.0.0.1:54323`

---

## 1. Dashboard

**File**: `app/(app)/dashboard/page.tsx`

### Mục đích
"Command center" tổng quan — CEO/CFO/COO xem doanh thu, KPI, nhân sự, tài chính và rủi ro trong một trang.

### Dữ liệu tải
`fetchKpis` · `fetchKpiTargets` · `fetchKpiActuals` · `fetchEmployees` · `fetchPayroll` · `fetchTasks` · `fetchAlerts` · `fetchAccounting` · `fetchDepartments`

### Layout

**Row 1 — 6 KPI Cards nhanh**

| Card | Giá trị | Accent |
|------|---------|--------|
| Doanh thu tháng | SUM credit account 511 | indigo |
| Gross Profit | KPI code `GP` actual | emerald |
| Net Profit | KPI code `NP` actual | violet |
| KPI company | TB completion % cấp company | cyan |
| Headcount | Số nhân sự | amber |
| Payroll cost | SUM company_cost | rose |

**Row 2 — Hero section (3 cards)**
- **Rủi ro KPI** (4/12): Bảng KPI đỏ/vàng, top 6
- **KPI Donut** (4/12): Green / Yellow / Red / N/A
- **Area trend 12 tháng** (4/12): Xu hướng doanh thu

**Row 3**
- **Bar chart 6 tháng** (5/12): Revenue vs Profit
- **Tiến độ công việc** (4/12): StatChip + ProgressList theo loại task
- **Incentive snapshot** (3/12): Bonus pool, Gross/Net, Payroll/Revenue

**Row 4**
- **Xếp hạng phòng ban KPI** (5/12): Bar chart target vs actual
- **Cảnh báo mở** (4/12): Top 5 alerts → link `/alerts`
- **Activity feed** (3/12)

**Row 5 — Insight AI**: 3 InsightCard với spark trend

**Row 6 — Bottom snapshot**
- Execution: task mở/overdue/on-time
- Finance: Cash, AR, AP, Runway
- What-if risks: Sales -20%, Payroll +15%...

---

## 2. KPI

**File**: `app/(app)/kpi/page.tsx`

### Mục đích
Quản lý hệ thống KPI theo cấu trúc cây cascade: Company → Department → Team → Employee.

### Logic status
```
green  = completion >= 1.0
yellow = 0.85 <= completion < 1.0
red    = completion < 0.85
na     = chưa có actual
```

### Layout

**Top cards**: 4 KPI cấp company + 1 card tổng (màu phân bổ)

**Form tạo KPI**: Tên · Mã · Cấp · Đơn vị · Owner · KPI cha · Target → `createKpiAction()`

**Form ghi actual**: KPI · Period · Actual value → `recordKpiActualAction()`

**Cây KPI** (8/12): `KpiTreeGraph` — React Flow, node màu theo status

**Lead card MKT.LEADS** (4/12): Actual vs Target + CPL, MQL→SQL, KPI đóng góp ngược

**Row 2**:
- Top KPI ảnh hưởng lớn (sort `weight × completion`)
- Task đang gắn KPI
- KPI thiếu dữ liệu
- Tiến độ KPI theo phòng ban

**3 InsightCard** + **DataTable** toàn bộ KPI (tất cả cấp)

---

## 3. Finance

**File**: `app/(app)/finance/page.tsx`  
**Sub-routes**: `/finance/pnl` · `/finance/balance-sheet` · `/finance/cashflow` · `/finance/budget`

### Mục đích
Dashboard tài chính: P&L, Balance Sheet, Cash Flow, chi phí vs budget.

### Công thức
```
grossProfit = revenue(511) - cogs(632)
opex        = selling(641) + admin(642) + payroll
netProfit   = grossProfit - opex
netMargin   = netProfit / revenue
```

### Layout

**6 KPI Cards**: Doanh thu · GP · NP · Net margin · Payroll · OPEX

**Form bút toán**: Account code · Debit · Credit · Phòng ban · Ngày → `createAccountingEntryAction()`

**Charts**:
- Bar 6 tháng: Revenue vs Cost vs Profit
- Donut: Cơ cấu chi phí theo phòng ban
- Area 12 tháng: Xu hướng doanh thu
- StatChip: Gross margin, Net margin, Payroll/Rev, OPEX/Rev, AR turnover

**Mini reports** (3 cards):
- P&L: Revenue → COGS → Gross → Expenses → Net
- Balance Sheet: Cash, AR, Inventory, Nợ, Vốn chủ
- Cash Flow: OCF, ICF, FCF, Net cash, Runway

**Chi phí vs Budget**: ProgressList — xanh (<95%), vàng (95-100%), đỏ (>100%)

---

## 4. Operations

**File**: `app/(app)/operations/page.tsx`

### Mục đích
Kanban task board — theo dõi tiến độ, workload, deadline, kết nối task với KPI.

### Task columns
`todo` → `in_progress` → `review` → `blocked` → `done`

### Task types
`growth` · `maintenance` · `admin` · `urgent`

### Layout

**6 KPI Cards**: Tổng · Hoàn thành · Đang làm · Overdue · Urgent · On-time%

**Forms**:
- Tạo task: Title · Assignee · Linked KPI · Due date · Priority → `createTaskAction()`
- Ghi output: Task · Output type · Value → `recordTaskOutputAction()`

**Task Board** (8/12): 5 cột Kanban, mỗi card: title + priority badge + KPI badge + assignee + due date

**Side** (4/12): Donut phân bổ status + Mini Calendar deadline tháng

**Row 2**: Workload/người · Activity feed · Low-value work stats

---

## 5. People

**File**: `app/(app)/people/page.tsx`

### Mục đích
Danh sách nhân sự, thêm mới, xem phân bổ và performance.

### Layout

**5 KPI Cards**: Tổng · Active · Phòng ban · Quỹ lương · Mới tháng

**Form thêm nhân sự**: Họ tên · Email · Phòng ban · Manager · Lương cơ bản → `createEmployeeAction()`

**Row phân tích** (3 cards):
- Phân bổ theo phòng ban (ProgressList)
- Performance distribution: Xuất sắc≥110% / Đạt 90-109% / Cải thiện<90% / Yếu<80%
- Top 5 performer tháng

**DataTable**: Avatar+Tên+Email · Phòng ban · Manager · Lương · KPI count · Status

---

## 6. Org Chart

**File**: `app/(app)/org/page.tsx`

### Mục đích
Sơ đồ tổ chức trực quan, cấu trúc báo cáo, span of control, KPI theo tổ chức.

### Layout

**6 KPI Cards**: Nhân sự · Phòng ban · Quỹ lương/tháng · Span of control · KPI% · Mới tuyển

**OrgGraph** (8/12): React Flow, Company → Departments → Employees theo manager_id

**KPI Donut** (4/12): Completion % + Green/Yellow/Red chips

**Row 2**:
- Phòng ban & head: name, headcount, budget → `/departments/[id]`
- Bar chart headcount/phòng ban
- Donut cấp bậc: Senior/Mid/Junior/Head

**Row 3**: Activity feed tổ chức + Cảnh báo org (workload, span, thiếu nhân sự, budget)

**Bottom**: ProgressList KPI TB theo phòng ban

---

## 7. Compensation

**File**: `app/(app)/compensation/page.tsx`

### Mục đích
Cấu trúc lương thưởng: lương cơ bản, phụ cấp, hoa hồng, bonus, BHXH, rule ngưỡng thưởng.

### Công thức
```
gross   = base + allowance + commission + bonus
net     = gross - deductions  
cost    = gross + BHXH_company
kpi_bonus = base × base_bonus_pct × multiplier
```

### Rule ngưỡng thưởng (multiplier)
| KPI Completion | Multiplier |
|----------------|-----------|
| < 80% | 0.0x |
| ≥ 80% | 0.5x |
| ≥ 90% | 0.75x |
| ≥ 100% | 1.0x |
| ≥ 120% | 1.5x |

### Layout

**6 KPI Cards**: Gross · Net · Cost · Bonus pool · Commission · TB/người

**Row**:
- Donut cơ cấu: Cơ bản/Phụ cấp/Hoa hồng/Bonus/BHXH
- Tỷ lệ: Payroll/Rev, Bonus/Gross, Commission/Gross, Variable/Fixed
- **IncentiveSimulator** (client component)

**Row 2**: Payroll/phòng ban + Rule ngưỡng thưởng (5 tier cards)

**DataTable**: Nhân sự · Phòng ban · Cơ bản · Hoa hồng · Bonus · Gross · Net · Cost

---

## 8. Recruiting

**File**: `app/(app)/recruiting/page.tsx`

### Mục đích
Pipeline tuyển dụng — vị trí mở, ứng viên, skill gap, nguồn ứng viên.

### Pipeline stages
`Mới (32)` → `Screening (14)` → `Interview (6)` → `Offer (2)`

### Layout

**5 KPI Cards**: Vị trí mở · Headcount cần · Candidates · Time-to-hire · Skill gap

**Form requisition**: Vị trí · Phòng ban · Headcount → `createRequisitionAction()`

**Row**:
- Donut pipeline ứng viên theo stage
- Skill gap ProgressList: current/target per skill
- Nguồn ứng viên: Referral 38% / LinkedIn 24% / Website 20% / Other 18%

**DataTable**: Vị trí · Phòng ban · Số lượng · Ngày mở · Status (open/pipeline/closed)

---

## 9. OKR

**File**: `app/(app)/okr/page.tsx`

### Mục đích
Objectives & Key Results — mục tiêu chiến lược gắn với KPI.

### OBJ status
- `on_track` → Badge success
- `at_risk` → Badge warning  
- `progress_pct >= 100` → Done

### Layout

**5 KPI Cards**: Objectives · Company OBJ · On-track · At-risk · Progress TB

**Row**:
- Donut tiến độ OKR + chips
- OKR/phòng ban ProgressList
- Alignment KPI → OKR: mapping OBJ → KPI codes

**Grid OBJ Cards** (2 cột): Mỗi card = 1 Objective
- Level/Period/Status badges
- Title + Owner
- Progress bar (xanh≥80%, indigo≥50%, vàng<50%)
- Danh sách KR: actual / target + unit

---

## 10. Forecast

**File**: `app/(app)/forecast/page.tsx`

### Mục đích
What-if simulator — kéo slider KPI lá, xem cascade impact lên KPI cha và P&L.

### Cơ chế
- Client-side: `lib/kpi/cascade.simulateImpact()`
- Clone `kpi_actuals`, áp delta, propagate theo `weighted_avg`
- **Không ảnh hưởng data thật**

### Layout

**4 KPI Cards**: KPI lá điều chỉnh được · KPI company · Cascade depth (3 tầng) · Scenarios đã lưu

**Simulator**: Slider per KPI lá → thấy impact lên cây KPI và P&L

**Row hướng dẫn**:
- Câu hỏi mẫu (Sales -20%, CPL -10%, SLA +5%)
- Engine: JSONB AST, propagation weighted_avg
- Impact reference bảng

---

## 11. Alerts

**File**: `app/(app)/alerts/page.tsx`

### Mục đích
Trung tâm cảnh báo — xem tất cả alerts đang mở, resolve hoặc ẩn.

### Severity
`critical` (đỏ đậm) · `danger` (đỏ) · `warning` (vàng) · `info` (indigo)

### Rules đang chạy
- KPI < 85% threshold
- Task overdue > 2 ngày
- Chi phí vượt 5% budget
- Nhân sự > 10 task
- Cash < 10 tháng runway

### Layout

**4 KPI Cards**: Critical · Danger · Warning · Info

**Row phân tích**:
- Donut phân bổ severity
- Nhóm nguyên nhân: KPI / SLA / Workload / Cash / Compliance
- Rule đang hoạt động (list 5 live rules)

**Danh sách alerts**: Icon + severity badge + timestamp + title + detail JSON + buttons **Ẩn** và **Resolve** (`resolveAlertAction()`)

---

## Shared Components

| Component | Mô tả |
|-----------|-------|
| `KpiCard` | Card nhỏ: value, delta %, sparkline |
| `KpiHeroDonut` | Donut chart với segments |
| `AreaTrend` | Area chart xu hướng |
| `BarCompare` | Bar chart so sánh nhiều series |
| `ProgressList` | List với progress bar màu động |
| `ActivityFeed` | Feed hoạt động gần đây |
| `InsightCard` | Card insight + spark + tag |
| `StatChip` | Chip số liệu nhỏ gọn |
| `DataTable` | Table với render column tùy chỉnh |
| `KpiTreeGraph` | React Flow KPI tree (lazy) |
| `OrgGraph` | React Flow org chart (lazy) |
| `Simulator` | Forecast what-if sliders (client) |
| `IncentiveSimulator` | Bonus simulator (client) |
| `MiniCalendar` | Calendar highlight deadline |
