export type ApprovalSubmitScope =
  | { type: "ALL"; ids: string[] }
  | { type: "DEPARTMENT"; ids: string[] }
  | { type: "ROLE"; ids: string[] }
  | { type: "USERS"; ids: string[] };

export type ApprovalTemplateBasicInfo = {
  icon: string;
  name: string;
  description: string;
  group: string;
  submitScope: ApprovalSubmitScope;
  showOnWorkplace: boolean;
  prohibitAdmin: boolean;
  administratorIds: string[];
};

export type ApprovalFieldType =
  | "input"
  | "textarea"
  | "text"
  | "short_answer"
  | "paragraph"
  | "description"
  | "number"
  | "amount"
  | "formula"
  | "radio"
  | "radioV2"
  | "checkbox"
  | "checkboxV2"
  | "single_select"
  | "multiple_select"
  | "date"
  | "dateInterval"
  | "date_range"
  | "fieldList"
  | "details_table"
  | "dataLink"
  | "data_link"
  | "image_video"
  | "image"
  | "imageV2"
  | "attachment"
  | "attachmentV2"
  | "connect"
  | "department"
  | "contact"
  | "contacts"
  | "link_approvals"
  | "linkApprovals"
  | "address"
  | "geolocation"
  | "phone"
  | "contact_no"
  | "serialNo"
  | "serial_no"
  | "signature";

export type ApprovalConditionGroup = {
  operator: "AND" | "OR";
  conditions: Array<ApprovalCondition | ApprovalConditionGroup>;
};

export type ApprovalCondition = {
  fieldId: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "is_empty";
  value?: unknown;
};

export type ApprovalFormField = {
  id: string;
  type: ApprovalFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  currency?: "VND" | "USD" | "EUR";
  options?: Array<{ label: string; value: string }>;
  formula?: string;
  visibility?: ApprovalConditionGroup;
  childFields?: ApprovalFormField[];
};

export type ApprovalFormSchema = {
  version: 1;
  fields: ApprovalFormField[];
};

export type ApprovalNodeType = "SUBMIT" | "APPROVAL" | "CC" | "CONDITION" | "HANDLER" | "END";

export type ApprovalApproverRule =
  | { kind: "MANAGER"; level: number; direction?: "BOTTOM_UP" | "TOP_DOWN" }
  | { kind: "DEPT_SUPERVISOR" }
  | { kind: "ROLE"; roleIds: string[] }
  | { kind: "USER_GROUP"; groupIds: string[] }
  | { kind: "SPECIFY"; userIds: string[] }
  | {
      kind: "REQUESTER_SELECT";
      selectionMethod: "MULTI" | "SINGLE";
      range?: { type: "WHOLE_COMPANY" | "SPECIFIED_MEMBER" | "SPECIFIED_ROLE"; ids?: string[] };
    }
  | { kind: "REQUESTER" }
  | { kind: "STEP_APPROVER"; stepId: string }
  | { kind: "MULTIPLE_SUPERVISORS" }
  | { kind: "MULTIPLE_DEPT_SUPERVISORS" }
  | { kind: "CONTACTS_IN_FORM"; fieldId: string }
  | { kind: "DEPARTMENTS_IN_FORM"; fieldId: string };

export type ApprovalProcessNode = {
  id: string;
  type: ApprovalNodeType;
  name: string;
  approverRule?: ApprovalApproverRule;
  approvalType?: "MANUAL" | "AUTO_APPROVE" | "AUTO_REJECT";
  multiApproverLogic?: "ALL_AGREE" | "ANY_AGREE" | "SEQUENTIAL";
  selfApprovalRule?: "SELF_REVIEW" | "AUTO_SKIP" | "FORWARD_MANAGER" | "FORWARD_DEPT_SUPERVISOR";
  formPermissions?: Record<string, "EDIT" | "READ" | "HIDDEN">;
  operationPermissions?: {
    canTransfer: boolean;
    canAddApprover: boolean;
    canRemoveApprover?: boolean;
    canReturn: boolean;
    canComment: boolean;
    canRejectToStep?: string;
  };
  emptyApproverRule?: "AUTO_SKIP" | "FORWARD_ADMIN" | "FORWARD_UPPER_MANAGER" | "CANCEL_REQUEST";
  reminderRule?: { afterHours: number; channels: Array<"email" | "inapp" | "push"> };
  timeoutRule?: { hours: number; action: "AUTO_APPROVE" | "AUTO_REJECT" | "ESCALATE_TO_MANAGER" };
};

