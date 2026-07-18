import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = { title: "بنية المشروع" };

const FOLDER_TREE = `src/
├── app/
│   ├── page.tsx                       # صفحة معلومات بسيطة (ليست الهدف الأساسي)
│   └── api/
│       ├── [...notfound]/             # معالج شامل -> JSON 404 لأي مسار API غير موجود
│       └── games/[game]/
│           ├── random/route.ts        # سؤال عشوائي
│           ├── random-exclude/route.ts# سؤال عشوائي مع استثناء
│           ├── all/route.ts           # كل الأسئلة
│           ├── count/route.ts         # العدد الإجمالي
│           └── [id]/route.ts          # سؤال بالرقم
│
├── modules/games/
│   ├── registry.ts                    # المُبدّل: يربط slug اللعبة بوحدتها
│   └── quiz/                          # وحدة الكويز الكاملة (مستقلة تمامًا)
│       ├── quiz.service.ts            # منطق العمل: تحميل، توليد id، اختيار عشوائي...
│       ├── quiz.types.ts              # نوع QuizQuestion
│       ├── quiz.validation.ts         # isValidQuizQuestion
│       └── index.ts                   # نقطة الدخول العامة للوحدة
│
├── data/quiz/questions.json           # بيانات الكويز الفعلية
│
├── lib/
│   ├── json-db.ts                     # طبقة قراءة JSON عامة (لا تعرف شيئًا عن الكويز تحديدًا)
│   ├── response.ts                    # ok() / notFound() / badRequest() / serverError()
│   └── validation.ts                  # parseId() / parseIdsList()
│
└── types/
    ├── api.ts                         # ApiResponse<T> الموحّد
    └── games.ts                       # GAME_REGISTRY + isValidGameSlug`;

const REGISTRY_SNIPPET = `// src/modules/games/registry.ts (مختصر)
export async function getRandomItem(slug: string) {
  assertValidSlug(slug);
  switch (slug) {
    case "quiz":
      return quiz.getRandomQuestion();
    // ← أضف حالة جديدة هنا عند إضافة لعبة، مثل: case "anime": return anime.getRandomItem();
  }
}`;

