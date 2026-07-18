import { EndpointBadge } from "./EndpointBadge";
import { CodeBlock } from "./CodeBlock";
import type { EndpointDoc } from "@/docs-content/api-reference/quiz";

/**
 * يعرض توثيق نقطة وصول (endpoint) واحدة كاملة من كائن EndpointDoc.
 * هذا المكوّن عام تمامًا (لا يعرف شيئًا عن الكويز تحديدًا) ويُستخدم
 * لأي API حالي أو مستقبلي طالما بياناته بشكل EndpointDoc - وهذا هو
 * سرّ قابلية التوسّع بدون إعادة تصميم.
 */
export function EndpointSection({ endpoint, headingId }: { endpoint: EndpointDoc; headingId: string }) {
  return (
    <section>
      <h3 id={headingId}>{endpoint.title}</h3>
      <EndpointBadge method={endpoint.method} path={endpoint.path} />
      <p>{endpoint.description}</p>

      {endpoint.params && endpoint.params.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>المعامل</th>
              <th>النوع</th>
              <th>مطلوب؟</th>
              <th>الوصف</th>
            </tr>
          </thead>
          <tbody>
            {endpoint.params.map((param) => (
              <tr key={param.name}>
                <td>
                  <code>{param.name}</code>
                </td>
                <td>{param.type}</td>
                <td>{param.required ? "نعم" : "لا"}</td>
                <td>{param.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CodeBlock label="مثال طلب" code={endpoint.exampleRequest} />
      <CodeBlock label="مثال استجابة ناجحة" code={endpoint.exampleResponse} />
      {endpoint.errorResponse && <CodeBlock label="مثال استجابة خطأ" code={endpoint.errorResponse} />}

      {endpoint.notes && endpoint.notes.length > 0 && (
        <ul>
          {endpoint.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