export type ApprovalProcessSchema = {
  version: 1;
  nodes: ApprovalProcessNode[];
};

export type ApprovalTemplateDraft = {
  id: string;
  status: "draft" | "published" | "archived";
  basicInfo: ApprovalTemplateBasicInfo;
  formSchema: ApprovalFormSchema;
  processSchema: ApprovalProcessSchema;
  more: {
    notifyOnSubmit: boolean;
    notifyOnApprove: boolean;
    dataPermission: "submitter_and_approvers" | "all_admins" | "company";
    printTemplateEnabled: boolean;
    revokeWindow?: { allowed: boolean; beforeStep?: string; hoursAfterSubmit?: number };
    notificationChannels?: Array<"email" | "inapp" | "push">;
  };
};

export const approvalWidgetCatalog: Array<{
  group: string;
  items: Array<{ type: ApprovalFieldType; label: string }>;
}> = [
  {
    group: "Text",
    items: [
      { type: "input", label: "Input" },
      { type: "textarea", label: "Textarea" },
      { type: "text", label: "Static text" },
      { type: "short_answer", label: "Short answer" },
      { type: "paragraph", label: "Paragraph" },
      { type: "description", label: "Description" },
    ],
  },
  {
    group: "Numerical",
    items: [
      { type: "number", label: "Number" },
      { type: "amount", label: "Amount" },
      { type: "formula", label: "Formula" },
    ],
  },
  {
    group: "Selection",
    items: [
      { type: "radio", label: "Radio" },
      { type: "checkbox", label: "Checkbox" },
      { type: "single_select", label: "Single select" },
      { type: "multiple_select", label: "Multiple select" },
    ],
  },
  {
    group: "Date",
    items: [
      { type: "date", label: "Date" },
      { type: "dateInterval", label: "Date interval" },
      { type: "date_range", label: "Date range" },
    ],
  },
  {
    group: "Other",
    items: [
      { type: "fieldList", label: "Field list" },
      { type: "details_table", label: "Details/Table" },
      { type: "dataLink", label: "Data from Base" },
      { type: "image_video", label: "Image/Video" },
      { type: "image", label: "Image" },
      { type: "attachment", label: "Attachment" },
      { type: "attachmentV2", label: "Attachment V2" },
      { type: "connect", label: "Department picker" },
      { type: "department", label: "Department" },
      { type: "contact", label: "Contact picker" },
      { type: "contacts", label: "Contacts" },
      { type: "link_approvals", label: "Link approvals" },
      { type: "linkApprovals", label: "Link approvals V2" },
      { type: "address", label: "Address" },
      { type: "geolocation", label: "Geolocation" },
      { type: "phone", label: "Phone" },
      { type: "contact_no", label: "Contact no." },
      { type: "serialNo", label: "Serial no. V2" },
      { type: "serial_no", label: "Serial no." },
      { type: "signature", label: "Signature" },
    ],
  },
];

