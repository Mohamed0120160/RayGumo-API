import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata: Metadata = { title: "أمثلة عملية" };

const STATS_EXAMPLE = `async function getQuizStats() {
  const res = await fetch("https://your-domain.vercel.app/api/games/quiz/count");
  const { data } = await res.json();
  return \`إجمالي أسئلة الكويز المتاحة: \${data.count}\`;
}`;

const REVEAL_ANSWER_EXAMPLE = `// عرض نفس السؤال مرة أخرى بعد إجابة خاطئة (باستخدام id ثابت)
async function reshowQuestion(questionId) {
  const res = await fetch(\`https://your-domain.vercel.app/api/games/quiz/\${questionId}\`);
  const json = await res.json();

  if (!json.success) {
    // مثلًا id غير موجود أصلًا
    return null;
  }

  return json.data;
}`;

const RETRY_EXAMPLE = `// إعادة المحاولة تلقائيًا عند خطأ 500 مؤقت من الخادم
async function fetchWithRetry(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);
    const json = await res.json();

    if (json.success || json.code !== "INTERNAL_ERROR") {
      return json;
    }
    // انتظار بسيط قبل إعادة المحاولة (تراجع أسّي بسيط)
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw new Error("فشلت كل محاولات الاتصال بالـ API");
}`;

const CATEGORY_FILTER = `// تصفية الأسئلة حسب الفئة من طرف العميل (الـ API لا يدعم فلترة الفئة مباشرة بعد)
async function getQuestionsByCategory(category) {
  const res = await fetch("https://your-domain.vercel.app/api/games/quiz/all");
  const { data } = await res.json();
  return data.filter((q) => q.category === category);
}`;

export default function ExamplesPage() {
  return (
    <DocPageShell
      currentHref="/docs/examples"
      eyebrow="التكامل"
      title="أمثلة عملية"
      lede="سيناريوهات جاهزة للنسخ واللصق مباشرة في مشروعك."
      toc={[
        { id: "stats", label: "عرض إحصائية بسيطة" },
        { id: "reveal", label: "إعادة عرض سؤال بالرقم" },
        { id: "retry", label: "إعادة المحاولة عند فشل مؤقت" },
        { id: "category", label: "تصفية حسب الفئة" },
      ]}
    >
      <h2 id="stats">عرض إحصائية بسيطة</h2>
      <CodeBlock label="stats.js" code={STATS_EXAMPLE} />

      <h2 id="reveal">إعادة عرض سؤال بالرقم</h2>
      <p>مفيد عندما يريد البوت تذكير المستخدم بالسؤال بعد إجابة خاطئة، دون طلب سؤال عشوائي جديد:</p>
      <CodeBlock label="reveal.js" code={REVEAL_ANSWER_EXAMPLE} />

      <h2 id="retry">إعادة المحاولة عند فشل مؤقت</h2>
      <p>
        نمط شائع لبوتات الإنتاج: إعادة محاولة الطلب فقط عند خطأ <code>INTERNAL_ERROR</code> (500)،
        وليس عند أخطاء 400/404 التي لن تتغيّر بإعادة المحاولة:
      </p>
      <CodeBlock label="retry.js" code={RETRY_EXAMPLE} />

      <h2 id="category">تصفية حسب الفئة</h2>
      <p>
        الـ API لا يدعم فلترة حسب <code>category</code> كمعامل استعلام مباشر بعد. أبسط حل حاليًا:
        جلب كل الأسئلة عبر <code>/all</code> والتصفية من طرف العميل:
      </p>
      <CodeBlock label="category-filter.js" code={CATEGORY_FILTER} />
    </DocPageShell>
  );
}
