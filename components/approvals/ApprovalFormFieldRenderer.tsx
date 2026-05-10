"use client";

import { useRef, useState } from "react";
import { Camera, FileUp, MapPin, PenLine, Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { ApprovalFormField } from "@/lib/approvals/templateSchema";
import type { Department, Employee } from "@/types/domain";

type Props = {
  field: ApprovalFormField;
  employees: Employee[];
  departments: Department[];
};

const optionTypes = ["single_select", "multiple_select", "radio", "radioV2", "checkbox", "checkboxV2"];
const fileTypes = ["attachment", "attachmentV2"];
const imageTypes = ["image", "imageV2"];
const contactTypes = ["contacts", "contact"];
const departmentTypes = ["department", "connect"];
const dateRangeTypes = ["date_range", "dateInterval"];

function labelRequired(field: ApprovalFormField) {
  return field.required ? <span className="text-red-500">*</span> : null;
}

function baseInputClass() {
  return "mt-1 h-11 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 text-sm text-[var(--text-strong)]";
}

function FieldShell({
  field,
  children,
  fullWidth = false,
}: {
  field: ApprovalFormField;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <label className={`block text-xs font-medium text-[var(--text-soft)] ${fullWidth ? "md:col-span-2" : ""}`}>
      {field.label}
      {labelRequired(field)}
      {field.description && <div className="mt-1 text-[11px] font-normal text-[var(--text-soft)]">{field.description}</div>}
      <input type="hidden" name="designedFieldId" value={field.id} />
      <input type="hidden" name="designedFieldLabel" value={field.label} />
      <input type="hidden" name="designedFieldType" value={field.type} />
      <input type="hidden" name="designedFieldFormula" value={field.formula ?? ""} />
      {children}
    </label>
  );
}

function SignatureField({ field }: { field: ApprovalFormField }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [value, setValue] = useState("");

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function saveCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setValue(canvas.toDataURL("image/png"));
  }

  return (
    <FieldShell field={field} fullWidth>
      <div className="mt-2 rounded-2xl border border-[var(--line-soft)] bg-white p-3">
        <canvas
          ref={canvasRef}
          width={720}
          height={180}
          className="h-36 w-full touch-none rounded-xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-alt)]"
          onPointerDown={(event) => {
            const canvas = canvasRef.current;
            const p = point(event);
            if (!canvas || !p) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.strokeStyle = "#172554";
            ctx.beginPath();
            ctx.moveTo(p.x * (canvas.width / canvas.clientWidth), p.y * (canvas.height / canvas.clientHeight));
            setDrawing(true);
          }}
          onPointerMove={(event) => {
            if (!drawing) return;
            const canvas = canvasRef.current;
            const p = point(event);
            if (!canvas || !p) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.lineTo(p.x * (canvas.width / canvas.clientWidth), p.y * (canvas.height / canvas.clientHeight));
            ctx.stroke();
            saveCanvas();
          }}
          onPointerUp={() => {
            setDrawing(false);
            saveCanvas();
          }}
          onPointerLeave={() => setDrawing(false)}
        />
        <input type="hidden" name={`formField:${field.id}`} value={value} required={field.required && !value} />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
            <PenLine className="h-4 w-4" />
            Ky truc tiep tren khung nay
          </div>
          <button
            type="button"
            className="rounded-full border border-[var(--line-soft)] px-3 py-1 text-xs"
            onClick={() => {
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext("2d");
              if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
              setValue("");
            }}
          >
            Xoa chu ky
          </button>
        </div>
      </div>
    </FieldShell>
  );
}

function GeolocationField({ field }: { field: ApprovalFormField }) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("Chua lay vi tri");

  return (
    <FieldShell field={field}>
      <input type="hidden" name={`formField:${field.id}`} value={value} required={field.required && !value} />
      <button
        type="button"
        className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 text-sm text-[var(--text-strong)]"
        onClick={() => {
          if (!navigator.geolocation) {
            setMessage("Trinh duyet khong ho tro lay vi tri");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const next = `${position.coords.latitude},${position.coords.longitude}`;
              setValue(next);
              setMessage(next);
            },
            () => setMessage("Khong lay duoc vi tri"),
          );
        }}
      >
        <MapPin className="h-4 w-4" />
        Lay vi tri hien tai
      </button>
      <div className="mt-1 text-[11px] font-normal text-[var(--text-soft)]">{message}</div>
    </FieldShell>
  );
}

