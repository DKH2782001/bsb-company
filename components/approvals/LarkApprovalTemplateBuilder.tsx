"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Bell, Check, ChevronRight, FileText, Plus, Settings, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { publishApprovalTemplateAction } from "@/app/(app)/approval/admin/actions";
import { createApprovalRequestAction } from "@/app/(app)/governance/actions";
import { ApprovalFormFieldRenderer } from "@/components/approvals/ApprovalFormFieldRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  approvalWidgetCatalog,
  defaultApprovalTemplateDraft,
  makeApprovalField,
  processNodeToFlowStep,
  type ApprovalApproverRule,
  type ApprovalFieldType,
  type ApprovalFormField,
  type ApprovalNodeType,
  type ApprovalProcessNode,
  type ApprovalTemplateDraft,
} from "@/lib/approvals/templateSchema";
import type { Department, Employee } from "@/types/domain";

const steps = ["Basic Info", "Form Design", "Process Design", "More"] as const;

function ruleLabel(rule?: ApprovalApproverRule, employees: Employee[] = []) {
  if (!rule) return "Not configured";
  if (rule.kind === "SPECIFY") {
    return rule.userIds.map((id) => employees.find((employee) => employee.id === id)?.full_name ?? id).join(", ");
  }
  if (rule.kind === "ROLE") return `Role: ${rule.roleIds.join(", ") || "not set"}`;
  if (rule.kind === "USER_GROUP") return `User group: ${rule.groupIds.join(", ") || "not set"}`;
  if (rule.kind === "STEP_APPROVER") return `Step approver: ${rule.stepId}`;
  if (rule.kind === "MULTIPLE_SUPERVISORS") return "Multiple supervisors";
  if (rule.kind === "MULTIPLE_DEPT_SUPERVISORS") return "Multiple department supervisors";
  if (rule.kind === "CONTACTS_IN_FORM") return `Contacts in form: ${rule.fieldId}`;
  if (rule.kind === "REQUESTER_SELECT") return "Requester self-selection";
  if (rule.kind === "MANAGER") return `Manager level ${rule.level}`;
  if (rule.kind === "DEPT_SUPERVISOR") return "Department supervisor";
  if (rule.kind === "REQUESTER") return "Requester";
  if (rule.kind === "DEPARTMENTS_IN_FORM") return `Departments in form: ${rule.fieldId}`;
  return "Unknown approver";
}

function nodeColor(type: ApprovalNodeType) {
  if (type === "SUBMIT" || type === "END") return "border-slate-300 bg-slate-100";
  if (type === "HANDLER") return "border-violet-500 bg-violet-50";
  if (type === "CC") return "border-sky-500 bg-sky-50";
  if (type === "CONDITION") return "border-amber-500 bg-amber-50";
  return "border-orange-500 bg-orange-50";
}

function fieldSupportsOptions(field: ApprovalFormField) {
  return ["single_select", "multiple_select", "radio", "radioV2", "checkbox", "checkboxV2"].includes(field.type);
}

function optionsToText(field: ApprovalFormField) {
  return (field.options ?? []).map((option) => option.label).join("\n");
}

function textToOptions(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label, index) => ({ label, value: `option_${index + 1}_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}` }));
}

function defaultNode(type: ApprovalNodeType, index: number, employeeId: string | null): ApprovalProcessNode {
  if (type === "CC") {
    return {
      id: `cc_${Date.now()}_${index}`,
      type,
      name: "CC nguoi lien quan",
      approverRule: { kind: "SPECIFY", userIds: employeeId ? [employeeId] : [] },
    };
  }
  if (type === "HANDLER") {
    return {
      id: `handler_${Date.now()}_${index}`,
      type,
      name: "Ke toan thanh toan",
      approverRule: { kind: "SPECIFY", userIds: employeeId ? [employeeId] : [] },
    };
  }
  if (type === "CONDITION") {
    return {
      id: `condition_${Date.now()}_${index}`,
      type,
      name: "Dieu kien",
    };
  }
  return {
    id: `approval_${Date.now()}_${index}`,
    type: "APPROVAL",
    name: `Cap duyet ${index}`,
    approvalType: "MANUAL",
    approverRule: { kind: "SPECIFY", userIds: employeeId ? [employeeId] : [] },
    multiApproverLogic: "ALL_AGREE",
    selfApprovalRule: "AUTO_SKIP",
    operationPermissions: { canTransfer: true, canAddApprover: true, canReturn: true, canComment: true },
    emptyApproverRule: "FORWARD_ADMIN",
  };
}

