import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhereKid - 우리 아이 스케줄 관리",
  description: "자녀의 학원 스케줄과 납부를 쉽게 관리하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased bg-gray-900 text-white`}>
        {children}
      </body>
    </html>
  );
}