export const defaultApprovalTemplateDraft: ApprovalTemplateDraft = {
  id: "template_admin_payment",
  status: "draft",
  basicInfo: {
    icon: "cart",
    name: "PHIEU DE XUAT THANH TOAN HANH CHINH",
    description: "",
    group: "PHIEU KE TOAN",
    submitScope: { type: "ALL", ids: [] },
    showOnWorkplace: true,
    prohibitAdmin: false,
    administratorIds: ["e1"],
  },
  formSchema: {
    version: 1,
    fields: [
      { id: "field_full_name", type: "short_answer", label: "Ho Va Ten", placeholder: "Enter", required: true },
      { id: "field_department", type: "department", label: "Phong Ban", placeholder: "Enter", required: true },
      { id: "field_manager", type: "contacts", label: "Quan ly", placeholder: "Chon nguoi quan ly", required: true },
      { id: "field_reason", type: "paragraph", label: "Ly do thanh toan", placeholder: "Enter", required: true },
      { id: "field_item", type: "short_answer", label: "Muc thanh toan", placeholder: "Enter", required: true },
      { id: "field_unit_price", type: "amount", label: "Don gia", placeholder: "Enter amount", required: true, currency: "VND" },
      { id: "field_quantity", type: "number", label: "So luong", placeholder: "Enter", required: true },
      {
        id: "field_total",
        type: "formula",
        label: "Thanh tien",
        required: true,
        formula: "{{field_unit_price}} * {{field_quantity}}",
        currency: "VND",
      },
      { id: "field_invoice", type: "image", label: "Hoa don minh chung", placeholder: "Upload anh hoa don", required: true },
      { id: "field_account", type: "short_answer", label: "Chu tai khoan", placeholder: "Enter", required: true },
    ],
  },
  processSchema: {
    version: 1,
    nodes: [
      { id: "submit", type: "SUBMIT", name: "Submit" },
      {
        id: "approval_manager",
        type: "APPROVAL",
        name: "Quan ly duyet",
        approvalType: "MANUAL",
        approverRule: { kind: "CONTACTS_IN_FORM", fieldId: "field_manager" },
        multiApproverLogic: "ALL_AGREE",
        selfApprovalRule: "FORWARD_MANAGER",
        operationPermissions: { canTransfer: true, canAddApprover: true, canReturn: true, canComment: true },
      },
      {
        id: "approval_accounting",
        type: "APPROVAL",
        name: "Ke toan kiem tra",
        approvalType: "MANUAL",
        approverRule: { kind: "SPECIFY", userIds: ["e3"] },
        multiApproverLogic: "ALL_AGREE",
        selfApprovalRule: "AUTO_SKIP",
        operationPermissions: { canTransfer: true, canAddApprover: false, canReturn: true, canComment: true },
      },
      {
        id: "approval_bod",
        type: "APPROVAL",
        name: "BOD",
        approvalType: "MANUAL",
        approverRule: { kind: "SPECIFY", userIds: ["e1"] },
        multiApproverLogic: "ALL_AGREE",
        selfApprovalRule: "SELF_REVIEW",
        operationPermissions: { canTransfer: true, canAddApprover: true, canReturn: false, canComment: true },
      },
      {
        id: "handler_payment",
        type: "HANDLER",
        name: "Ke toan thanh toan",
        approverRule: { kind: "SPECIFY", userIds: ["e3"] },
      },
      { id: "end", type: "END", name: "End" },
    ],
  },
  more: {
    notifyOnSubmit: true,
    notifyOnApprove: true,
    dataPermission: "submitter_and_approvers",
    printTemplateEnabled: false,
  },
};

export function makeApprovalField(type: ApprovalFieldType, index: number): ApprovalFormField {
  const catalogItem = approvalWidgetCatalog.flatMap((group) => group.items).find((item) => item.type === type);
  const isSelect = ["single_select", "multiple_select", "radio", "radioV2", "checkbox", "checkboxV2"].includes(type);
  return {
    id: `field_${type}_${Date.now()}_${index}`,
    type,
    label: catalogItem?.label ?? "New field",
    placeholder: "Enter",
    required: false,
    currency: type === "amount" ? "VND" : undefined,
    options: isSelect
      ? [
          { label: "Option 1", value: "option_1" },
          { label: "Option 2", value: "option_2" },
        ]
      : undefined,
  };
}

export function processNodeToFlowStep(node: ApprovalProcessNode) {
  const approver =
    node.approverRule?.kind === "SPECIFY"
      ? node.approverRule.userIds[0] ?? null
      : node.approverRule?.kind === "CONTACTS_IN_FORM"
        ? null
        : null;
  return {
    label: node.name,
    approverEmployeeId: approver,
    approverRole: node.approverRule?.kind.toLowerCase() ?? node.type.toLowerCase(),
  };
}
