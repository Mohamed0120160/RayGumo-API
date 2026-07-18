import type { ReactNode } from "react";

const ICONS: Record<string, string> = {
  note: "ℹ️",
  warn: "⚠️",
  tip: "💡",
};

const TITLES: Record<string, string> = {
  note: "ملاحظة",
  warn: "تنبيه",
  tip: "نصيحة",
};

/** صندوق ملاحظة/تحذير/نصيحة، يُستخدم لإبراز معلومة مهمة داخل نص الصفحة. */
export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: "note" | "warn" | "tip";
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`docs-callout docs-callout-${type}`}>
      <p className="docs-callout-title">
        <span aria-hidden="true">{ICONS[type]}</span>
        {title ?? TITLES[type]}
      </p>
      {children}
    </div>
  );
}
