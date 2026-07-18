"use client";

import { useState } from "react";

/**
 * كتلة كود مع زر نسخ. تُستخدم في كل صفحات مرجع الـ API ودليل التكامل
 * لعرض أمثلة قابلة للنسخ واللصق مباشرة (متطلب أساسي: "Copy buttons for
 * code blocks").
 */
export function CodeBlock({
  code,
  label,
}: {
  code: string;
  /** تسمية صغيرة تظهر أعلى الكتلة، مثل اسم اللغة أو الملف: "bash", "quiz.js" */
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // بيئات بدون صلاحية clipboard (نادر) - نتجاهل بصمت، الزر يبقى كما هو
    }
  }

  return (
    <div className="docs-code">
      <div className="docs-code-head">
        <span>{label ?? "code"}</span>
        <button
          type="button"
          className={`docs-copy-btn${copied ? " copied" : ""}`}
          onClick={handleCopy}
        >
          {copied ? "✓ تم النسخ" : "نسخ"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
