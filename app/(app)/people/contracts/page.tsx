import { Files, FolderOpen, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ContractsManager } from "@/components/contracts/ContractsManager";
import { fetchDepartments, fetchEmployees } from "@/lib/queries";
import {
  listContractAmendments,
  listEmployeeDependents,
  listEmployeeDocuments,
  listEmploymentContracts,
} from "@/lib/repositories/contracts";
import { getServiceClient } from "@/lib/repositories/shared";
import type { EmployeeDocument } from "@/types/domain";

async function withSignedDocumentUrls(documents: EmployeeDocument[]) {
  if (documents.length === 0) return [];

  try {
    const service = await getServiceClient();
    return await Promise.all(
      documents.map(async (document) => {
        const { data, error } = await service.storage.from("documents").createSignedUrl(document.storage_path, 60 * 60);
        return {
          ...document,
          file_url: error ? null : data.signedUrl,
        };
      }),
    );
  } catch {
    return documents.map((document) => ({ ...document, file_url: null }));
  }
}

export default async function ContractsPage() {
  const [contracts, amendments, documents, dependents, employees, departments] = await Promise.all([
    listEmploymentContracts(),
    listContractAmendments(),
    listEmployeeDocuments(),
    listEmployeeDependents(),
    fetchEmployees(),
    fetchDepartments(),
  ]);

  const contractsWithNames = contracts.map((contract) => ({
    ...contract,
    employee_name: employees.find((employee) => employee.id === contract.employee_id)?.full_name ?? "—",
    department_name: departments.find((department) => department.id === contract.department_id)?.name ?? "—",
  }));

  const amendmentsWithNames = amendments.map((amendment) => {
    const contract = contractsWithNames.find((item) => item.id === amendment.contract_id);
    const summary =
      typeof amendment.changes?.summary === "string"
        ? amendment.changes.summary
        : JSON.stringify(amendment.changes);
    return {
      ...amendment,
      contract_label: contract?.code ?? contract?.employee_name ?? "Hợp đồng",
      change_summary: summary,
    };
  });

  const documentsWithNames = (await withSignedDocumentUrls(documents)).map((document) => ({
    ...document,
    employee_name: employees.find((employee) => employee.id === document.employee_id)?.full_name ?? "—",
  }));

  const dependentsWithNames = dependents.map((dependent) => ({
    ...dependent,
    employee_name: employees.find((employee) => employee.id === dependent.employee_id)?.full_name ?? "—",
  }));

  const activeContracts = contractsWithNames.filter((contract) => contract.status === "active" || contract.status === "expiring_soon").length;
  const expiringSoon = contractsWithNames.filter((contract) => contract.status === "expiring_soon").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hợp đồng & Hồ sơ"
        description="Contract workspace · hồ sơ nhân sự · phụ lục · người phụ thuộc"
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Hợp đồng hiệu lực"
          value={String(activeContracts)}
          accent="indigo"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Sắp hết hạn 30 ngày"
          value={String(expiringSoon)}
          accent="amber"
          icon={<Files className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Hồ sơ đã lưu"
          value={String(documentsWithNames.length)}
          accent="emerald"
          icon={<FolderOpen className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Người phụ thuộc"
          value={String(dependentsWithNames.length)}
          accent="rose"
          icon={<Users className="h-3.5 w-3.5" />}
        />
      </div>

      <ContractsManager
        contracts={contractsWithNames}
        amendments={amendmentsWithNames}
        documents={documentsWithNames}
        dependents={dependentsWithNames}
        employees={employees}
      />
    </div>
  );
}
