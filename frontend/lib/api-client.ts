export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string | null;
};

export type UserProfile = {
  username: string;
  email: string;
};

export type CategoryExpense = {
  categoryId: number;
  categoryName: string; // raw enum name (e.g. "FOOD"), not the Korean display name
  amount: number;
};

export type MonthlyStatistics = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryExpenses: CategoryExpense[];
};

export type TransactionType = "INCOME" | "EXPENSE";

export type MoneyLogItem = {
  id: number;
  title: string;
  description: string;
  money: string;
  date: string;
  category: string; // raw enum name
  type: TransactionType;
};

export type MoneyLogPage = {
  content: MoneyLogItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type MoneyLogInput = {
  title: string;
  description: string;
  money: number;
  date: string; // yyyy-MM-dd
  category: string; // raw enum name
  type: TransactionType;
};

export type MoneyLogFilter = {
  year?: number;
  month?: number;
  type?: TransactionType;
  categoryId?: number;
  page?: number;
  size?: number;
};

export type CategoryItem = {
  id: number;
  categoryName: string; // Korean display name
  categoryType: TransactionType;
};

export type CategoryInput = {
  categoryName: string;
  categoryType: TransactionType;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let accessTokenHandler: (accessToken: string | null) => void = () => {};
let reissuePromise: Promise<AuthTokenResponse | null> | null = null;

export function setAccessTokenHandler(
  handler: (accessToken: string | null) => void
): () => void {
  accessTokenHandler = handler;
  return () => {
    if (accessTokenHandler === handler) accessTokenHandler = () => {};
  };
}

async function authenticatedFetch(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  const request = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  };

  const response = await request(accessToken);
  if (response.status !== 401) return response;

  reissuePromise ??= apiReissue().finally(() => {
    reissuePromise = null;
  });
  const tokens = await reissuePromise;

  if (!tokens?.accessToken) {
    accessTokenHandler(null);
    return response;
  }

  accessTokenHandler(tokens.accessToken);
  return request(tokens.accessToken);
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;

      if (typeof record.message === "string") {
        return record.message;
      }

      // MethodArgumentNotValidException -> { field: message, ... }
      const fieldMessages = Object.values(record).filter(
        (value): value is string => typeof value === "string"
      );
      if (fieldMessages.length > 0) {
        return fieldMessages.join(" / ");
      }
    }
  } catch {
    // response body wasn't JSON; fall through to default message
  }

  return "요청 처리 중 오류가 발생했습니다.";
}

export async function apiSignup(input: {
  username: string;
  email: string;
  password: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }
}

export async function apiLogin(input: {
  email: string;
  password: string;
}): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  return response.json();
}

export async function apiReissue(): Promise<AuthTokenResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function apiGetProfile(accessToken: string): Promise<UserProfile> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/profile`,
    accessToken
  );

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  return response.json();
}

export function googleLoginUrl(): string {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}

export async function apiGetMonthlyStatistics(
  accessToken: string,
  year: number,
  month: number
): Promise<MonthlyStatistics> {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/money-logs/monthly?${params}`,
    accessToken
  );

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  return response.json();
}

export async function apiGetRecentMoneyLogs(
  accessToken: string,
  size = 5
): Promise<MoneyLogPage> {
  return apiGetMoneyLogs(accessToken, { page: 0, size });
}

export async function apiGetMoneyLogs(
  accessToken: string,
  filter: MoneyLogFilter = {}
): Promise<MoneyLogPage> {
  const params = new URLSearchParams();
  if (filter.year != null) params.set("year", String(filter.year));
  if (filter.month != null) params.set("month", String(filter.month));
  if (filter.type) params.set("type", filter.type);
  if (filter.categoryId != null) params.set("categoryId", String(filter.categoryId));
  params.set("page", String(filter.page ?? 0));
  params.set("size", String(filter.size ?? 10));

  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/money-logs?${params}`,
    accessToken
  );

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  return response.json();
}

export async function apiCreateMoneyLog(
  accessToken: string,
  input: MoneyLogInput
): Promise<MoneyLogItem> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/money-logs`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  return response.json();
}

export async function apiUpdateMoneyLog(
  accessToken: string,
  id: number,
  input: MoneyLogInput
): Promise<MoneyLogItem> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/money-logs/${id}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  return response.json();
}

export async function apiDeleteMoneyLog(accessToken: string, id: number): Promise<void> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/money-logs/${id}`,
    accessToken,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }
}

export async function apiGetCategories(): Promise<CategoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/category/all`);

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  return response.json();
}

export async function apiCreateCategory(
  accessToken: string,
  input: CategoryInput
): Promise<CategoryItem> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/category`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  return response.json();
}

export async function apiDeleteCategory(accessToken: string, id: number): Promise<void> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/category/${id}`,
    accessToken,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }
}
