export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          currency: string;
          timezone: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
      };
      departments: {
        Row: {
          id: string;
          company_id: string;
          business_unit_id: string | null;
          name: string;
          code: string | null;
          head_employee_id: string | null;
          scope: string | null;
          budget_monthly: number | null;
          created_at: string;
        };
      };
      employees: {
        Row: {
          id: string;
          company_id: string;
          auth_user_id: string | null;
          code: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          department_id: string | null;
          team_id: string | null;
          position_id: string | null;
          manager_id: string | null;
          join_date: string | null;
          status: "active" | "onboarding" | "on_leave" | "terminated";
          base_salary: number | null;
          employment_type: "fulltime" | "parttime" | "contract" | "intern" | "freelance" | null;
          created_at: string;
          updated_at: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          auth_user_id: string;
          company_id: string;
          role: "ceo" | "cfo" | "hr_admin" | "dept_head" | "team_lead" | "employee" | "auditor";
          scope_department_id: string | null;
          scope_team_id: string | null;
          created_at: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          company_id: string;
          auth_user_id: string;
          locale: string;
          timezone: string;
          date_format: string;
          theme: string;
          compact_sidebar: boolean;
          notification_settings: Json;
          security_settings: Json;
          updated_at: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          company_id: string;
          auth_user_id: string;
          device_label: string;
          platform: string | null;
          browser: string | null;
          location_label: string | null;
          ip_address: string | null;
          last_seen_at: string;
          is_current: boolean;
          created_at: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          company_id: string;
          provider: string;
          config: Json;
          active: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          company_id: string;
          auth_user_id: string;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
      };
      kpis: {
        Row: {
          id: string;
          company_id: string;
          code: string | null;
          name: string;
          description: string | null;
          level: "company" | "department" | "team" | "employee";
          owner_employee_id: string | null;
          owner_department_id: string | null;
          owner_team_id: string | null;
          unit: string | null;
          target_frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
          weight: number | null;
          parent_kpi_id: string | null;
          data_source: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      kpi_targets: {
        Row: {
          id: string;
          kpi_id: string;
          period: string;
          target_value: number;
          note: string | null;
          created_at: string;
        };
      };
      kpi_actuals: {
        Row: {
          id: string;
          kpi_id: string;
          period: string;
          actual_value: number;
          completion_rate: number | null;
          status: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          reviewer_id: string | null;
          department_id: string | null;
          project_id: string | null;
          linked_kpi_id: string | null;
          priority: "low" | "normal" | "high" | "urgent";
          task_type: "growth" | "maintenance" | "admin" | "urgent";
          status: "todo" | "in_progress" | "blocked" | "review" | "done" | "cancelled";
          due_date: string | null;
          estimated_hours: number | null;
          actual_hours: number | null;
          recurrence_rule: string | null;
          blocked_reason: string | null;
          completion_proof: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      payroll_entries: {
        Row: {
          id: string;
          company_id: string;
          payroll_period_id: string;
          employee_id: string;
          base_salary: number | null;
          allowance_total: number | null;
          commission_total: number | null;
          bonus_total: number | null;
          penalty_total: number | null;
          adjustment_total: number | null;
          gross_pay: number | null;
          net_pay: number | null;
          company_cost: number | null;
          breakdown: Json | null;
          created_at: string;
        };
      };
      projects: {
        Row: {
          id: string;
          company_id: string;
          code: string | null;
          name: string;
          owner_id: string | null;
          business_case: string | null;
          status: "draft" | "active" | "paused" | "done" | "cancelled";
          starts_at: string | null;
          ends_at: string | null;
          budget: number | null;
          created_at: string;
        };
      };
      accounting_entries: {
        Row: {
          id: string;
          company_id: string;
          entry_date: string;
          account_code: string;
          debit: number | null;
          credit: number | null;
          cost_center_id: string | null;
          department_id: string | null;
          project_id: string | null;
          employee_id: string | null;
          note: string | null;
          created_at: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          company_id: string;
          rule_id: string | null;
          severity: "info" | "warning" | "danger" | "critical";
          title: string;
          detail: Json;
          resolved_at: string | null;
          created_at: string;
        };
      };
      approvals: {
        Row: {
          id: string;
          company_id: string;
          kind: string;
          title: string;
          payload: Json;
          status: "pending" | "approved" | "rejected" | "cancelled";
          requested_by: string | null;
          created_at: string;
        };
      };
      reports: {
        Row: {
          id: string;
          company_id: string;
          kind: string;
          period: string;
          payload: Json;
          generated_at: string;
        };
      };
      report_schedules: {
        Row: {
          id: string;
          company_id: string;
          kind: string;
          cron: string;
          recipients: Json;
          active: boolean;
        };
      };
      job_requisitions: {
        Row: {
          id: string;
          company_id: string;
          department_id: string | null;
          position_id: string | null;
          title: string;
          headcount: number | null;
          status: string;
          reason: string | null;
          opened_at: string | null;
          closed_at: string | null;
        };
      };
      sop_documents: {
        Row: {
          id: string;
          company_id: string;
          department_id: string | null;
          title: string;
          body: string | null;
          version: number | null;
          published: boolean | null;
          attachment_url: string | null;
          updated_at: string;
        };
      };
      objectives: {
        Row: {
          id: string;
          company_id: string;
          level: "company" | "department" | "team" | "employee";
          owner_employee_id: string | null;
          owner_department_id: string | null;
          title: string;
          description: string | null;
          period: string;
          status: string | null;
          progress_pct: number | null;
          created_at: string;
        };
      };
      key_results: {
        Row: {
          id: string;
          objective_id: string;
          title: string;
          target_value: number | null;
          actual_value: number | null;
          unit: string | null;
          progress_pct: number | null;
        };
      };
      app_settings: {
        Row: {
          id: string;
          company_id: string;
          settings: Json;
          updated_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          company_id: string;
          actor: string | null;
          action: string;
          entity: string | null;
          entity_id: string | null;
          before: Json | null;
          after: Json | null;
          created_at: string;
        };
      };
    };
  };
};

type TableName = keyof Database["public"]["Tables"];

export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