function DetailsTableField({ field }: { field: ApprovalFormField }) {
  const [rows, setRows] = useState([0]);
  const childFields =
    field.childFields && field.childFields.length > 0
      ? field.childFields
      : [
          { id: `${field.id}_item`, type: "input" as const, label: "Hang muc", required: false },
          { id: `${field.id}_amount`, type: "amount" as const, label: "So tien", required: false, currency: "VND" as const },
        ];

  return (
    <FieldShell field={field} fullWidth>
      <div className="mt-2 space-y-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
        {rows.map((row) => (
          <div key={row} className="grid gap-2 rounded-xl bg-white p-3 md:grid-cols-[1fr_160px_36px]">
            {childFields.map((child) => (
              <Input
                key={child.id}
                name={`formField:${field.id}`}
                required={field.required}
                type={child.type === "amount" || child.type === "number" ? "number" : "text"}
                placeholder={child.label}
              />
            ))}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line-soft)]"
              onClick={() => setRows((current) => current.filter((item) => item !== row))}
              aria-label="Xoa dong"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-strong)]"
          onClick={() => setRows((current) => [...current, Date.now()])}
        >
          <Plus className="h-4 w-4" />
          Them dong
        </button>
      </div>
    </FieldShell>
  );
}

export function ApprovalFormFieldRenderer({ field, employees, departments }: Props) {
  if (field.type === "description" || field.type === "text") {
    return (
      <div className="md:col-span-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] px-3.5 py-3 text-sm text-[var(--text-soft)]">
        <input type="hidden" name="designedFieldId" value={field.id} />
        <input type="hidden" name="designedFieldLabel" value={field.label} />
        <input type="hidden" name="designedFieldType" value={field.type} />
        <input type="hidden" name="designedFieldFormula" value={field.formula ?? ""} />
        <div className="font-semibold text-[var(--text-strong)]">{field.label}</div>
        <div className="mt-1">{field.description || field.placeholder || "Noi dung huong dan"}</div>
      </div>
    );
  }

  if (field.type === "signature") return <SignatureField field={field} />;
  if (field.type === "geolocation") return <GeolocationField field={field} />;
  if (field.type === "details_table" || field.type === "fieldList") return <DetailsTableField field={field} />;

  if (field.type === "paragraph" || field.type === "textarea") {
    return (
      <FieldShell field={field} fullWidth>
        <textarea
          name={`formField:${field.id}`}
          required={field.required}
          placeholder={field.placeholder ?? "Nhap noi dung"}
          defaultValue={typeof field.defaultValue === "string" ? field.defaultValue : undefined}
          className="mt-1 min-h-24 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-2 text-sm text-[var(--text-strong)]"
        />
      </FieldShell>
    );
  }

  if (field.type === "amount") {
    return (
      <FieldShell field={field}>
        <div className="mt-1 flex h-11 overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)]">
          <span className="flex items-center border-r border-[var(--line-soft)] px-3 text-xs text-[var(--text-soft)]">
            {field.currency ?? "VND"}
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--text-strong)] outline-none"
            name={`formField:${field.id}`}
            required={field.required}
            type="number"
            min={field.validation?.min}
            max={field.validation?.max}
            placeholder={field.placeholder ?? "Nhap so tien"}
          />
        </div>
      </FieldShell>
    );
  }

  if (field.type === "formula") {
    return (
      <FieldShell field={field}>
        <Input
          className="mt-1"
          readOnly
          value={field.formula ? `Tu tinh: ${field.formula}` : "Tu tinh theo cong thuc"}
        />
      </FieldShell>
    );
  }

  if (field.type === "date_range" || dateRangeTypes.includes(field.type)) {
    return (
      <FieldShell field={field}>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <Input name={`formField:${field.id}`} required={field.required} type="date" />
          <Input name={`formField:${field.id}`} required={field.required} type="date" />
        </div>
      </FieldShell>
    );
  }

  if (field.type === "single_select" || field.type === "radio" || field.type === "radioV2") {
    if (field.type === "radio" || field.type === "radioV2") {
      return (
        <FieldShell field={field}>
          <div className="mt-2 grid gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] p-3">
            {(field.options ?? []).map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-[var(--text-strong)]">
                <input type="radio" name={`formField:${field.id}`} value={option.value} required={field.required} />
                {option.label}
              </label>
            ))}
          </div>
        </FieldShell>
      );
    }

    return (
      <FieldShell field={field}>
        <select name={`formField:${field.id}`} required={field.required} defaultValue="" className={baseInputClass()}>
          <option value="">Chon gia tri</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  if (optionTypes.includes(field.type)) {
    return (
      <FieldShell field={field}>
        <div className="mt-2 grid gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] p-3">
          {(field.options ?? []).map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-[var(--text-strong)]">
              <input type="checkbox" name={`formField:${field.id}`} value={option.value} />
              {option.label}
            </label>
          ))}
        </div>
      </FieldShell>
    );
  }

  if (contactTypes.includes(field.type)) {
    return (
      <FieldShell field={field}>
        <select name={`formField:${field.id}`} required={field.required} defaultValue="" className={baseInputClass()}>
          <option value="">Chon nhan su</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  if (departmentTypes.includes(field.type)) {
    return (
      <FieldShell field={field}>
        <select name={`formField:${field.id}`} required={field.required} defaultValue="" className={baseInputClass()}>
          <option value="">Chon phong ban</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  if (fileTypes.includes(field.type)) {
    return (
      <FieldShell field={field} fullWidth>
        <div className="mt-1 rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--input-bg)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-strong)]">
            <FileUp className="h-4 w-4" />
            Upload file dinh kem
          </div>
          <input name={`formField:${field.id}`} required={field.required} type="file" multiple className="text-sm" />
        </div>
      </FieldShell>
    );
  }

  if (imageTypes.includes(field.type) || field.type === "image_video") {
    return (
      <FieldShell field={field} fullWidth>
        <div className="mt-1 rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--input-bg)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-strong)]">
            <Camera className="h-4 w-4" />
            Upload anh/video minh chung
          </div>
          <input
            name={`formField:${field.id}`}
            required={field.required}
            type="file"
            multiple
            accept={field.type === "image_video" ? "image/*,video/*" : "image/*"}
            className="text-sm"
          />
        </div>
      </FieldShell>
    );
  }

  if (field.type === "dataLink") {
    return (
      <FieldShell field={field}>
        <select name={`formField:${field.id}`} required={field.required} defaultValue="" className={baseInputClass()}>
          <option value="">Chon du lieu tu Base</option>
          <option value="base_row_1">Demo row 1</option>
          <option value="base_row_2">Demo row 2</option>
        </select>
      </FieldShell>
    );
  }

  if (field.type === "link_approvals" || field.type === "linkApprovals") {
    return (
      <FieldShell field={field}>
        <Input className="mt-1" name={`formField:${field.id}`} required={field.required} placeholder="Nhap ma phieu can lien ket" />
      </FieldShell>
    );
  }

  if (field.type === "serialNo" || field.type === "serial_no") {
    const serial = `APP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    return (
      <FieldShell field={field}>
        <Input className="mt-1" name={`formField:${field.id}`} readOnly value={serial} />
      </FieldShell>
    );
  }

  return (
    <FieldShell field={field}>
      <Input
        className="mt-1"
        name={`formField:${field.id}`}
        required={field.required}
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "phone" || field.type === "contact_no" ? "tel" : "text"}
        placeholder={field.placeholder ?? "Nhap noi dung"}
        defaultValue={typeof field.defaultValue === "string" || typeof field.defaultValue === "number" ? field.defaultValue : undefined}
        min={field.validation?.min}
        max={field.validation?.max}
        minLength={field.validation?.minLength}
        maxLength={field.validation?.maxLength}
        pattern={field.validation?.pattern}
      />
    </FieldShell>
  );
}
