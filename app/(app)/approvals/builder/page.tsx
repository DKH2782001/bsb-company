import { redirect } from "next/navigation";

export default function LegacyApprovalBuilderPage() {
  redirect("/approval/admin/createApproval");
}
