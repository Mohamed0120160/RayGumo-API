import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = { title: "سجل التغييرات" };

export default function ChangelogPage() {
  return (
    <DocPageShell
      currentHref="/docs/changelog"
      eyebrow="مرجعية"
      title="سجل التغييرات"
      lede="تاريخ تطوّر المشروع، وأهم التغييرات في كل مرحلة."
      toc={[
        { id: "quiz-real-dataset", label: "دمج مجموعة بيانات الكويز الحقيقية" },
        { id: "mvp", label: "الإصدار الأول (MVP)" },
        { id: "upcoming", label: "قادم قريبًا" },
      ]}
    >
      <h2 id="quiz-real-dataset">دمج مجموعة بيانات الكويز الحقيقية</h2>
      <ul>
        <li>
          استبدال بيانات الكويز التجريبية بمجموعة حقيقية تضم <strong>260 سؤالًا</strong> موزّعة
          على 10 فئات (جغرافيا، تاريخ، علوم، وغيرها).
        </li>
        <li>
          تغيير حقل <code>answers</code> ليصبح مصفوفة نصوص دائمًا (بدل نص/إجابة مفردة)، لدعم أكثر
          من صيغة صحيحة لنفس الإجابة.
        </li>
        <li>
          إضافة نقطة وصول جديدة: <code>GET /api/games/quiz/random-exclude</code> لمنع تكرار
          الأسئلة على مستوى كل مجموعة واتساب.
        </li>
        <li>توليد الـ id تلقائيًا وتسلسليًا عند التحميل، بدل الاعتماد على حقل id في مصدر البيانات الخام.</li>
        <li>الانتقال للاختيار العشوائي المبني على <code>crypto.getRandomValues</code> بدل <code>Math.random</code>.</li>
      </ul>

      <h2 id="mvp">الإصدار الأول (MVP)</h2>
      <ul>
        <li>إطلاق أول نسخة من RayGumo API ببنية Next.js 16 (App Router) + TypeScript.</li>
        <li>
          تأسيس نمط سجلّ الألعاب (<code>GAME_REGISTRY</code>) لدعم التوسّع المستقبلي بدون إعادة
          تصميم الروابط.
        </li>
        <li>4 نقاط وصول أساسية: <code>random</code>, <code>all</code>, <code>count</code>,{" "}
          <code>[id]</code>.</li>
        <li>شكل استجابة موحّد (<code>ApiResponse&lt;T&gt;</code>) عبر كل المشروع.</li>
        <li>تخزين المحتوى في ملفات JSON مسطّحة، بدون أي قاعدة بيانات خارجية.</li>
      </ul>

      <h2 id="upcoming">قادم قريبًا</h2>
      <p>
        هذا القسم سيُحدَّث مع كل إصدار جديد. الخطط الحالية (غير مؤكدة التواريخ) تشمل ألعابًا
        إضافية مثل Anime API وCharacter API وRiddles API — راجع{" "}
        <a href="/docs/api-reference">مرجع الـ API</a> لقائمة كاملة بما هو مخطط له.
      </p>
      <Callout type="note">
        <p>هذه الصفحة تُحدَّث يدويًا مع كل تغيير فعلي منشور في المشروع.</p>
      </Callout>
    </DocPageShell>
  );
}
