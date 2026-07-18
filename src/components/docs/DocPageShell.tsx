import type { ReactNode } from "react";
import { TableOfContents, type TocItem } from "./TableOfContents";
import { PageNav } from "./PageNav";

/**
 * الغلاف المشترك لكل صفحة توثيق داخلية (غير الرئيسية). يوفّر: عمود
 * المحتوى الرئيسي (مع عنوان ومقدمة)، جدول المحتويات على اليمين، وشريط
 * التنقل للسابق/التالي أسفل الصفحة.
 */
export function DocPageShell({
  eyebrow,
  title,
  lede,
  toc = [],
  currentHref,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  toc?: TocItem[];
  currentHref: string;
  children: ReactNode;
}) {
  return (
    <>
      <main className="docs-main">
        {eyebrow && (
          <p className="docs-eyebrow">
            <span aria-hidden="true">▸</span> {eyebrow}
          </p>
        )}
        <h1 className="docs-h1">{title}</h1>
        {lede && <p className="docs-lede">{lede}</p>}
        {children}
        <PageNav currentHref={currentHref} />
      </main>
      <TableOfContents items={toc} />
    </>
  );
}
