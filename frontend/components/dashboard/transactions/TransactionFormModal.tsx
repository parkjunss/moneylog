"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import {
  apiCreateMoneyLog,
  apiUpdateMoneyLog,
  ApiError,
  type MoneyLogItem,
  type TransactionType,
} from "@/lib/api-client";
import { CATEGORY_META } from "@/lib/category-meta";
import { toDateInputValue } from "@/lib/format";

const EXPENSE_CATEGORIES = Object.entries(CATEGORY_META).filter(
  ([, meta]) => meta.type === "EXPENSE"
);
const INCOME_CATEGORIES = Object.entries(CATEGORY_META).filter(
  ([, meta]) => meta.type === "INCOME"
);

function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export default function TransactionFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: MoneyLogItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { accessToken } = useAuth();
  const isEdit = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [money, setMoney] = useState(initial ? String(initial.money) : "");
  const [date, setDate] = useState(initial ? toDateInputValue(initial.date) : todayInputValue());
  const [type, setType] = useState<TransactionType>(initial?.type ?? "EXPENSE");
  const [category, setCategory] = useState(initial?.category ?? EXPENSE_CATEGORIES[0][0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);

    try {
      const input = {
        title,
        description,
        money: Number(money),
        date,
        category,
        type,
      };

      if (isEdit && initial) {
        await apiUpdateMoneyLog(accessToken, initial.id, input);
      } else {
        await apiCreateMoneyLog(accessToken, input);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? "거래내역 수정" : "거래내역 추가"} onClose={onClose}>
      {error && (
        <p className="mb-4 rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex rounded-xl bg-background p-1">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              type === "EXPENSE" ? "bg-surface text-expense shadow-sm" : "text-muted"
            }`}
          >
            지출
          </button>
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              type === "INCOME" ? "bg-surface text-income shadow-sm" : "text-muted"
            }`}
          >
            수입
          </button>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-gray-700">제목</span>
          <input
            type="text"
            required
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-gray-700">설명</span>
          <input
            type="text"
            required
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-gray-700">금액</span>
            <input
              type="number"
              required
              min={1}
              value={money}
              onChange={(e) => setMoney(e.target.value)}
              className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-gray-700">날짜</span>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-gray-700">카테고리</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <optgroup label="지출">
              {EXPENSE_CATEGORIES.map(([name, meta]) => (
                <option key={name} value={name}>
                  {meta.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="수입">
              {INCOME_CATEGORIES.map(([name, meta]) => (
                <option key={name} value={name}>
                  {meta.label}
                </option>
              ))}
            </optgroup>
          </select>
          <span className="text-xs text-muted">
            카테고리와 별개로 위에서 고른 유형(지출/수입)이 저장됩니다. 예: &quot;투자&quot;
            카테고리를 골라도 유형을 지출로 선택하면 손실로 기록됩니다.
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
          }}
        >
          {submitting ? "저장 중..." : isEdit ? "수정 완료" : "추가하기"}
        </button>
      </form>
    </Modal>
  );
}
