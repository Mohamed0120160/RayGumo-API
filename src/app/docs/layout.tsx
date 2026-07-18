import type { Metadata } from "next";
import "./docs.css";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

/**
 * التخطيط الجذري لكل صفحات /docs. مستقل تمامًا عن باقي المشروع (لا
 * يعدّل src/app/layout.tsx ولا يؤثر على أي مسار /api).
 *
 * البنية: رأس ثابت (Header) + عمود شريط جانبي (Sidebar) + عمود محتوى
 * رئيسي. جدول المحتويات (TableOfContents) يُدرَج داخل كل صفحة على حدة
 * وليس هنا، لأنه يعتمد على عناوين خاصة بكل صفحة.
 */
export const metadata: Metadata = {
  title: {
    default: "RayGumo API — التوثيق",
    template: "%s — RayGumo API Docs",
  },
  description: "التوثيق الرسمي لـ RayGumo API: مرجع كامل لكل نقاط الوصول، ودليل تكامل بوتات الواتساب.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-root">
      <DocsHeader />
      <div className="docs-shell">
        <DocsSidebar />
        {children}
      </div>
    </div>
  );
}
