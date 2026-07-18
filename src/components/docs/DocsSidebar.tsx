"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_NAV } from "@/docs-content/nav";

/**
 * الشريط الجانبي لبوابة التوثيق. يُبنى بالكامل من DOC_NAV (انظر
 * src/docs-content/nav.ts) - لا يحتوي أي روابط مكتوبة يدويًا هنا، لذلك
 * إضافة صفحة توثيق جديدة في nav.ts تظهر هنا تلقائيًا بدون أي تعديل
 * على هذا الملف.
 */
export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="docs-sidebar" aria-label="التنقل بين صفحات التوثيق">
      {DOC_NAV.map((group) => (
        <div className="docs-nav-group" key={group.title}>
          <p className="docs-nav-title">{group.title}</p>
          {group.pages.map((page) => {
            const isActive = pathname === page.href;
            // الصفحات المخطط لها (planned) ليس لها page.tsx فعلي بعد -
            // نعرضها كعنصر غير قابل للنقر بدل رابط يقود لصفحة 404.
            if (page.planned) {
              return (
                <span key={page.href} className="docs-nav-link docs-nav-link-disabled" aria-disabled="true">
                  <span>{page.title}</span>
                  {page.badge && <span className="docs-nav-badge">{page.badge}</span>}
                </span>
              );
            }
            return (
              <Link
                key={page.href}
                href={page.href}
                onClick={onNavigate}
                className={`docs-nav-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{page.title}</span>
                {page.badge && <span className="docs-nav-badge">{page.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
