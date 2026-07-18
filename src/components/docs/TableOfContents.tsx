export interface TocItem {
  id: string;
  label: string;
  level?: 2 | 3;
}

/**
 * جدول محتويات ثابت (static) يُبنى من قائمة عناوين تُمرَّر يدويًا لكل
 * صفحة. اخترنا قائمة صريحة بدل استخراج العناوين تلقائيًا من الـ DOM
 * لإبقاء كل صفحة مكوّن خادم (Server Component) بسيطًا وسريعًا بدون
 * الحاجة لأي جافاسكريبت إضافي فقط لبناء الفهرس.
 */
export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;

  return (
    <aside className="docs-toc">
      <p className="docs-toc-title">في هذه الصفحة</p>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} className={item.level === 3 ? "toc-h3" : undefined}>
          {item.label}
        </a>
      ))}
    </aside>
  );
}
