import type { Metadata } from "next";

/**
 * التخطيط الجذري (Root Layout) لتطبيق Next.js.
 *
 * ملاحظة: هذا المشروع في الأساس خادم API فقط (backend)، وليس موقعًا
 * تفاعليًا. هذا الملف موجود لأن بنية App Router في Next.js تتطلب
 * layout.tsx واحد على الأقل في الجذر، حتى لو كانت الصفحات المرئية
 * (مثل page.tsx) بسيطة جدًا وليست الهدف الأساسي من المشروع.
 */

export const metadata: Metadata = {
  title: "RayGumo API",
  description: "Centralized backend API for WhatsApp bots and websites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
