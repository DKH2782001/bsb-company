import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tServer } from "@/lib/i18n/server";
import { HELP } from "@/lib/help/content";
import {
  type LucideIcon,
  Rocket,
  Zap,
  MousePointerClick,
  GitBranch,
  Wallet,
} from "lucide-react";

type Loc = "vi" | "en";

const WORKFLOWS: { title: { vi: string; en: string }; icon: LucideIcon; steps: { vi: string[]; en: string[] } }[] = [
  {
    title: {
      vi: "Task → KPI → Tài chính (end-to-end)",
      en: "Task → KPI → Finance (end-to-end)",
    },
    icon: GitBranch,
    steps: {
      vi: [
        "CEO tạo KPI công ty ở /kpi (ví dụ REV = 5 tỷ/tháng).",
        "Dept Head tạo KPI phòng ban với parent = REV (ví dụ SAL.CLOSE).",
        "Team Lead giao task ở /operations và gắn linked_kpi_id.",
        "Nhân viên complete task → output đẩy lên KPI actual.",
        "KPI actual cập nhật → cascade lên KPI cha tự động.",
        "/compensation tính bonus dựa trên completion rate.",
        "/finance phản ánh revenue/cost vào P&L.",
        "/forecast cho phép what-if: 'Nếu KPI giảm 20%...' → xem impact.",
      ],
      en: [
        "CEO creates company KPI at /kpi (e.g. REV = 5B VND/month).",
        "Dept head creates dept KPI with parent = REV (e.g. SAL.CLOSE).",
        "Team lead assigns tasks at /operations with linked_kpi_id.",
        "Employees complete tasks → outputs roll up to KPI actual.",
        "KPI actuals update → cascade to parents automatically.",
        "/compensation computes bonuses based on completion rate.",
        "/finance reflects revenue/cost into the P&L.",
        "/forecast allows what-if: 'If KPI drops 20%...' → see impact.",
      ],
    },
  },
  {
    title: { vi: "Payroll cuối tháng", en: "Month-end payroll" },
    icon: Wallet,
    steps: {
      vi: [
        "Đầu tháng: chốt KPI kỳ trước ở /kpi.",
        "/compensation mở: hệ thống tính sẵn bonus theo rule.",
        "Rà soát bảng Payroll chi tiết, điều chỉnh nếu cần (tạo Approval).",
        "Duyệt adjustment ở /approvals.",
        "Chạy payroll → status 'closed' → audit log ghi nhận.",
        "/finance ghi nhận payroll cost vào cost center phòng ban.",
      ],
      en: [
        "Early month: finalize last period's KPIs at /kpi.",
        "Open /compensation: system pre-computes bonuses per rule.",
        "Review Payroll table, adjust if needed (creates an Approval).",
        "Approve adjustments at /approvals.",
        "Run payroll → status 'closed' → logged in audit.",
        "/finance books payroll cost into department cost centers.",
      ],
    },
  },
  {
    title: { vi: "Setup công ty lần đầu", en: "First-time company setup" },
    icon: Rocket,
    steps: {
      vi: [
        "Đăng ký tài khoản ở /signup.",
        "/settings: điền tên công ty, currency, timezone.",
        "Tạo cơ cấu: business_unit → department → team → position.",
        "Thêm nhân sự ở /people (hoặc import CSV ở Settings → Import).",
        "Gán role cho từng user qua user_roles.",
        "Tạo KPI công ty ở /kpi + cascade xuống phòng ban/cá nhân.",
        "Tạo compensation rules ở Settings.",
        "Chạy một kỳ payroll thử ở /compensation.",
        "Mở /dashboard theo dõi hằng ngày.",
      ],
      en: [
        "Sign up at /signup.",
        "/settings: fill in company name, currency, timezone.",
        "Build the structure: business_unit → department → team → position.",
        "Add employees at /people (or import CSV at Settings → Import).",
        "Assign roles to users via user_roles.",
        "Create company KPIs at /kpi + cascade down to departments/individuals.",
        "Configure compensation rules at Settings.",
        "Run a test payroll at /compensation.",
        "Open /dashboard for daily monitoring.",
      ],
    },
  },
];

const SCREEN_ORDER = [
  "/dashboard",
  "/org",
  "/departments",
  "/people",
  "/kpi",
  "/operations",
  "/compensation",
  "/projects",
  "/finance",
  "/reports",
  "/alerts",
  "/approvals",
  "/audit",
  "/okr",
  "/forecast",
  "/recruiting",
  "/knowledge",
  "/profile",
  "/settings",
];

