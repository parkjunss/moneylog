"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  apiDeleteMoneyLog,
  apiGetCategories,
  apiGetMoneyLogs,
  ApiError,
  type MoneyLogFilter,
  type MoneyLogItem,
  type TransactionType,
} from "@/lib/api-client";
import { CATEGORY_META, getCategoryMeta } from "@/lib/category-meta";
import { formatWon, formatTransactionDate } from "@/lib/format";
import TransactionFormModal from "@/components/dashboard/transactions/TransactionFormModal";

const PAGE_SIZE = 10;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

type Filters = {
  year: string;
  month: string;
  type: string;
  categoryName: string;
};

const EMPTY_FILTERS: Filters = { year: "", month: "", type: "", categoryName: "" };

export default function TransactionsPage() {
  const { accessToken } = useAuth();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<MoneyLogItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<"closed" | "add" | MoneyLogItem>("closed");
  const [categoryIdByName, setCategoryIdByName] = useState<Record<string, number>>({});

  useEffect(() => {
    // 카테고리 필터가 백엔드에 categoryId를 보내야 해서, raw name -> id 매핑을 한 번만 가져온다.
    apiGetCategories()
      .then((categories) => {
        const map: Record<string, number> = {};
        for (const category of categories) {
          const rawName = Object.entries(CATEGORY_META).find(
            ([, meta]) => meta.label === category.categoryName
          )?.[0];
          if (rawName) map[rawName] = category.id;
        }
        setCategoryIdByName(map);
      })
      .catch(() => {
        // 카테고리 필터만 못 쓰게 되는 것이라 조용히 무시한다.
      });
  }, []);

  const load = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    const filter: MoneyLogFilter = { page, size: PAGE_SIZE };
    if (filters.year) filter.year = Number(filters.year);
    if (filters.month) filter.month = Number(filters.month);
    if (filters.type) filter.type = filters.type as TransactionType;
    if (filters.categoryName && categoryIdByName[filters.categoryName] != null) {
      filter.categoryId = categoryIdByName[filters.categoryName];
    }

    try {
      const result = await apiGetMoneyLogs(accessToken, filter);
      setItems(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, filters, categoryIdByName]);

  useEffect(() => {
    // 필터/페이지가 바뀔 때마다 백엔드(외부 시스템)에서 목록을 다시 불러와 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function updateFilter<K extends keyof Filters>(key: K, value: string) {
    setPage(0);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDelete(item: MoneyLogItem) {
    if (!accessToken) return;
    if (!window.confirm(`"${item.title}" 내역을 삭제하시겠습니까?`)) return;

    try {
      await apiDeleteMoneyLog(accessToken, item.id);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래내역</h1>
          <p className="mt-1 text-sm text-muted">
            총 {totalElements.toLocaleString("ko-KR")}건의 거래내역
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalState("add")}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
          }}
        >
          <Plus size={16} />
          거래 추가
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-surface p-4">
        <select
          value={filters.year}
          onChange={(e) => updateFilter("year", e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">전체 연도</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>

        <select
          value={filters.month}
          onChange={(e) => updateFilter("month", e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={(e) => updateFilter("type", e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">전체 유형</option>
          <option value="INCOME">수입</option>
          <option value="EXPENSE">지출</option>
        </select>

        <select
          value={filters.categoryName}
          onChange={(e) => updateFilter("categoryName", e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">전체 카테고리</option>
          {Object.entries(CATEGORY_META).map(([name, meta]) => (
            <option key={name} value={name}>
              {meta.label}
            </option>
          ))}
        </select>

        {(filters.year || filters.month || filters.type || filters.categoryName) && (
          <button
            type="button"
            onClick={() => {
              setPage(0);
              setFilters(EMPTY_FILTERS);
            }}
            className="rounded-lg px-3 py-2 text-sm text-muted hover:text-gray-700"
          >
            필터 초기화
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
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
          <p className="py-16 text-center text-sm text-muted">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">조건에 맞는 거래내역이 없습니다.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="pb-3 font-medium">날짜</th>
                    <th className="pb-3 font-medium">제목</th>
                    <th className="pb-3 font-medium">설명</th>
                    <th className="pb-3 font-medium">카테고리</th>
                    <th className="pb-3 text-right font-medium">금액</th>
                    <th className="pb-3 pl-4 text-right font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const meta = getCategoryMeta(item.category);
                    const isIncome = item.type === "INCOME";

                    return (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="py-3.5 text-gray-500">
                          {formatTransactionDate(item.date)}
                        </td>
                        <td className="py-3.5 font-medium text-gray-900">{item.title}</td>
                        <td className="py-3.5 text-gray-500">{item.description}</td>
                        <td className="py-3.5">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 text-right font-semibold ${
                            isIncome ? "text-income" : "text-expense"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatWon(Number(item.money))}
                        </td>
                        <td className="py-3.5 pl-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              aria-label="수정"
                              onClick={() => setModalState(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label="삭제"
                              onClick={() => handleDelete(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-expense-soft hover:text-expense"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-muted">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modalState !== "closed" && (
        <TransactionFormModal
          initial={modalState === "add" ? undefined : modalState}
          onClose={() => setModalState("closed")}
          onSaved={load}
        />
      )}
    </div>
  );
}
