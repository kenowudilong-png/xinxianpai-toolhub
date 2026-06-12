import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "芯鲜派工具站", description: "内部 AI 工具站" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
