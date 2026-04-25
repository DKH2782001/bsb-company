import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Network,
  Building2,
  Users,
  Target,
  ListChecks,
  Wallet,
  FolderKanban,
  Landmark,
  FileBarChart,
  Bell,
  CheckSquare,
  History,
  Flag,
  TrendingUp,
  UserPlus,
  BookOpen,
  UserCircle,
  Settings as SettingsIcon,
  HelpCircle,
} from "lucide-react";

export type HelpLocaleText = { vi: string; en: string };
export type HelpLocaleList = { vi: string[]; en: string[] };

export type HelpEntry = {
  icon: LucideIcon;
  label: HelpLocaleText;
  summary: HelpLocaleText;
  admin: HelpLocaleList;
  user: HelpLocaleList;
  tips?: HelpLocaleList;
};

export const HELP: Record<string, HelpEntry> = {
  "/dashboard": {
    icon: LayoutDashboard,
    label: { vi: "Dashboard", en: "Dashboard" },
    summary: {
      vi: "Ảnh chụp công ty trong 30 giây — 6 KPI chính, donut KPI tổng, trend 12 tháng.",
      en: "30-second company snapshot — 6 key KPIs, total KPI donut, 12-month trend.",
    },
    admin: {
      vi: [
        "Chọn cột KPI công ty muốn hiển thị ở Settings → KPI formula (REV/GP/NP/Ret…).",
        "Cấu hình ngưỡng màu: xanh ≥100%, vàng 85-99%, đỏ <85% ở Settings → Rules.",
        "Kiểm tra 3 insight card AI — nếu sai narrative, cập nhật weight ở KPI Tree.",
        "Check phòng ban đỏ/vàng → giao việc qua /approvals hoặc /operations.",
      ],
      en: [
        "Choose which company KPIs to show at Settings → KPI formula (REV/GP/NP/Ret…).",
        "Configure color thresholds: green ≥100%, amber 85–99%, red <85% at Settings → Rules.",
        "Review 3 AI insight cards — if the narrative is off, fix KPI weights in KPI Tree.",
        "Check red/amber departments → assign work via /approvals or /operations.",
      ],
    },
    user: {
      vi: [
        "Đọc 6 KPI card đầu trang — sparkline cho biết xu hướng 6-12 tháng.",
        "Donut ở giữa = tỷ lệ hoàn thành KPI công ty. Bấm vào để sang KPI Tree.",
        "Panel trái: KPI đang ở mức đỏ/vàng bạn cần chú ý.",
        "Panel phải: trend doanh thu — so sánh với target chấm đứt nét.",
      ],
      en: [
        "Read the 6 KPI cards — sparklines show 6–12 month trend.",
        "Center donut = company KPI completion. Click to jump to KPI Tree.",
        "Left panel: red/amber KPIs that need attention.",
        "Right panel: revenue trend with dashed target line.",
      ],
    },
    tips: {
      vi: ["Mở /dashboard mỗi sáng 9h là thói quen tốt.", "Hover sparkline để xem giá trị từng tháng."],
      en: ["Open /dashboard at 9 AM every morning.", "Hover sparkline to see monthly values."],
    },
  },

  "/org": {
    icon: Network,
    label: { vi: "Sơ đồ tổ chức", en: "Org chart" },
    summary: {
      vi: "Cơ cấu công ty dạng cây + KPI trung bình theo phòng ban.",
      en: "Company structure as a tree + average KPI per department.",
    },
    admin: {
      vi: [
        "Thêm/sửa phòng ban và báo cáo (reports_to) tại Settings → Structure.",
        "Gán Head cho từng phòng — Head sẽ tự được quyền xem KPI phòng đó.",
        "Rà 'Span of control': head >8 người → cân nhắc tách nhóm.",
        "Cập nhật payroll budget theo phòng → /compensation và /finance tự đồng bộ.",
      ],
      en: [
        "Add/edit departments and reports_to at Settings → Structure.",
        "Assign a head per department — heads auto-inherit read access to KPIs.",
        "Review 'Span of control': head with >8 reports → consider splitting.",
        "Update payroll budget per dept → /compensation and /finance sync automatically.",
      ],
    },
    user: {
      vi: [
        "Zoom/pan cây tổ chức bằng chuột hoặc 2 ngón (trackpad).",
        "Click node → xem chi tiết phòng ban hoặc cá nhân.",
        "Donut bên phải = KPI trung bình toàn công ty.",
        "Biểu đồ dưới = phân bổ nhân sự theo phòng ban.",
      ],
      en: [
        "Zoom/pan with mouse or two-finger trackpad gesture.",
        "Click a node → see department or person details.",
        "Right donut = company-wide average KPI.",
        "Bar chart = headcount by department.",
      ],
    },
  },

  "/departments": {
    icon: Building2,
    label: { vi: "Phòng ban", en: "Departments" },
    summary: {
      vi: "Mỗi phòng là cost center + KPI center — click để xem chi tiết.",
      en: "Each department is a cost + KPI center — click for detail.",
    },
    admin: {
      vi: [
        "Tạo phòng mới bằng nút '+ Thêm phòng ban' → nhập tên, head, budget.",
        "Cập nhật budget/tháng → ảnh hưởng tới /finance và alert budget.",
        "Phát hiện phòng 'bận rộn mà ít value': task admin/maintenance ratio cao.",
      ],
      en: [
        "Create a new dept via '+ Add department' → fill name, head, budget.",
        "Update monthly budget → feeds /finance and budget alerts.",
        "Spot 'busy but low-value' depts: high admin/maintenance task ratio.",
      ],
    },
    user: {
      vi: [
        "Click vào một phòng để xem KPI, danh sách nhân viên, task của phòng.",
        "Cột KPI completion màu đỏ = phòng đang dưới target.",
        "So sánh budget/actual ở cột phải.",
      ],
      en: [
        "Click a department to see its KPIs, employees, tasks.",
        "Red KPI completion = below target.",
        "Compare budget/actual in the right column.",
      ],
    },
  },

  "/people": {
    icon: Users,
    label: { vi: "Nhân sự", en: "People" },
    summary: {
      vi: "Directory + hồ sơ từng người với impact path từ KPI cá nhân → KPI công ty.",
      en: "Directory + per-employee profile with impact path to company KPIs.",
    },
    admin: {
      vi: [
        "Thêm nhân viên bằng nút '+ Thêm nhân sự' hoặc import CSV ở Settings.",
        "Gán role (ceo/hr_admin/dept_head…) ở Settings → Permissions.",
        "Điều chỉnh lương cơ bản — thay đổi sẽ tạo approval item.",
        "Gỡ/off-board: set status='inactive', audit log ghi lại.",
      ],
      en: [
        "Add an employee via '+ Add' or bulk-import CSV at Settings.",
        "Assign a role (ceo/hr_admin/dept_head…) at Settings → Permissions.",
        "Adjust base salary — creates an approval item.",
        "Off-board: set status='inactive', audit log records it.",
      ],
    },
    user: {
      vi: [
        "Search theo tên hoặc lọc theo phòng ban.",
        "Click 1 người → xem hero profile, lương, KPI cá nhân, skill.",
        "'Impact path' cuối trang: KPI cá nhân → phòng → công ty → revenue/profit.",
      ],
      en: [
        "Search by name or filter by department.",
        "Click a person → hero profile, compensation, personal KPIs, skills.",
        "Bottom 'Impact path': personal KPI → dept → company → revenue/profit.",
      ],
    },
  },

  "/kpi": {
    icon: Target,
    label: { vi: "KPI Tree", en: "KPI Tree" },
    summary: {
      vi: "Cascade KPI từ Company → Department → Team → Employee. Công thức JSONB.",
      en: "Cascade KPI Company → Department → Team → Employee. JSONB formulas.",
    },
    admin: {
      vi: [
        "Tạo KPI công ty (REV/GP/NP/RET) — đặt target, weight, công thức JSONB.",
        "Cascade xuống phòng ban: tạo KPI con với parent = KPI công ty.",
        "Công thức JSONB AST: {op:'mul', args:[{ref:'mql'},{ref:'close'}]}. Hỗ trợ sum/sub/mul/avg/weighted_avg/ratio/milestone/ref/const/manual.",
        "Đổi weight → reorder 'Top impact KPI' ngay lập tức.",
        "KPI thiếu actual sẽ báo đỏ — nhắc các phòng cập nhật.",
      ],
      en: [
        "Create company KPIs (REV/GP/NP/RET) — set target, weight, JSONB formula.",
        "Cascade to departments: new KPI with parent = company KPI.",
        "Formula JSONB AST: {op:'mul', args:[{ref:'mql'},{ref:'close'}]}. Supports sum/sub/mul/avg/weighted_avg/ratio/milestone/ref/const/manual.",
        "Changing weight → 'Top impact KPI' re-orders immediately.",
        "KPIs missing actuals turn red — chase depts to update.",
      ],
    },
    user: {
      vi: [
        "Xem 4 KPI công ty top + completion %.",
        "Cây KPI: màu xanh/vàng/đỏ = trạng thái. Click node xem detail.",
        "Cập nhật actual KPI của bạn (nếu là leaf KPI) → cascade tự lên KPI cha.",
        "Mở /forecast để mô phỏng 'nếu KPI tôi giảm 20% thì sao?'",
      ],
      en: [
        "See top 4 company KPIs + completion %.",
        "KPI tree: green/amber/red = status. Click a node for details.",
        "Update your leaf KPI actuals → rolls up automatically.",
        "Open /forecast to simulate 'what if my KPI drops 20%?'",
      ],
    },
  },

  "/operations": {
    icon: ListChecks,
    label: { vi: "Công việc", en: "Operations" },
    summary: {
      vi: "Task board 5 cột + lịch + workload + low-value detector.",
      en: "5-column task board + calendar + workload + low-value detector.",
    },
    admin: {
      vi: [
        "Định nghĩa rule SLA ở Settings: task >2 ngày = overdue.",
        "Xem workload theo người: ai >5 task → giãn việc.",
        "Low-value detector: task không gắn KPI + admin ratio cao = red flag cho phòng đó.",
        "Export task → XLSX để đưa vào review tuần.",
      ],
      en: [
        "Define SLA rule at Settings: task >2 days = overdue.",
        "Check workload per person: >5 tasks → rebalance.",
        "Low-value detector: tasks without KPI + high admin ratio = red flag.",
        "Export tasks → XLSX for weekly review.",
      ],
    },
    user: {
      vi: [
        "Kéo-thả task giữa 5 cột: To do / Đang làm / Review / Blocked / Done.",
        "Mỗi task phải có: priority, type (growth/maintenance), linked_kpi_id, due date.",
        "Đánh dấu Blocked + ghi lý do → Team Lead được báo.",
        "Hoàn thành task → actual KPI tự cập nhật nếu có linked_kpi.",
      ],
      en: [
        "Drag tasks across 5 columns: To do / In progress / Review / Blocked / Done.",
        "Each task needs: priority, type, linked_kpi_id, due date.",
        "Mark Blocked + reason → Team Lead is notified.",
        "Finish a task → actual KPI auto-updates if linked.",
      ],
    },
  },

  "/compensation": {
    icon: Wallet,
    label: { vi: "Lương thưởng", en: "Compensation" },
    summary: {
      vi: "Payroll snapshot + Incentive Simulator dùng rule engine 5 bậc.",
      en: "Payroll snapshot + Incentive Simulator using 5-tier rule engine.",
    },
    admin: {
      vi: [
        "Đầu tháng: chốt KPI kỳ trước ở /kpi.",
        "Hệ thống tính sẵn bonus theo rule: <80%=0x, ≥80%=0.5x, ≥90%=0.75x, ≥100%=1.0x, ≥120%=1.5x.",
        "Chỉnh bậc thưởng ở Settings → Bonus rules nếu cần.",
        "Điều chỉnh cá nhân → tạo approval item ở /approvals.",
        "Chạy payroll → status='closed' → /finance ghi nhận cost.",
      ],
      en: [
        "Early month: close prior-period KPIs at /kpi.",
        "System computes bonuses by rule: <80%=0x, ≥80%=0.5x, ≥90%=0.75x, ≥100%=1.0x, ≥120%=1.5x.",
        "Edit tiers at Settings → Bonus rules if needed.",
        "Adjust per employee → creates approval at /approvals.",
        "Run payroll → status='closed' → /finance books the cost.",
      ],
    },
    user: {
      vi: [
        "Xem lương kỳ này: gross / net / bonus / commission.",
        "Kéo slider Incentive Simulator: KPI cá nhân/team/công ty → bonus thay đổi real-time.",
        "Bảng chi tiết có pay slip từng người (chỉ xem được của bạn, trừ HR).",
      ],
      en: [
        "View this period's pay: gross / net / bonus / commission.",
        "Drag Incentive Simulator sliders (personal/team/company) to see bonus change live.",
        "Detail table has payslips (yours only, unless HR).",
      ],
    },
  },

  "/projects": {
    icon: FolderKanban,
    label: { vi: "Dự án", en: "Projects" },
    summary: {
      vi: "Initiative cross-functional với milestones và ROI tracking.",
      en: "Cross-functional initiatives with milestones and ROI.",
    },
    admin: {
      vi: [
        "Tạo project mới: owner, budget, timeline, business case.",
        "Gắn KPI công ty hoặc OKR → project hit target = KPI hit.",
        "Duyệt thay đổi budget ở /approvals.",
      ],
      en: [
        "Create a project: owner, budget, timeline, business case.",
        "Link a company KPI or OKR → project hit = KPI hit.",
        "Approve budget changes at /approvals.",
      ],
    },
    user: {
      vi: [
        "Lọc theo status: active / paused / draft / done.",
        "Click project → xem milestone, ROI, team.",
        "Cập nhật milestone của bạn — progress bar tự update.",
      ],
      en: [
        "Filter by status: active / paused / draft / done.",
        "Click a project → milestones, ROI, team.",
        "Update your milestones — progress bar updates automatically.",
      ],
    },
  },

  "/finance": {
    icon: Landmark,
    label: { vi: "Tài chính", en: "Finance" },
    summary: {
      vi: "P&L · Balance Sheet · Cash Flow · Budget vs Actual.",
      en: "P&L · Balance Sheet · Cash Flow · Budget vs Actual.",
    },
    admin: {
      vi: [
        "4 tab con: /pnl, /balance-sheet, /cashflow, /budget.",
        "Cập nhật khoản mục tại Settings → Chart of Accounts.",
        "Rà 'Budget vs Actual' — phòng vượt 5% sẽ có alert.",
        "Xuất PDF/XLSX cho họp board.",
      ],
      en: [
        "4 sub-tabs: /pnl, /balance-sheet, /cashflow, /budget.",
        "Update line items at Settings → Chart of Accounts.",
        "Review Budget vs Actual — depts over 5% get alerts.",
        "Export PDF/XLSX for board meetings.",
      ],
    },
    user: {
      vi: [
        "Chỉ CEO/CFO/Auditor thấy trang này (xem role ở topbar).",
        "6 KPI tài chính top có sparkline 12 tháng.",
        "Donut: cơ cấu chi phí theo phòng ban.",
      ],
      en: [
        "Only CEO/CFO/Auditor see this page (check role in topbar).",
        "Top 6 financial KPIs with 12-month sparklines.",
        "Donut: cost structure by department.",
      ],
    },
  },

  "/reports": {
    icon: FileBarChart,
    label: { vi: "Báo cáo", en: "Reports" },
    summary: {
      vi: "Snapshot báo cáo PDF/XLSX + lịch email tự động.",
      en: "PDF/XLSX report snapshots + auto email schedules.",
    },
    admin: {
      vi: [
        "Tạo báo cáo mới: chọn template (KPI tuần, payroll tháng, cash flow ngày).",
        "Đặt cron: hàng ngày/tuần/tháng. Chọn recipient list.",
        "Xem lượt tải để biết ai đang dùng report nào.",
      ],
      en: [
        "Create a report: pick template (weekly KPI, monthly payroll, daily cashflow).",
        "Schedule a cron: daily/weekly/monthly. Choose recipient list.",
        "Track download counts to see who's consuming what.",
      ],
    },
    user: {
      vi: [
        "Tải báo cáo PDF/XLSX đã tạo.",
        "Subscribe vào lịch email nếu muốn nhận định kỳ.",
      ],
      en: [
        "Download generated PDF/XLSX reports.",
        "Subscribe to an email schedule for recurring delivery.",
      ],
    },
  },

  "/alerts": {
    icon: Bell,
    label: { vi: "Cảnh báo", en: "Alerts" },
    summary: {
      vi: "Trung tâm cảnh báo phân loại theo mức: critical/danger/warning/info.",
      en: "Central alert hub by severity: critical/danger/warning/info.",
    },
    admin: {
      vi: [
        "Cấu hình rule ở Settings: KPI <85%, task >2 ngày, cost >5% budget, người >10 task.",
        "Gán owner cho mỗi loại alert → notification vào đúng người.",
        "Tắt/bật rule khi cần; mute tạm thời 24/48h.",
      ],
      en: [
        "Configure rules at Settings: KPI <85%, task >2 days, cost >5% budget, person >10 tasks.",
        "Assign an owner per alert type → routed to the right person.",
        "Enable/disable rules; mute temporarily for 24/48h.",
      ],
    },
    user: {
      vi: [
        "Donut phân bổ theo mức độ — ưu tiên critical trước.",
        "Click một alert → xem chi tiết + hành động 'Xử lý' hoặc 'Ẩn'.",
        "Ẩn alert cần lý do → đi vào audit log.",
      ],
      en: [
        "Severity donut — handle critical first.",
        "Click an alert → detail + 'Resolve' or 'Hide' action.",
        "Hiding requires a reason → goes into audit log.",
      ],
    },
  },

  "/approvals": {
    icon: CheckSquare,
    label: { vi: "Phê duyệt", en: "Approvals" },
    summary: {
      vi: "Duyệt KPI · thưởng · ngân sách · tuyển dụng trong một nơi.",
      en: "Approve KPIs · bonuses · budgets · hiring in one place.",
    },
    admin: {
      vi: [
        "Queue Pending: xem request, comment, duyệt/từ chối.",
        "SLA mục tiêu: 72% duyệt trong 24h.",
        "Filter theo loại: payroll adjustment, job req, KPI change, project budget.",
        "Chuyển giao (reassign) khi mình không phải đúng người duyệt.",
      ],
      en: [
        "Pending queue: read request, comment, approve/reject.",
        "Target SLA: 72% approved within 24h.",
        "Filter by kind: payroll adjustment, job req, KPI change, project budget.",
        "Reassign when you're not the right approver.",
      ],
    },
    user: {
      vi: [
        "Submit yêu cầu từ /compensation, /projects, /recruiting…",
        "Theo dõi trạng thái: Pending / Approved / Rejected / Cancelled.",
        "Nhận thông báo khi được duyệt — click qua trang liên quan.",
      ],
      en: [
        "Submit requests from /compensation, /projects, /recruiting…",
        "Track status: Pending / Approved / Rejected / Cancelled.",
        "Notified on approval — click through to the related page.",
      ],
    },
  },

  "/audit": {
    icon: History,
    label: { vi: "Audit Log", en: "Audit Log" },
    summary: {
      vi: "Ai · sửa gì · khi nào — truy vết 12 tháng. Chỉ CEO + Auditor + CFO xem.",
      en: "Who · changed what · when — 12-month traceability. CEO + Auditor + CFO only.",
    },
    admin: {
      vi: [
        "Filter theo actor, action (create/update/delete), entity, time range.",
        "Xem before/after JSON khi click 1 dòng — confirm thay đổi.",
        "Export log cho audit bên ngoài.",
        "Nếu thấy hành vi lạ → mở /settings → permissions để khoá ngay.",
      ],
      en: [
        "Filter by actor, action (create/update/delete), entity, time range.",
        "Click a row → before/after JSON.",
        "Export log for external audits.",
        "See anomalies → lock at /settings → permissions.",
      ],
    },
    user: {
      vi: ["Trang này chỉ dành cho CEO / CFO / Auditor. Nhân viên thường không thấy."],
      en: ["This page is CEO / CFO / Auditor only. Regular employees don't see it."],
    },
  },

  "/okr": {
    icon: Flag,
    label: { vi: "Mục tiêu OKR", en: "OKRs" },
    summary: {
      vi: "Objective + Key Results cascade theo quý/năm. Alignment với KPI Tree.",
      en: "Objectives + Key Results by quarter/year. Aligned with KPI Tree.",
    },
    admin: {
      vi: [
        "Đầu quý: tạo Objective công ty → cascade xuống phòng ban.",
        "Mỗi Objective có 2-5 Key Results — có deadline quý.",
        "Gắn KR với KPI trong /kpi → hệ thống tự tính progress.",
      ],
      en: [
        "Quarter start: create company Objectives → cascade to departments.",
        "Each Objective has 2–5 Key Results — with a quarter deadline.",
        "Link KRs to KPIs in /kpi → system auto-computes progress.",
      ],
    },
    user: {
      vi: [
        "Xem card từng Objective + progress bar + KR bên trong.",
        "Cập nhật check-in tuần của KR của bạn.",
      ],
      en: [
        "See Objective cards + progress bar + inner KRs.",
        "Submit weekly check-ins for your KRs.",
      ],
    },
  },

  "/forecast": {
    icon: TrendingUp,
    label: { vi: "Forecast", en: "Forecast" },
    summary: {
      vi: "What-if: kéo slider KPI lá → xem impact cascade lên KPI công ty và tài chính.",
      en: "What-if: drag leaf KPI sliders → see impact cascade up to company KPI & finance.",
    },
    admin: {
      vi: [
        "Chỉ CEO/CFO/Dept Head được xem.",
        "Kéo slider -30% → +30% cho mỗi KPI lá.",
        "Bên phải: REV/GP/NP/RET cập nhật real-time.",
        "Lưu scenario → chia sẻ trong họp board.",
      ],
      en: [
        "CEO/CFO/Dept Head only.",
        "Drag sliders -30% → +30% per leaf KPI.",
        "Right panel: REV/GP/NP/RET update in real time.",
        "Save scenarios → share in board meetings.",
      ],
    },
    user: {
      vi: ["Không có quyền nếu bạn là employee. Liên hệ Dept Head để được xem."],
      en: ["Employees don't have access. Contact your Dept Head."],
    },
  },

  "/recruiting": {
    icon: UserPlus,
    label: { vi: "Tuyển dụng", en: "Recruiting" },
    summary: {
      vi: "Job requisition + pipeline candidate + skill gap analysis.",
      en: "Job requisitions + candidate pipeline + skill gap.",
    },
    admin: {
      vi: [
        "Tạo job requisition → duyệt ở /approvals → mở đăng tuyển.",
        "Theo dõi pipeline: Mới → Screening → Interview → Offer.",
        "Skill gap: current vs target theo phòng — đề xuất training hoặc hiring.",
      ],
      en: [
        "Create a job requisition → approve at /approvals → publish.",
        "Track pipeline: New → Screening → Interview → Offer.",
        "Skill gap: current vs target per dept — suggest training or hiring.",
      ],
    },
    user: {
      vi: [
        "Submit request tuyển cho team của bạn (Dept Head).",
        "Xem vị trí mở + headcount cần tuyển.",
      ],
      en: [
        "Submit hiring request for your team (Dept Head).",
        "Browse open roles + headcount needed.",
      ],
    },
  },

  "/knowledge": {
    icon: BookOpen,
    label: { vi: "SOP / Playbook", en: "SOP / Playbook" },
    summary: {
      vi: "Quy trình chuẩn + playbook + checklist cho từng phòng.",
      en: "Standard operating procedures + playbooks + checklists per department.",
    },
    admin: {
      vi: [
        "Upload SOP mới — version control tự động.",
        "Chuyển draft → published khi phê duyệt xong.",
        "Gắn SOP với role/phòng → xuất hiện đúng nơi.",
      ],
      en: [
        "Upload a new SOP — auto versioning.",
        "Move draft → published after review.",
        "Tag SOP to role/dept → surfaces in the right place.",
      ],
    },
    user: {
      vi: [
        "Tìm SOP theo tên hoặc phòng ban.",
        "Dùng quick checklist: onboarding, qualify lead, close B2B, xử lý khiếu nại, payroll.",
        "Đánh dấu 'đã đọc' khi hoàn thành onboarding.",
      ],
      en: [
        "Search SOP by name or department.",
        "Use quick checklists: onboarding, lead qualification, B2B close, complaint, payroll.",
        "Mark 'read' after completing onboarding.",
      ],
    },
  },

  "/profile": {
    icon: UserCircle,
    label: { vi: "Tài khoản", en: "Account" },
    summary: {
      vi: "Thông tin + bảo mật + thiết bị + thông báo + tích hợp.",
      en: "Info + security + devices + notifications + integrations.",
    },
    admin: {
      vi: [
        "Reset password cho user khác ở Settings → Users.",
        "Theo dõi security score trung bình công ty ở Settings → Security.",
        "Bật bắt buộc 2FA cho role sensitive.",
      ],
      en: [
        "Reset a user's password at Settings → Users.",
        "Monitor company-wide security score at Settings → Security.",
        "Enforce 2FA for sensitive roles.",
      ],
    },
    user: {
      vi: [
        "Đổi mật khẩu + bật 2FA để nâng security score.",
        "Xem phiên đăng nhập + thiết bị — revoke phiên nếu lạ.",
        "Cấu hình notification toggles + ứng dụng kết nối.",
      ],
      en: [
        "Change password + enable 2FA to raise your security score.",
        "Review sessions + devices — revoke anything unfamiliar.",
        "Toggle notifications + connected apps.",
      ],
    },
  },

  "/settings": {
    icon: SettingsIcon,
    label: { vi: "Cài đặt", en: "Settings" },
    summary: {
      vi: "Company · Structure · Permissions · KPI formula · Comp rules · Integrations.",
      en: "Company · Structure · Permissions · KPI formula · Comp rules · Integrations.",
    },
    admin: {
      vi: [
        "Company: tên, mã, currency, timezone, logo.",
        "Structure: business_unit → department → team → position.",
        "Permissions: gán 7 role (ceo/cfo/hr_admin/dept_head/team_lead/employee/auditor).",
        "KPI Formula JSONB editor.",
        "Compensation rules: 5 bậc thưởng + multiplier phòng.",
        "Integrations: Slack, email, SSO, export APIs.",
      ],
      en: [
        "Company: name, code, currency, timezone, logo.",
        "Structure: business_unit → department → team → position.",
        "Permissions: 7 roles (ceo/cfo/hr_admin/dept_head/team_lead/employee/auditor).",
        "KPI formula JSONB editor.",
        "Compensation rules: 5 tiers + dept multiplier.",
        "Integrations: Slack, email, SSO, export APIs.",
      ],
    },
    user: { vi: ["Chỉ CEO / CFO / HR Admin thấy trang này."], en: ["CEO / CFO / HR Admin only."] },
  },

  "/guide": {
    icon: HelpCircle,
    label: { vi: "Hướng dẫn", en: "Guide" },
    summary: {
      vi: "Triết lý BIZOS + workflow end-to-end + link tới 19 màn hình chi tiết.",
      en: "BIZOS philosophy + end-to-end workflows + links to all 19 screens.",
    },
    admin: {
      vi: [
        "Đọc workflow 'Setup công ty lần đầu' trước khi onboard team.",
        "Chia sẻ trang guide cho nhân viên mới.",
        "Icon '?' ở mỗi trang mở drawer hướng dẫn — khuyến khích user dùng.",
      ],
      en: [
        "Read 'First-time company setup' before onboarding a team.",
        "Share the guide with new employees.",
        "The '?' icon on each page opens a help drawer — encourage usage.",
      ],
    },
    user: {
      vi: [
        "Đọc 'Triết lý BIZOS' để hiểu chuỗi: Task → KPI → Finance.",
        "Bấm 'Xem hướng dẫn' ở từng màn hình để có mẹo cụ thể.",
      ],
      en: [
        "Read 'BIZOS philosophy' to grasp: Task → KPI → Finance chain.",
        "Click 'View guide' on each screen for context-specific tips.",
      ],
    },
  },
};
