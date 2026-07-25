import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "머니로그 | 내 돈의 흐름을 한눈에",
  description: "수입과 지출을 기록하고 카테고리별 통계로 소비 패턴을 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
