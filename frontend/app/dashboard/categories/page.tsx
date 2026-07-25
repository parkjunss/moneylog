"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  apiCreateCategory,
  apiDeleteCategory,
  apiGetCategories,
  ApiError,
  type CategoryItem,
  type TransactionType,
} from "@/lib/api-client";
import { CATEGORY_META } from "@/lib/category-meta";

type Group = {
  type: TransactionType;
  title: string;
  entries: [string, (typeof CATEGORY_META)[string]][];
};

const GROUPS: Group[] = [
  {
    type: "EXPENSE",
    title: "지출 카테고리",
    entries: Object.entries(CATEGORY_META).filter(([, meta]) => meta.type === "EXPENSE"),
  },
  {
    type: "INCOME",
    title: "수입 카테고리",
    entries: Object.entries(CATEGORY_META).filter(([, meta]) => meta.type === "INCOME"),
  },
];

export default function CategoriesPage() {
  const { accessToken, isAdmin } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGetCategories();
      setCategories(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "카테고리 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 백엔드(외부 시스템)에서 카테고리 목록을 가져와 동기화하는 것이라 useEffect가 적절함.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function findExisting(label: string): CategoryItem | undefined {
    return categories.find((c) => c.categoryName === label);
  }

  async function handleAdd(rawName: string, label: string, type: TransactionType) {
    if (!accessToken) return;
    setPendingName(rawName);
    try {
      await apiCreateCategory(accessToken, { categoryName: label, categoryType: type });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "추가 중 오류가 발생했습니다.");
    } finally {
      setPendingName(null);
    }
  }

  async function handleRemove(existing: CategoryItem) {
    if (!accessToken) return;
    if (!window.confirm(`"${existing.categoryName}" 카테고리를 삭제하시겠습니까?`)) return;

    setPendingName(existing.categoryName);
    try {
      await apiDeleteCategory(accessToken, existing.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setPendingName(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">카테고리</h1>
        <p className="mt-1 text-sm text-muted">
          {isAdmin
            ? "카테고리를 추가하거나 삭제할 수 있습니다."
            : "현재 사용 중인 카테고리 목록입니다. 관리자만 추가/삭제할 수 있습니다."}
        </p>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface py-16 text-center">
          <p className="text-sm text-expense">{error}</p>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted">
          불러오는 중...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {GROUPS.map((group) => (
            <div key={group.type} className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-base font-semibold text-gray-900">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {group.entries.map(([rawName, meta]) => {
                  const existing = findExisting(meta.label);
                  const Icon = meta.icon;
                  const isPending = pendingName === (existing?.categoryName ?? meta.label);

                  return (
                    <li
                      key={rawName}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                    >
                      <span className="flex items-center gap-3 text-sm text-gray-700">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                        >
                          <Icon size={15} />
                        </span>
                        {meta.label}
                        {!existing && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-muted">
                            사용 안 함
                          </span>
                        )}
                      </span>

                      {isAdmin &&
                        (existing ? (
                          <button
                            type="button"
                            aria-label="삭제"
                            disabled={isPending}
                            onClick={() => handleRemove(existing)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-expense-soft hover:text-expense disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label="추가"
                            disabled={isPending}
                            onClick={() => handleAdd(rawName, meta.label, group.type)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-soft hover:text-brand disabled:opacity-50"
                          >
                            <Plus size={15} />
                          </button>
                        ))}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