function PhonePreview({
  draft,
  selectedFieldId,
  onSelectField,
}: {
  draft: ApprovalTemplateDraft;
  selectedFieldId: string;
  onSelectField: (fieldId: string) => void;
}) {
  return (
    <div className="mx-auto w-[300px] rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_22px_44px_rgba(15,23,42,0.18)]">
      <div className="truncate border-b border-slate-100 px-2 pb-3 text-sm font-semibold text-slate-900">
        {draft.basicInfo.name}
      </div>
      <div className="space-y-1 py-2">
        {draft.formSchema.fields.map((field, index) => (
          <button
            key={field.id}
            type="button"
            onClick={() => onSelectField(field.id)}
            className={cn(
              "block w-full border-b border-slate-100 px-2 py-3 text-left transition-colors",
              selectedFieldId === field.id ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : "hover:bg-slate-50",
            )}
          >
            <div className="mb-1 text-[10px] font-semibold text-slate-400">#{index + 1}</div>
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="text-slate-900">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </span>
              <span className="text-xs text-slate-400">{field.placeholder ?? "Enter"}</span>
            </div>
            {["attachment", "attachmentV2", "image", "imageV2", "image_video", "signature"].includes(field.type) && (
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-2xl text-slate-400">
                +
              </div>
            )}
            {field.type === "formula" && <div className="mt-1 text-xs text-slate-400">{field.formula}</div>}
          </button>
        ))}
      </div>
      <div className="py-2 text-center text-xs text-blue-500">+ Click or drag widgets from the left</div>
    </div>
  );
}

