import Link from "next/link";
import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { API_REFERENCE_GROUP } from "@/docs-content/nav";

export const metadata: Metadata = { title: "مرجع الـ API" };

export default function ApiReferenceIndexPage() {
  const apis = API_REFERENCE_GROUP.pages.filter((p) => p.href !== "/docs/api-reference");

  return (
    <DocPageShell
      currentHref="/docs/api-reference"
      eyebrow="مرجع الـ API"
      title="مرجع الـ API"
      lede="كل واجهة برمجية في RayGumo API موثّقة في صفحتها الخاصة. هذه الصفحة هي فهرس شامل لكل ما هو متاح الآن، وما هو مخطط له مستقبلًا."
      toc={[
        { id: "how-to-read", label: "كيف تُقرأ هذه الصفحات" },
        { id: "available", label: "الـ APIs المتاحة والمخطط لها" },
      ]}
    >
      <h2 id="how-to-read">كيف تُقرأ صفحات مرجع الـ API</h2>
      <p>
        كل صفحة API تتبع نفس البنية بالضبط: شارة مسار توضّح الطريقة (Method) والرابط، وصف مختصر،
        جدول المعاملات إن وُجدت، مثال طلب، مثال استجابة ناجحة، مثال استجابة خطأ، وملاحظات مهمة. هذا
        الاتساق يعني أنك بمجرد فهم صفحة واحدة، تفهم شكل كل الصفحات الأخرى — الحالية والمستقبلية.
      </p>

      <h2 id="available">الـ APIs المتاحة والمخطط لها</h2>
      <div className="docs-card-grid">
        {apis.map((api) => (
          <Link
            key={api.href}
            href={api.planned ? "/docs/api-reference" : api.href}
            className={`docs-card${api.planned ? " docs-card-planned" : ""}`}
            aria-disabled={api.planned}
          >
            <p className="docs-card-title">
              {api.title}
              {api.badge && (
                <span className={`docs-pill ${api.planned ? "docs-pill-planned" : "docs-pill-get"}`}>
                  {api.badge}
                </span>
              )}
            </p>
            <p className="docs-card-desc">{api.description}</p>
          </Link>
        ))}
      </div>
      <p>
        هل تبني API جديدًا وتريد توثيقه بنفس النمط؟ راجع قسم{" "}
        <a href="/docs/architecture#adding-game">كيف تضيف لعبة جديدة</a> في صفحة بنية المشروع.
      </p>
    </DocPageShell>
  );
}
