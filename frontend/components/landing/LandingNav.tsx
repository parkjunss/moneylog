import Link from "next/link";

export default function LandingNav() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold text-white"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
          }}
        >
          M
        </span>
        <span className="text-lg font-bold">머니로그</span>
      </Link>

      <nav className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          로그인
        </Link>
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
          }}
        >
          무료로 시작하기
        </Link>
      </nav>
    </header>
  );
}
