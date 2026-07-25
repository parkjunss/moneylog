export function formatWon(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

export function formatWonDiff(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${Math.round(Math.abs(amount)).toLocaleString("ko-KR")}원`;
}

// 백엔드가 LocalDateTime.toString()을 그대로 내려줘서 초 단위 소수점이
// 6자리까지 붙어있을 수 있음 (예: 2026-07-25T20:02:54.693083) -> JS Date가
// 안전하게 파싱하도록 밀리초 3자리까지만 남긴다.
export function parseBackendDateTime(value: string): Date {
  const truncated = value.replace(/(\.\d{3})\d*$/, "$1");
  return new Date(truncated);
}

export function toDateInputValue(value: string): string {
  const date = parseBackendDateTime(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTransactionDate(value: string): string {
  const date = parseBackendDateTime(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
