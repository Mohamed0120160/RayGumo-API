import Link from "next/link";
import { getPageNav } from "@/docs-content/nav";

/** روابط "السابق / التالي" أسفل كل صفحة توثيق، مبنية تلقائيًا من ترتيب nav.ts. */
export function PageNav({ currentHref }: { currentHref: string }) {
  const { prev, next } = getPageNav(currentHref);
  if (!prev && !next) return null;

  return (
    <nav className="docs-pagenav" aria-label="التنقل بين الصفحات">
      {prev ? (
        <Link href={prev.href} className="docs-pagenav-link">
          <span className="docs-pagenav-label">← السابق</span>
          <span className="docs-pagenav-title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} className="docs-pagenav-link docs-pagenav-next">
          <span className="docs-pagenav-label">التالي →</span>
          <span className="docs-pagenav-title">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
