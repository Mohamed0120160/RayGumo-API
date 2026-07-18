"use client";

import Link from "next/link";
import { useState } from "react";
import { APP_CONFIG } from "@/config/app";
import { DocsSidebar } from "./DocsSidebar";
import { DocsSearch } from "./DocsSearch";

/**
 * رأس بوابة التوثيق: يظهر أعلى كل صفحات /docs. يحتوي:
 *  - شعار الاسم مع مؤشر "حي" أخضر (يوحي بأن الـ API يعمل الآن فعلًا).
 *  - رقم الإصدار (من APP_CONFIG - نفس الإعداد المستخدم في الصفحة
 *    الرئيسية العامة للمشروع، وليس رقمًا منفصلًا).
 *  - زر بحث.
 *  - زر فتح/إغلاق القائمة الجانبية على الموبايل.
 */
export function DocsHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="docs-header">
        <button
          type="button"
          className="docs-menu-btn"
          aria-label="فتح قائمة التنقل"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((v) => !v)}
        >
          {mobileNavOpen ? "✕" : "☰"}
        </button>

        <Link href="/docs" className="docs-header-brand">
          <span className="docs-header-dot" aria-hidden="true" />
          RayGumo API Docs
        </Link>

        <span className="docs-header-version mono">v{APP_CONFIG.version}</span>

        <div className="docs-header-actions">
          <button
            type="button"
            className="docs-search-btn"
            onClick={() => setSearchOpen(true)}
          >
            🔍 ابحث في التوثيق
            <span className="docs-search-kbd">/</span>
          </button>
          <Link href="/" className="docs-header-link">
            الموقع الرئيسي
          </Link>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="docs-sidebar docs-sidebar-open">
          <DocsSidebar onNavigate={() => setMobileNavOpen(false)} />
        </div>
      )}

      <DocsSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
