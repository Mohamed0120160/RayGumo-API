/**
 * شارة المسار (Endpoint Badge) - العنصر البصري المميّز (signature
 * element) المتكرر في كل صفحات مرجع الـ API. تُعرض كسطر طرفية حقيقي:
 * طريقة HTTP + المسار + مؤشر "حي" نابض، وكأن الطلب يحدث الآن فعلًا.
 */
export function EndpointBadge({ method, path }: { method: string; path: string }) {
  return (
    <div className="docs-endpoint">
      <span className="docs-endpoint-method">{method}</span>
      <span className="docs-endpoint-path">{path}</span>
      <span className="docs-endpoint-live">live</span>
    </div>
  );
}
