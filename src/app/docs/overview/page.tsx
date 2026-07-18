import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = { title: "نظرة عامة" };

export default function OverviewPage() {
  return (
    <DocPageShell
      currentHref="/docs/overview"
      eyebrow="الأساسيات"
      title="نظرة عامة"
      lede="ما هو RayGumo API، لمن هو موجّه، وما الذي يمكنك بناؤه به."
      toc={[
        { id: "what-is-it", label: "ما هو RayGumo API؟" },
        { id: "audience", label: "لمن هذا المشروع؟" },
        { id: "use-cases", label: "حالات الاستخدام المدعومة" },
        { id: "available-now", label: "المتاح حاليًا" },
        { id: "future", label: "نموذج التوسّع المستقبلي" },
      ]}
    >
      <h2 id="what-is-it">ما هو RayGumo API؟</h2>
      <p>
        RayGumo API هو خادم API خفيف مبني بـ Next.js، مصمم خصيصًا لتزويد بوتات واتساب (Baileys)
        والمواقع بمحتوى ألعاب جاهز — بدون قاعدة بيانات، وبدون أي بنية تحتية إضافية غير النشر
        العادي على Vercel.
      </p>
      <p>
        المشروع <strong>مزوّد محتوى فقط</strong>. لا يدير حسابات لاعبين، ولا نقاط XP، ولا مستويات،
        ولا مواسم تصنيف — هذه المسؤوليات تبقى بالكامل داخل البوت نفسه. RayGumo API يركّز على شيء
        واحد فقط ويؤديه بشكل ممتاز: تسليم محتوى موثوق وسريع عبر HTTP.
      </p>

      <h2 id="audience">لمن هذا المشروع؟</h2>
      <ul>
        <li>مطورو بوتات واتساب الذين يبنون ألعابًا تفاعلية داخل مجموعات.</li>
        <li>منشئو محتوى ألعاب يديرون مجتمعات تحتاج مصدر بيانات مركزي وموحّد.</li>
        <li>مطورو مواقع تحتاج جلب محتوى ألعاب ديناميكي (كويز، أنمي، شخصيات...) لعرضه.</li>
      </ul>

      <h2 id="use-cases">حالات الاستخدام المدعومة</h2>
      <ul>
        <li>أوامر كويز داخل بوت واتساب (سؤال عشوائي، تحقق من الإجابة، تسجيل نقاط).</li>
        <li>منع تكرار نفس السؤال على نفس المجموعة عبر آلية الاستثناء المدمجة.</li>
        <li>عرض إحصائيات محتوى (عدد الأسئلة الكلي مثلًا) داخل واجهة البوت أو الموقع.</li>
        <li>تصفح تسلسلي لعنصر محدد عبر رقمه، مفيد لأدوات الإدارة والاختبار.</li>
      </ul>

      <h2 id="available-now">المتاح حاليًا</h2>
      <p>
        هذا الإصدار هو <strong>MVP (منتج بحد أدنى قابل للاستخدام)</strong>. يخدم لعبة واحدة فقط
        حاليًا:
      </p>
      <ul>
        <li>
          <strong>Quiz API</strong> — 5 نقاط وصول لأسئلة عربية متعددة الفئات، مع دعم كامل لمنع
          التكرار. راجع <a href="/docs/api-reference/quiz">مرجع Quiz API</a> للتفاصيل الكاملة.
        </li>
      </ul>

      <h2 id="future">نموذج التوسّع المستقبلي</h2>
      <p>
        بنية المشروع مبنية حول <strong>سجلّ ألعاب مركزي</strong> (Games Registry) يربط اسم اللعبة
        في الرابط بوحدة الكود الفعلية التي تخدمها. هذا يعني أن إضافة لعبة جديدة (Anime، Character،
        Riddles، Images...) لاحقًا لا يتطلب أي تعديل على شكل الروابط أو منطق الاستجابات — فقط
        إضافة وحدة جديدة مستقلة.
      </p>
      <Callout type="tip" title="تريد التفاصيل التقنية؟">
        <p>
          صفحة <a href="/docs/architecture">بنية المشروع</a> تشرح بالتفصيل كيف تُضاف لعبة جديدة
          على مستوى الكود.
        </p>
      </Callout>
    </DocPageShell>
  );
}
