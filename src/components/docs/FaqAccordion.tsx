"use client";

import { useState, type ReactNode } from "react";

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

/** أكورديون بسيط للأسئلة الشائعة - سؤال واحد مفتوح في كل مرة اختياريًا. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div className="docs-faq-item" data-open={isOpen} key={item.question}>
            <button
              type="button"
              className="docs-faq-q"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              {item.question}
              <span className="docs-faq-icon" aria-hidden="true">
                +
              </span>
            </button>
            <div className="docs-faq-a">{item.answer}</div>
          </div>
        );
      })}
    </div>
  );
}
