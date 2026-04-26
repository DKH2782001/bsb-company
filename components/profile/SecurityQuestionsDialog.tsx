"use client";

import { useState } from "react";
import { HelpCircle, ShieldCheck, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type SecurityQuestion = {
  id: string;
  question: string;
  hasAnswer: boolean;
};

const defaultQuestions: SecurityQuestion[] = [
  { id: "q1", question: "Tên trường cấp 3 bạn đã học?", hasAnswer: true },
  { id: "q2", question: "Tên thú cưng đầu tiên của bạn?", hasAnswer: true },
  { id: "q3", question: "Thành phố nơi bạn sinh ra?", hasAnswer: false },
];

const availableQuestions = [
  "Tên trường cấp 3 bạn đã học?",
  "Tên thú cưng đầu tiên của bạn?",
  "Thành phố nơi bạn sinh ra?",
  "Tên người bạn thân nhất thời thơ ấu?",
  "Cuốn sách yêu thích của bạn?",
  "Tên đường nơi bạn lớn lên?",
];

export function SecurityQuestionsDialog() {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<SecurityQuestion[]>(defaultQuestions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAnswer, setEditAnswer] = useState("");
  const [editQuestion, setEditQuestion] = useState("");
  const { toast } = useToast();

  function handleSave(id: string) {
    if (!editAnswer.trim()) return;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, question: editQuestion || q.question, hasAnswer: true } : q
      )
    );
    setEditingId(null);
    setEditAnswer("");
    setEditQuestion("");
    toast({ variant: "success", title: "Đã cập nhật", description: "Câu hỏi bảo mật đã được lưu." });
  }

  function handleDelete(id: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, hasAnswer: false } : q))
    );
    toast({ variant: "success", title: "Đã xóa", description: "Câu trả lời đã được xóa." });
  }

  const answeredCount = questions.filter((q) => q.hasAnswer).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] cursor-pointer hover:text-[var(--brand-700)] transition-colors"
      >
        <span>Quản lý</span>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[var(--brand-600)]" />
            Câu hỏi bảo mật
          </div>
        }
        description={`${answeredCount}/3 câu hỏi đã thiết lập. Khuyến nghị thiết lập đủ 3 câu hỏi.`}
        size="md"
        footer={
          <Button onClick={() => setOpen(false)}>Đóng</Button>
        }
      >
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-2xl border border-[var(--line-soft)] p-4">
              {editingId === q.id ? (
                <div className="space-y-3">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-[var(--text-soft)]">Câu hỏi</span>
                    <select
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="flex h-11 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-600)] focus:ring-1 focus:ring-[var(--brand-500)] transition-colors"
                    >
                      {availableQuestions.map((aq) => (
                        <option key={aq} value={aq}>{aq}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-[var(--text-soft)]">Câu trả lời</span>
                    <Input
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      placeholder="Nhập câu trả lời của bạn"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(q.id)} disabled={!editAnswer.trim()}>
                      Lưu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditAnswer(""); }}>
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[var(--text-strong)]">{q.question}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      {q.hasAnswer ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Đã thiết lập</span>
                        </>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Chưa thiết lập</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(q.id);
                        setEditQuestion(q.question);
                        setEditAnswer("");
                      }}
                    >
                      {q.hasAnswer ? "Sửa" : "Thiết lập"}
                    </Button>
                    {q.hasAnswer && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}
