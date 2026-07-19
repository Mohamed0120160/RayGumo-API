"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_DOC_PAGES, type DocPage } from "@/docs-content/nav";

/**
 * بحث بسيط من طرف العميل (client-side) عبر كل صفحات التوثيق المسجّلة
 * في ALL_DOC_PAGES (المُشتقّة من nav.ts). لا يحتاج أي فهرسة خارجية أو
 * خدمة بحث - العدد الحالي من الصفحات صغير بما يكفي ليكون هذا "معقولًا"
 * تمامًا كما طلب في متطلبات المشروع (بحث "إذا كان معقولًا").
 *
 * عند إضافة صفحة توثيق جديدة في nav.ts، تدخل تلقائيًا ضمن نتائج البحث
 * هنا بدون أي تعديل على هذا الملف.
 */
export function DocsSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results: DocPage[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return ALL_DOC_PAGES.slice(0, 8);
    return ALL_DOC_PAGES.filter(
      (page) =>
        page.title.toLowerCase().includes(q) ||
        page.description.toLowerCase().includes(q) ||
        page.href.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // تأخير بسيط حتى يظهر العنصر في DOM قبل التركيز عليه
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleGlobalKey = (e: globalThis.KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [open, onClose]);

  // فتح البحث بالضغط على "/" من أي مكان في الصفحة (طالما لا يوجد
  // تركيز على حقل إدخال آخر بالفعل)
  useEffect(() => {
    const handleSlash = (e: globalThis.KeyboardEvent): void => {
      if (e.key !== "/" || open) return;
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (isTyping) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", handleSlash);
    return () => window.removeEventListener("keydown", handleSlash);
  }, [open]);

  if (!open) return null;

  return (
    <div className="docs-search-overlay" onClick={onClose}>
      <div className="docs-search-modal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="docs-search-input"
          placeholder="ابحث عن صفحة، نقطة API، أو مصطلح..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[activeIndex]) {
              window.location.href = results[activeIndex].href;
            }
          }}
        />
        <div className="docs-search-results">
          {results.length === 0 ? (
            <p className="docs-search-empty">لا توجد نتائج مطابقة</p>
          ) : (
            results.map((page, i) => (
              <Link
                key={page.href}
                href={page.href}
                className={`docs-search-result${i === activeIndex ? " active" : ""}`}
                onClick={onClose}
              >
                <span className="docs-search-result-group">{page.href}</span>
                {page.title}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