export default function ArchitecturePage() {
  return (
    <DocPageShell
      currentHref="/docs/architecture"
      eyebrow="الأساسيات"
      title="بنية المشروع"
      lede="الطبقات الأربع للمشروع، ورحلة طلب واحد من البداية للنهاية، وكيفية إضافة لعبة جديدة."
      toc={[
        { id: "folders", label: "هيكل المجلدات" },
        { id: "layers", label: "الطبقات الأربع" },
        { id: "request-journey", label: "رحلة طلب واحد" },
        { id: "why-json", label: "لماذا JSON وليس قاعدة بيانات؟" },
        { id: "adding-game", label: "كيف تضيف لعبة جديدة" },
      ]}
    >
      <h2 id="folders">هيكل المجلدات</h2>
      <CodeBlock label="src/" code={FOLDER_TREE} />

      <h2 id="layers">الطبقات الأربع</h2>
      <ul>
        <li>
          <strong>طبقة المسارات (Routes)</strong> — ملفات <code>route.ts</code> تحت{" "}
          <code>app/api/games/[game]/</code>. هذه الطبقة <em>عامة تمامًا</em>: لا تعرف شيئًا عن
          الكويز أو أي لعبة أخرى، فقط تستقبل طلب HTTP وتمرره للطبقة التالية عبر السجلّ.
        </li>
        <li>
          <strong>طبقة السجلّ (Registry)</strong> — <code>modules/games/registry.ts</code>. هي
          "المُبدّل" الذي يقرر أي وحدة لعبة تخدم أي slug قادم من الرابط.
        </li>
        <li>
          <strong>طبقة الخدمة (Service)</strong> — مثل <code>quiz.service.ts</code>. هنا يعيش
          المنطق الفعلي: تحميل البيانات، توليد الـ id، الاختيار العشوائي، التحقق من الصحة.
        </li>
        <li>
          <strong>طبقة التخزين (Storage)</strong> — <code>lib/json-db.ts</code>. طبقة قراءة JSON
          عامة تمامًا، تُستخدم من أي وحدة لعبة، ولا تعرف شيئًا عن شكل البيانات الداخلي لأي لعبة
          بعينها.
        </li>
      </ul>

      <h2 id="request-journey">رحلة طلب واحد، خطوة بخطوة</h2>
      <ol>
        <li>
          البوت يرسل <code>GET /api/games/quiz/random</code>.
        </li>
        <li>
          <code>route.ts</code> يستقبل الطلب، ويستدعي <code>getRandomItem(&quot;quiz&quot;)</code>{" "}
          من السجلّ.
        </li>
        <li>
          السجلّ يتحقق أن <code>&quot;quiz&quot;</code> مسجّل فعلًا في <code>GAME_REGISTRY</code>،
          ثم يستدعي <code>quiz.getRandomQuestion()</code>.
        </li>
        <li>
          خدمة الكويز تحمّل الأسئلة (من الذاكرة المؤقتة إن وُجدت، أو من الملف أول مرة)، وتختار
          فهرسًا عشوائيًا آمنًا.
        </li>
        <li>
          النتيجة تُغلَّف في شكل <code>&#123; success: true, data &#125;</code> الموحّد عبر{" "}
          <code>lib/response.ts</code>، وتُرجَع للبوت كـ JSON.
        </li>
      </ol>

      <h2 id="why-json">لماذا JSON وليس قاعدة بيانات؟</h2>
      <p>
        المشروع يعمل بالكامل على دوال Vercel الخادمية (serverless functions)، ونظام الملفات هناك{" "}
        <strong>للقراءة فقط</strong> أثناء التشغيل الفعلي (باستثناء <code>/tmp</code>). هذا يجعل
        قراءة ملف JSON ثابت آمنة ومثالية للأداء — لا حاجة لخادم قاعدة بيانات منفصل، ولا تكلفة
        استضافة إضافية، ولا نقطة فشل خارجية.
      </p>
      <Callout type="note">
        <p>
          تحديث المحتوى في الإنتاج (مثل إضافة أسئلة جديدة) يتم عبر تعديل ملف <code>questions.json</code>{" "}
          ثم عمل <code>git push</code> جديد، وليس عبر كتابة وقت التشغيل.
        </p>
      </Callout>

      <h2 id="adding-game">كيف تضيف لعبة جديدة (مثال: Anime API)</h2>
      <ol>
        <li>
          أنشئ وحدة كاملة في <code>src/modules/games/anime/</code> بنفس نمط <code>quiz/</code>{" "}
          بالضبط: <code>anime.service.ts</code>, <code>anime.types.ts</code>,{" "}
          <code>anime.validation.ts</code>, <code>index.ts</code>.
        </li>
        <li>
          أضف <code>&quot;anime&quot;</code> إلى <code>GAME_REGISTRY</code> في{" "}
          <code>src/types/games.ts</code>.
        </li>
        <li>
          أضف حالة جديدة في كل دالة داخل <code>registry.ts</code> تربط <code>&quot;anime&quot;</code>{" "}
          بدوال وحدة الأنمي الجديدة:
        </li>
      </ol>
      <CodeBlock label="registry.ts" code={REGISTRY_SNIPPET} />
      <p>
        لاحظ أن ملفات <code>route.ts</code> نفسها <strong>لا تحتاج أي تعديل إطلاقًا</strong> — فقط
        طبقة السجلّ ووحدة اللعبة الجديدة. نفس المبدأ ينطبق على التوثيق: راجع{" "}
        <a href="/docs/api-reference">مقدمة مرجع الـ API</a> لمعرفة كيف تُضاف صفحة توثيق جديدة بنفس
        السهولة.
      </p>
    </DocPageShell>
  );
}