export function LarkApprovalTemplateBuilder({
  employees,
  departments,
  initialTemplate = defaultApprovalTemplateDraft,
}: {
  employees: Employee[];
  departments: Department[];
  initialTemplate?: ApprovalTemplateDraft;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState<ApprovalTemplateDraft>(initialTemplate);
  const [selectedFieldId, setSelectedFieldId] = useState(initialTemplate.formSchema.fields[0]?.id ?? "");
  const [selectedNodeId, setSelectedNodeId] = useState("approval_manager");
  const [publishMessage, setPublishMessage] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeEmployees = employees.filter((employee) => employee.status !== "terminated");
  const selectedField = draft.formSchema.fields.find((field) => field.id === selectedFieldId) ?? null;
  const selectedNode = draft.processSchema.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const runtimeSteps = useMemo(
    () =>
      draft.processSchema.nodes
        .filter((node) => node.type === "APPROVAL" || node.type === "HANDLER")
        .map(processNodeToFlowStep)
        .filter((step) => step.label.trim()),
    [draft.processSchema.nodes],
  );

  function updateBasicInfo(patch: Partial<ApprovalTemplateDraft["basicInfo"]>) {
    setDraft((current) => ({ ...current, basicInfo: { ...current.basicInfo, ...patch } }));
  }

  function updateField(fieldId: string, patch: Partial<ApprovalFormField>) {
    setDraft((current) => ({
      ...current,
      formSchema: {
        ...current.formSchema,
        fields: current.formSchema.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
      },
    }));
  }

  function addField(type: ApprovalFieldType) {
    setDraft((current) => {
      const field = makeApprovalField(type, current.formSchema.fields.length + 1);
      setSelectedFieldId(field.id);
      return {
        ...current,
        formSchema: {
          ...current.formSchema,
          fields: [...current.formSchema.fields, field],
        },
      };
    });
  }

  function removeField(fieldId: string) {
    setDraft((current) => {
      const fields = current.formSchema.fields.filter((field) => field.id !== fieldId);
      setSelectedFieldId(fields[0]?.id ?? "");
      return { ...current, formSchema: { ...current.formSchema, fields } };
    });
  }

  function updateNode(nodeId: string, patch: Partial<ApprovalProcessNode>) {
    setDraft((current) => ({
      ...current,
      processSchema: {
        ...current.processSchema,
        nodes: current.processSchema.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
      },
    }));
  }

  function addNode(type: ApprovalNodeType) {
    setDraft((current) => {
      const insertIndex = Math.max(1, current.processSchema.nodes.length - 1);
      const node = defaultNode(type, insertIndex, activeEmployees[0]?.id ?? null);
      setSelectedNodeId(node.id);
      return {
        ...current,
        processSchema: {
          ...current.processSchema,
          nodes: [
            ...current.processSchema.nodes.slice(0, insertIndex),
            node,
            ...current.processSchema.nodes.slice(insertIndex),
          ],
        },
      };
    });
  }

  function removeNode(nodeId: string) {
    setDraft((current) => {
      const nodes = current.processSchema.nodes.filter(
        (node) => node.id !== nodeId || node.type === "SUBMIT" || node.type === "END",
      );
      setSelectedNodeId(nodes.find((node) => node.type === "APPROVAL")?.id ?? nodes[0]?.id ?? "");
      return { ...current, processSchema: { ...current.processSchema, nodes } };
    });
  }

  function setNodeApprover(node: ApprovalProcessNode, employeeId: string) {
    updateNode(node.id, { approverRule: { kind: "SPECIFY", userIds: employeeId ? [employeeId] : [] } });
  }

  async function publishTemplate() {
    const published = { ...draft, status: "published" as const };
    setIsPublishing(true);
    setPublishMessage("");
    const result = await publishApprovalTemplateAction(published);
    setIsPublishing(false);

    if (!result.ok) {
      setPublishMessage(result.error);
      return;
    }

    setDraft(published);
    setPublishMessage("Da publish mau phe duyet. Mau nay da hien o trang Gui yeu cau phe duyet.");
    try {
      window.localStorage.setItem("bizos.approval.publishedTemplate", JSON.stringify(published));
    } catch {
      // Demo persistence only.
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-[68px] items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Link href="/approval/admin" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="max-w-[360px] truncate text-sm font-semibold text-slate-900">{draft.basicInfo.name}</div>
          </div>
          <div className="flex items-center gap-8">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(index)}
                className={cn(
                  "flex h-[68px] items-center gap-2 border-b-2 px-1 text-sm transition-colors",
                  activeStep === index ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                    activeStep === index ? "border-blue-500 bg-blue-500 text-white" : "border-slate-400 text-slate-500",
                  )}
                >
                  {index + 1}
                </span>
                {step}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            {draft.status === "published" && <Badge variant="success">Published</Badge>}
            <Button type="button" size="sm" onClick={publishTemplate} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>
      {publishMessage && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-2 text-sm text-emerald-700">
          {publishMessage}
        </div>
      )}

      {activeStep === 0 && (
        <div className="mx-auto mt-6 max-w-[760px] rounded bg-white px-20 py-8 shadow-sm">
          <div className="space-y-5">
            <label className="block text-sm font-medium text-slate-900">
              Icon*
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <button type="button" className="text-sm text-blue-600">
                  Modify
                </button>
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-900">
              Name*
              <Input className="mt-2 rounded-none" value={draft.basicInfo.name} onChange={(event) => updateBasicInfo({ name: event.target.value })} />
            </label>
            <label className="block text-sm font-medium text-slate-900">
              Description
              <Input
                className="mt-2 rounded-none"
                value={draft.basicInfo.description}
                placeholder="Description"
                onChange={(event) => updateBasicInfo({ description: event.target.value })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-900">
              Group*
              <Input className="mt-2 rounded-none" value={draft.basicInfo.group} onChange={(event) => updateBasicInfo({ group: event.target.value })} />
            </label>
            <label className="block text-sm font-medium text-slate-900">
              Who can submit this request*
              <select
                className="mt-2 h-10 w-full border border-slate-300 bg-white px-3 text-sm"
                value={draft.basicInfo.submitScope.type}
                onChange={(event) =>
                  updateBasicInfo({
                    submitScope: { type: event.target.value as ApprovalTemplateDraft["basicInfo"]["submitScope"]["type"], ids: [] },
                  })
                }
              >
                <option value="ALL">All</option>
                <option value="DEPARTMENT">Department</option>
                <option value="ROLE">Role</option>
                <option value="USERS">Specific people</option>
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.basicInfo.showOnWorkplace}
                onChange={(event) => updateBasicInfo({ showOnWorkplace: event.target.checked })}
              />
              Show this approval on Workplace?
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.basicInfo.prohibitAdmin}
                onChange={(event) => updateBasicInfo({ prohibitAdmin: event.target.checked })}
              />
              Prohibit company administrators/App administrators/sub-administrators from managing processes and data
            </label>
            <div>
              <div className="text-sm font-medium text-slate-900">Process Administrator*</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-400 text-sm font-semibold text-white">
                  BH
                </div>
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{activeEmployees.find((employee) => employee.id === draft.basicInfo.administratorIds[0])?.full_name ?? "CEO"}</div>
                  <div className="text-xs text-slate-500">Permissions · Delete</div>
                </div>
                <button type="button" className="ml-8 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 1 && (
        <div className="grid min-h-[calc(100vh-68px)] grid-cols-[326px_1fr_330px]">
          <aside className="border-r border-slate-200 bg-white p-5">
            <div className="mb-4 flex gap-8 border-b border-slate-200 text-sm">
              <button type="button" className="border-b-2 border-blue-500 pb-3 text-blue-600">
                Widget
              </button>
              <button type="button" className="pb-3 text-slate-600">Widget Group</button>
            </div>
            <div className="space-y-5">
              {approvalWidgetCatalog.map((group) => (
                <div key={group.group}>
                  <div className="mb-2 text-sm font-medium text-slate-900">{group.group}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {group.items.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => addField(item.type)}
                        className="h-8 rounded border border-slate-200 bg-white px-2 text-left text-xs text-slate-600 hover:border-blue-400 hover:text-blue-600"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
          <main className="flex items-start justify-center bg-[#eef0f3] py-10">
            <PhonePreview draft={draft} selectedFieldId={selectedFieldId} onSelectField={setSelectedFieldId} />
          </main>
          <aside className="border-l border-slate-200 bg-white p-5">
            <div className="mb-4 text-sm font-semibold text-slate-900">Field properties</div>
            {selectedField ? (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-600">
                  Label
                  <Input className="mt-1" value={selectedField.label} onChange={(event) => updateField(selectedField.id, { label: event.target.value })} />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Placeholder
                  <Input
                    className="mt-1"
                    value={selectedField.placeholder ?? ""}
                    onChange={(event) => updateField(selectedField.id, { placeholder: event.target.value })}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Default value
                  <Input
                    className="mt-1"
                    value={
                      typeof selectedField.defaultValue === "string" || typeof selectedField.defaultValue === "number"
                        ? String(selectedField.defaultValue)
                        : ""
                    }
                    onChange={(event) => updateField(selectedField.id, { defaultValue: event.target.value })}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Description / help text
                  <Input
                    className="mt-1"
                    value={selectedField.description ?? ""}
                    onChange={(event) => updateField(selectedField.id, { description: event.target.value })}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(event) => updateField(selectedField.id, { required: event.target.checked })}
                  />
                  Required field
                </label>
                {(selectedField.type === "number" || selectedField.type === "amount") && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Min
                      <Input
                        className="mt-1"
                        type="number"
                        value={selectedField.validation?.min ?? ""}
                        onChange={(event) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...(selectedField.validation ?? {}),
                              min: event.target.value === "" ? undefined : Number(event.target.value),
                            },
                          })
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-600">
                      Max
                      <Input
                        className="mt-1"
                        type="number"
                        value={selectedField.validation?.max ?? ""}
                        onChange={(event) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...(selectedField.validation ?? {}),
                              max: event.target.value === "" ? undefined : Number(event.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                )}
                {fieldSupportsOptions(selectedField) && (
                  <label className="block text-xs font-medium text-slate-600">
                    Options, one per line
                    <textarea
                      className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      value={optionsToText(selectedField)}
                      onChange={(event) => updateField(selectedField.id, { options: textToOptions(event.target.value) })}
                    />
                  </label>
                )}
                {selectedField.type === "formula" && (
                  <label className="block text-xs font-medium text-slate-600">
                    Formula
                    <Input
                      className="mt-1"
                      value={selectedField.formula ?? ""}
                      onChange={(event) => updateField(selectedField.id, { formula: event.target.value })}
                    />
                  </label>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => removeField(selectedField.id)}>
                  <Trash2 className="h-4 w-4" />
                  Remove field
                </Button>
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
                  Click widget bên trái để thêm field. MVP hiện dùng click-add; drag/drop sẽ bổ sung ở phase tiếp theo nếu cần.
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Select a field to edit.</div>
            )}
            <div className="mt-5 space-y-2">
              {draft.formSchema.fields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => setSelectedFieldId(field.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left text-xs",
                    selectedFieldId === field.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600",
                  )}
                >
                  {field.label}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      {activeStep === 2 && (
        <div className="grid min-h-[calc(100vh-68px)] grid-cols-[1fr_480px]">
          <main className="overflow-auto bg-[#eef0f3] p-8">
            <div className="mb-5 flex justify-center gap-2">
              {(["APPROVAL", "CC", "CONDITION", "HANDLER"] as ApprovalNodeType[]).map((type) => (
                <Button key={type} type="button" size="sm" variant="outline" onClick={() => addNode(type)}>
                  <Plus className="h-4 w-4" />
                  {type}
                </Button>
              ))}
            </div>
            <div className="mx-auto max-w-[420px] space-y-3">
              {draft.processSchema.nodes.map((node, index) => (
                <div key={node.id}>
                  {index > 0 && (
                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-semibold text-blue-600 shadow">
                      +
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={cn(
                      "w-full rounded-lg border-2 p-2 text-left shadow-sm",
                      nodeColor(node.type),
                      selectedNodeId === node.id && "ring-2 ring-blue-400",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">{node.name}</span>
                      <Badge variant={node.type === "HANDLER" ? "info" : node.type === "APPROVAL" ? "warning" : "outline"}>
                        {node.type}
                      </Badge>
                    </div>
                    <div className="rounded bg-white px-2 py-2 text-sm text-slate-700">
                      {node.type === "APPROVAL" || node.type === "HANDLER" || node.type === "CC"
                        ? `Approver: ${ruleLabel(node.approverRule, employees)}`
                        : node.type === "SUBMIT"
                          ? "Submitted by: All members"
                          : node.type === "END"
                            ? "Workflow completed"
                            : "Condition branches"}
                      <ChevronRight className="float-right h-4 w-4 text-slate-400" />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </main>
          <aside className="border-l border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-lg font-semibold text-slate-900">{selectedNode?.name ?? "Node config"}</div>
              <Settings className="h-4 w-4 text-slate-400" />
            </div>
            {selectedNode ? (
              <div className="space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  Node name
                  <Input className="mt-2" value={selectedNode.name} onChange={(event) => updateNode(selectedNode.id, { name: event.target.value })} />
                </label>
                {(selectedNode.type === "APPROVAL" || selectedNode.type === "HANDLER" || selectedNode.type === "CC") && (
                  <>
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-900">Approval type</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {(["MANUAL", "AUTO_APPROVE", "AUTO_REJECT"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateNode(selectedNode.id, { approvalType: type })}
                            className={cn(
                              "rounded-xl border px-2 py-2",
                              (selectedNode.approvalType ?? "MANUAL") === type ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200",
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-900">Set approver</div>
                      <select
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                        value={selectedNode.approverRule?.kind === "SPECIFY" ? selectedNode.approverRule.userIds[0] ?? "" : ""}
                        onChange={(event) => setNodeApprover(selectedNode, event.target.value)}
                      >
                        <option value="">Choose employee</option>
                        {activeEmployees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {[
                          ["MANAGER", "Manager"],
                          ["DEPT_SUPERVISOR", "Department supervisor"],
                          ["ROLE", "Role"],
                          ["USER_GROUP", "User group"],
                          ["REQUESTER_SELECT", "Requester self-selection"],
                          ["REQUESTER", "Requester"],
                          ["STEP_APPROVER", "Step approver"],
                          ["MULTIPLE_SUPERVISORS", "Multiple supervisors"],
                          ["MULTIPLE_DEPT_SUPERVISORS", "Multiple dept supervisors"],
                          ["CONTACTS_IN_FORM", "Contacts in the form"],
                          ["DEPARTMENTS_IN_FORM", "Departments in the form"],
                        ].map(([kind, label]) => (
                          <button
                            key={kind}
                            type="button"
                            onClick={() =>
                              updateNode(selectedNode.id, {
                                approverRule:
                                  kind === "MANAGER"
                                    ? { kind: "MANAGER", level: 1 }
                                    : kind === "DEPT_SUPERVISOR"
                                      ? { kind: "DEPT_SUPERVISOR" }
                                      : kind === "ROLE"
                                        ? { kind: "ROLE", roleIds: ["finance"] }
                                        : kind === "USER_GROUP"
                                          ? { kind: "USER_GROUP", groupIds: ["approval_admins"] }
                                      : kind === "REQUESTER_SELECT"
                                        ? {
                                            kind: "REQUESTER_SELECT",
                                            selectionMethod: "SINGLE",
                                            range: { type: "WHOLE_COMPANY" },
                                          }
                                        : kind === "REQUESTER"
                                          ? { kind: "REQUESTER" }
                                          : kind === "STEP_APPROVER"
                                            ? { kind: "STEP_APPROVER", stepId: draft.processSchema.nodes.find((node) => node.type === "APPROVAL")?.id ?? "approval_manager" }
                                            : kind === "MULTIPLE_SUPERVISORS"
                                              ? { kind: "MULTIPLE_SUPERVISORS" }
                                              : kind === "MULTIPLE_DEPT_SUPERVISORS"
                                                ? { kind: "MULTIPLE_DEPT_SUPERVISORS" }
                                                : kind === "DEPARTMENTS_IN_FORM"
                                                  ? { kind: "DEPARTMENTS_IN_FORM", fieldId: draft.formSchema.fields.find((field) => field.type === "department" || field.type === "connect")?.id ?? "field_department" }
                                                  : { kind: "CONTACTS_IN_FORM", fieldId: draft.formSchema.fields.find((field) => field.type === "contacts" || field.type === "contact")?.id ?? "field_manager" },
                              })
                            }
                            className="rounded-xl border border-slate-200 px-2 py-2 text-left hover:border-blue-400 hover:text-blue-600"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-900">Multiple approvers logic</div>
                      <div className="space-y-2 text-sm text-slate-700">
                        {(["ALL_AGREE", "ANY_AGREE", "SEQUENTIAL"] as const).map((logic) => (
                          <label key={logic} className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={(selectedNode.multiApproverLogic ?? "ALL_AGREE") === logic}
                              onChange={() => updateNode(selectedNode.id, { multiApproverLogic: logic })}
                            />
                            {logic}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {selectedNode.type !== "SUBMIT" && selectedNode.type !== "END" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeNode(selectedNode.id)}>
                    <Trash2 className="h-4 w-4" />
                    Remove node
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Select a node to configure.</div>
            )}
          </aside>
        </div>
      )}

      {activeStep === 3 && (
        <div className="mx-auto mt-6 max-w-[860px] rounded bg-white p-8 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm">
              <Bell className="h-5 w-5 text-blue-500" />
              <input
                type="checkbox"
                checked={draft.more.notifyOnSubmit}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, more: { ...current.more, notifyOnSubmit: event.target.checked } }))
                }
              />
              Notify when request is submitted
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm">
              <Check className="h-5 w-5 text-emerald-500" />
              <input
                type="checkbox"
                checked={draft.more.notifyOnApprove}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, more: { ...current.more, notifyOnApprove: event.target.checked } }))
                }
              />
              Notify when a step is approved
            </label>
            <label className="block rounded-2xl border border-slate-200 p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-medium text-slate-900">
                <Users className="h-5 w-5 text-violet-500" />
                Data permission
              </div>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 px-3"
                value={draft.more.dataPermission}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    more: { ...current.more, dataPermission: event.target.value as ApprovalTemplateDraft["more"]["dataPermission"] },
                  }))
                }
              >
                <option value="submitter_and_approvers">Submitter and approvers</option>
                <option value="all_admins">All approval admins</option>
                <option value="company">Whole company</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm">
              <FileText className="h-5 w-5 text-orange-500" />
              <input
                type="checkbox"
                checked={draft.more.printTemplateEnabled}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, more: { ...current.more, printTemplateEnabled: event.target.checked } }))
                }
              />
              Enable print template
            </label>
            <label className="block rounded-2xl border border-slate-200 p-4 text-sm">
              <div className="mb-2 font-medium text-slate-900">Notification channels</div>
              <div className="grid gap-2 text-slate-700">
                {(["inapp", "email", "push"] as const).map((channel) => {
                  const selected = draft.more.notificationChannels?.includes(channel) ?? channel === "inapp";
                  return (
                    <label key={channel} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) =>
                          setDraft((current) => {
                            const currentChannels = current.more.notificationChannels ?? ["inapp"];
                            const nextChannels = event.target.checked
                              ? Array.from(new Set([...currentChannels, channel]))
                              : currentChannels.filter((item) => item !== channel);
                            return { ...current, more: { ...current.more, notificationChannels: nextChannels } };
                          })
                        }
                      />
                      {channel}
                    </label>
                  );
                })}
              </div>
            </label>
            <label className="block rounded-2xl border border-slate-200 p-4 text-sm">
              <div className="mb-2 font-medium text-slate-900">Revoke window</div>
              <div className="grid gap-3">
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.more.revokeWindow?.allowed ?? false}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        more: {
                          ...current.more,
                          revokeWindow: {
                            ...(current.more.revokeWindow ?? {}),
                            allowed: event.target.checked,
                            hoursAfterSubmit: current.more.revokeWindow?.hoursAfterSubmit ?? 24,
                          },
                        },
                      }))
                    }
                  />
                  Cho phep nguoi gui thu hoi request
                </label>
                <Input
                  type="number"
                  value={draft.more.revokeWindow?.hoursAfterSubmit ?? 24}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      more: {
                        ...current.more,
                        revokeWindow: {
                          ...(current.more.revokeWindow ?? { allowed: false }),
                          hoursAfterSubmit: Number(event.target.value),
                        },
                      },
                    }))
                  }
                />
              </div>
            </label>
          </div>
        </div>
      )}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Preview phiếu đề xuất"
        description="Form preview tach rieng khoi phan cau hinh. Request test se di theo flow dang publish."
        size="lg"
      >
        <form action={createApprovalRequestAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="kind" value="project_budget" />
          <input type="hidden" name="title" value={draft.basicInfo.name} />
          <input type="hidden" name="requestedBy" value="e1" />
          <input type="hidden" name="amount" value="150000000" />
          <input type="hidden" name="note" value="Submitted from approval template preview" />
          {draft.formSchema.fields.map((field) => (
            <ApprovalFormFieldRenderer key={field.id} field={field} employees={employees} departments={departments} />
          ))}
          {runtimeSteps.map((step, index) => (
            <div key={`${step.label}-${index}`}>
              <input type="hidden" name="flowStepLabel" value={step.label} />
              <input type="hidden" name="flowStepApproverId" value={step.approverEmployeeId ?? "e1"} />
              <input type="hidden" name="flowStepRole" value={step.approverRole ?? "manual"} />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button type="submit" className="w-full" disabled={draft.status !== "published"}>
              Submit request bằng form preview
            </Button>
            {draft.status !== "published" && (
              <div className="mt-2 text-xs text-blue-700">
                Cần bấm Publish trước khi submit phiếu đề xuất.
              </div>
            )}
          </div>
        </form>
      </Dialog>
    </div>
  );
}
