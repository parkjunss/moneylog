import Link from "next/link";
import {
  ArrowRight,
  PieChart,
  TrendingUp,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";

const features = [
  {
    icon: Wallet,
    title: "수입·지출 기록",
    description: "금액, 카테고리, 날짜만 입력하면 끝. 몇 초 만에 거래를 기록하세요.",
  },
  {
    icon: PieChart,
    title: "카테고리별 통계",
    description: "식비, 교통, 쇼핑 등 카테고리별 지출 비중을 도넛 차트로 한눈에 확인하세요.",
  },
  {
    icon: TrendingUp,
    title: "월별 수입/지출 추이",
    description: "지난달 대비 얼마나 아꼈는지, 어디서 더 썼는지 추이 그래프로 파악하세요.",
  },
  {
    icon: ShieldCheck,
    title: "안전한 데이터 보호",
    description: "내 데이터는 오직 나만 볼 수 있도록 로그인 기반으로 안전하게 보호됩니다.",
  },
];

const previewStats = [
  { label: "총 수입", value: "2,850,000원", tone: "income" as const },
  { label: "총 지출", value: "1,326,500원", tone: "expense" as const },
  { label: "잔액", value: "1,523,500원", tone: "balance" as const },
];

const toneClasses = {
  income: "text-income",
  expense: "text-expense",
  balance: "text-balance",
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-16 pt-12 text-center">
          <span className="mb-6 rounded-full bg-brand-soft px-4 py-1.5 text-sm font-medium text-brand">
            무료로 시작하는 스마트 가계부
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            내 돈의 흐름을,
            <br />
            한눈에 확인하세요
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            수입과 지출을 기록하고 카테고리별 통계로 소비 패턴을 파악하세요.
            머니로그와 함께 똑똑한 소비 습관을 만들어보세요.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
              }}
            >
              무료로 시작하기
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              대시보드 둘러보기
            </Link>
          </div>

          {/* Mini dashboard preview */}
          <div className="mt-16 grid w-full grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-6 shadow-lg sm:grid-cols-3">
            {previewStats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-background p-5 text-left">
                <p className="text-sm text-muted">{stat.label}</p>
                <p className={`mt-2 text-2xl font-bold ${toneClasses[stat.tone]}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              가계부 관리, 이렇게 쉬워도 되나요?
            </h2>
            <p className="mt-3 text-muted">
              머니로그가 제공하는 핵심 기능들을 확인해보세요.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <feature.icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-24">
          <div
            className="flex flex-col items-center gap-4 rounded-2xl px-8 py-14 text-center text-white"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
            }}
          >
            <h2 className="text-2xl font-bold sm:text-3xl">
              지금 바로 소비 습관을 관리해보세요
            </h2>
            <p className="max-w-md text-sm text-white/90">
              가입은 1분이면 충분합니다. 오늘부터 나의 소비 패턴을 확인해보세요.
            </p>
            <Link
              href="/login"
              className="mt-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand hover:bg-gray-50"
            >
              무료로 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted">
        © 2026 머니로그. All rights reserved.
      </footer>
    </div>
  );
}
