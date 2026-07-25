"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiSignup, googleLoginUrl, ApiError } from "@/lib/api-client";
import GoogleIcon from "@/components/icons/GoogleIcon";

type Mode = "login" | "signup";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, login, setAccessTokenFromOAuth } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [handlingOAuth, setHandlingOAuth] = useState(false);
  const oauthHandled = useRef(false);

  // Google OAuth 콜백: 백엔드가 /login#accessToken=... 형태로 리다이렉트한다.
  useEffect(() => {
    if (oauthHandled.current) return;

    const hash = window.location.hash;
    if (hash.startsWith("#accessToken=")) {
      oauthHandled.current = true;
      // URL 해시(외부 브라우저 상태)를 읽어 동기화하는 것이라 useEffect가 적절함.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHandlingOAuth(true);
      const token = decodeURIComponent(hash.replace("#accessToken=", ""));

      setAccessTokenFromOAuth(token)
        .then(() => {
          window.history.replaceState(null, "", "/login");
          router.replace("/dashboard");
        })
        .catch(() => {
          setError("Google 로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
          window.history.replaceState(null, "", "/login");
          setHandlingOAuth(false);
        });
    }
  }, [router, setAccessTokenFromOAuth]);

  useEffect(() => {
    if (searchParams.get("oauthError") === "1") {
      // 쿼리 파라미터(외부 브라우저 상태)를 읽어 동기화하는 것이라 useEffect가 적절함.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Google 로그인에 실패했습니다. 다시 시도해주세요.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !handlingOAuth) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, handlingOAuth, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        await apiSignup({ username, email, password });
        await login(email, password);
      } else {
        await login(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || handlingOAuth) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
            }}
          >
            M
          </span>
          <span className="text-lg font-bold">머니로그</span>
        </Link>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="mb-6 flex rounded-xl bg-background p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === "login" ? "bg-surface text-brand shadow-sm" : "text-muted"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === "signup" ? "bg-surface text-brand shadow-sm" : "text-muted"
              }`}
            >
              회원가입
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-700">닉네임</span>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
                  placeholder="5자 이상 입력해주세요"
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-700">이메일</span>
              <input
                type="email"
                required
                minLength={10}
                maxLength={50}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="you@example.com"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-700">비밀번호</span>
              <input
                type="password"
                required
                minLength={10}
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="10자 이상 입력해주세요"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
              }}
            >
              {submitting ? "처리 중..." : mode === "signup" ? "회원가입" : "로그인"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            또는
            <span className="h-px flex-1 bg-border" />
          </div>

          <a
            href={googleLoginUrl()}
            className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <GoogleIcon size={18} />
            Google로 계속하기
          </a>
        </div>
      </div>
    </div>
  );
}
