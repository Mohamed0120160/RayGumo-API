import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { EndpointSection } from "@/components/docs/EndpointSection";
import { Callout } from "@/components/docs/Callout";
import { QUIZ_ENDPOINTS } from "@/docs-content/api-reference/quiz";

export const metadata: Metadata = { title: "Quiz API" };

export default function QuizApiPage() {
  return (
    <DocPageShell
      currentHref="/docs/api-reference/quiz"
      eyebrow="مرجع الـ API"
      title="Quiz API"
      lede="خمس نقاط وصول لأسئلة كويز عربية متعددة الفئات، مصممة للاستخدام المباشر في بوتات واتساب."
      toc={QUIZ_ENDPOINTS.map((e) => ({ id: e.path.replace(/[^a-z0-9]/gi, "-"), label: e.title, level: 3 as const }))}
    >
      <p>
        قاعدة بيانات الكويز الحالية تحتوي <strong>260 سؤالًا</strong> موزّعة على فئات متعددة
        (جغرافيا، علوم، أدب، وغيرها). كل الأسئلة تدعم أكثر من إجابة صحيحة مقبولة (مثل تهجئتين
        مختلفتين لنفس الاسم).
      </p>
      <Callout type="tip" title="تريد شكل بيانات السؤال بالتفصيل؟">
        <p>
          راجع <a href="/docs/api-reference/quiz/schema">صفحة مخطط بيانات الكويز</a> لشرح كل حقل
          على حدة.
        </p>
      </Callout>

      {QUIZ_ENDPOINTS.map((endpoint) => (
        <EndpointSection
          key={endpoint.path}
          endpoint={endpoint}
          headingId={endpoint.path.replace(/[^a-z0-9]/gi, "-")}
        />
      ))}
    </DocPageShell>
  );
}