export default async function GuidePage() {
  const { t, locale } = await tServer();
  const loc: Loc = locale;
  const vn = loc === "vi";

  const philosophy = vn
    ? {
        heading: "Triết lý BIZOS",
        p1: (
          <>
            Không phải HRM, không phải BI dashboard đơn thuần. BIZOS là{" "}
            <strong>Business Operating System</strong> — nơi mọi task hằng ngày, KPI, lương thưởng và
            tài chính đều được nối vào một chuỗi logic thống nhất:
          </>
        ),
        p2: (
          <>
            Mục tiêu: <em>nếu KPI cấp cá nhân được thiết kế đúng và đạt ngưỡng, thì KPI cấp team,
            phòng, và công ty cũng phải đạt.</em> Mọi thứ truy vết được.
          </>
        ),
        chain: [
          "Task hằng ngày",
          "KPI cá nhân",
          "KPI phòng ban",
          "KPI công ty",
          "Doanh thu · Lợi nhuận · Dòng tiền",
        ],
      }
    : {
        heading: "BIZOS philosophy",
        p1: (
          <>
            It&apos;s not an HRM, not a BI dashboard. BIZOS is a{" "}
            <strong>Business Operating System</strong> — every daily task, KPI, compensation item and
            financial line is wired into one unified logic:
          </>
        ),
        p2: (
          <>
            The goal: <em>if individual KPIs are designed right and hit target, team, department and
            company KPIs also hit.</em> Everything traceable.
          </>
        ),
        chain: [
          "Daily tasks",
          "Personal KPI",
          "Department KPI",
          "Company KPI",
          "Revenue · Profit · Cash",
        ],
      };

  const steps = vn
    ? [
        { title: "BƯỚC 1 · SETUP", href: "/settings", hrefLabel: "/settings", desc: "Điền thông tin công ty, tạo phòng ban, gán permissions." },
        { title: "BƯỚC 2 · DESIGN KPI", href: "/kpi", hrefLabel: "/kpi", desc: "Tạo KPI công ty → cascade xuống phòng ban → cá nhân. Gắn công thức JSONB." },
        { title: "BƯỚC 3 · VẬN HÀNH", href: "/operations", hrefLabel: "/operations", desc: "Giao task, gắn linked_kpi_id. Mở /dashboard theo dõi mỗi ngày." },
      ]
    : [
        { title: "STEP 1 · SETUP", href: "/settings", hrefLabel: "/settings", desc: "Fill company info, create departments, assign permissions." },
        { title: "STEP 2 · DESIGN KPIS", href: "/kpi", hrefLabel: "/kpi", desc: "Create company KPIs → cascade to departments → individuals. Attach JSONB formulas." },
        { title: "STEP 3 · OPERATE", href: "/operations", hrefLabel: "/operations", desc: "Assign tasks with linked_kpi_id. Open /dashboard daily." },
      ];

  const tips = vn
    ? [
        { h: "Demo mode", p: "Chưa điền Supabase env? App tự chạy với 14 employee, 14 KPI, payroll, finance mẫu. Mọi trang render đầy đủ — nút CRUD sẽ no-op." },
        { h: "Nút '?' ở mọi trang", p: "Mỗi page có icon ? bên phải tiêu đề — click để mở drawer hướng dẫn chi tiết với 2 tab: Quản trị viên và Nhân viên." },
        { h: "RLS multi-tenant", p: "Mỗi bảng có company_id. User chỉ đọc được data của công ty mình nhờ helper SQL current_company_id()." },
        { h: "KPI formula", p: 'Lưu dạng JSONB AST: {op:"mul",args:[{ref:"mql"},{ref:"close"}]}. Hỗ trợ sum/sub/mul/avg/weighted_avg/ratio/milestone/ref/const/manual.' },
      ]
    : [
        { h: "Demo mode", p: "No Supabase env yet? The app runs with 14 sample employees, 14 KPIs, payroll, finance. Every page renders — CRUD buttons are no-ops." },
        { h: "'?' button on every page", p: "Each page has a ? icon next to the title — click to open a detailed drawer with two tabs: Admin and User." },
        { h: "RLS multi-tenant", p: "Every table has company_id. Users only read their own company data via SQL helper current_company_id()." },
        { h: "KPI formula", p: 'Stored as JSONB AST: {op:"mul",args:[{ref:"mql"},{ref:"close"}]}. Supports sum/sub/mul/avg/weighted_avg/ratio/milestone/ref/const/manual.' },
      ];

  return (
    <div>
      <PageHeader
        helpKey="/guide"
        title={t("guide.title")}
        description={t("guide.subtitle")}
        actions={<Badge variant="info">{t("guide.version")}</Badge>}
      />

      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 mb-1">{philosophy.heading}</div>
              <p className="text-sm text-zinc-600 leading-relaxed">{philosophy.p1}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                {philosophy.chain.map((c, i) => (
                  <span key={c} className="inline-flex items-center gap-2">
                    <Badge variant={i === philosophy.chain.length - 1 ? "success" : "info"}>
                      {c}
                    </Badge>
                    {i < philosophy.chain.length - 1 && <span className="text-zinc-400">→</span>}
                  </span>
                ))}
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed mt-3">{philosophy.p2}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <MousePointerClick className="h-4 w-4 text-indigo-600" />
            {vn ? "Bắt đầu từ đâu?" : "Where to start?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {steps.map((s, i) => {
            const tone = i === 0 ? "indigo" : i === 1 ? "violet" : "emerald";
            const colorMap = {
              indigo: { bg: "bg-indigo-50/50", border: "border-indigo-100", text: "text-indigo-700", hover: "hover:text-indigo-700" },
              violet: { bg: "bg-violet-50/50", border: "border-violet-100", text: "text-violet-700", hover: "hover:text-violet-700" },
              emerald: { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-700", hover: "hover:text-emerald-700" },
            } as const;
            const c = colorMap[tone];
            return (
              <div key={s.title} className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
                <div className={`text-[11px] font-semibold ${c.text} uppercase mb-1`}>{s.title}</div>
                <Link href={s.href} className={`font-medium text-zinc-900 ${c.hover}`}>
                  {s.hrefLabel}
                </Link>
                <p className="text-xs text-zinc-600 mt-1">{s.desc}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-2">
          {vn ? "Quy trình tiêu biểu" : "Key workflows"}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {WORKFLOWS.map((w) => {
            const Icon = w.icon;
            return (
              <Card key={w.title[loc]}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[14px]">
                    <Icon className="h-4 w-4 text-indigo-600" />
                    {w.title[loc]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-1.5 text-[13px] text-zinc-700">
                    {w.steps[loc].map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-4 w-4 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <h2 className="text-sm font-semibold text-zinc-900 mb-2">
        {vn ? "19 màn hình — tóm tắt" : "19 screens — at a glance"}
      </h2>
      <p className="text-[12px] text-zinc-500 mb-3">
        {vn
          ? "Click 'Mở' để sang trang; bấm icon '?' trong trang đó để mở hướng dẫn chi tiết (tab Quản trị viên / Nhân viên)."
          : "Click 'Open' to visit; tap the '?' icon on that page for a detailed guide (Admin / User tabs)."}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCREEN_ORDER.map((href) => {
          const entry = HELP[href];
          if (!entry) return null;
          const Icon = entry.icon;
          return (
            <Card key={href}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-zinc-900 truncate">
                        {entry.label[loc]}
                      </div>
                      <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">
                        {entry.summary[loc]}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <code className="text-[11px] text-zinc-400">{href}</code>
                  <Link
                    href={href}
                    className="text-[11px] text-indigo-600 font-medium hover:underline"
                  >
                    {vn ? "Mở →" : "Open →"}
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-[14px]">{vn ? "Tips nhanh" : "Quick tips"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px] text-zinc-700">
          {tips.map((tip) => (
            <div key={tip.h} className="rounded-lg bg-zinc-50 p-3">
              <div className="font-semibold text-zinc-900 mb-1">{tip.h}</div>
              <p>{tip.p}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 mb-1">
                {vn ? "Cần tuỳ biến cho công ty?" : "Need a custom deployment?"}
              </div>
              <p className="text-sm text-zinc-600">
                {vn ? "Email" : "Email"}{" "}
                <a
                  href="mailto:alexle@titanlabs.vn"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  alexle@titanlabs.vn
                </a>{" "}
                (VN/EN). {vn ? "Ủng hộ PayPal" : "Donate PayPal"}:{" "}
                <a
                  href="https://www.paypal.com/paypalme/sai211dn"
                  className="text-rose-600 font-medium hover:underline"
                >
                  sai211dn@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
