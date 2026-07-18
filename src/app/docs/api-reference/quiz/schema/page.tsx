import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = { title: "مخطط بيانات الكويز" };

const SCHEMA = `{
  "id": 1,
  "question": "ما عاصمة النرويج؟",
  "answers": ["أوسلو", "اوسلو"],
  "category": "جغرافيا"
}`;

export default function QuizSchemaPage() {
  return (
    <DocPageShell
      currentHref="/docs/api-reference/quiz/schema"
      eyebrow="مرجع الـ API"
      title="مخطط بيانات الكويز"
      lede="شرح تفصيلي لكل حقل في كائن السؤال، وكيف يُولَّد الـ id تلقائيًا."
      toc={[
        { id: "shape", label: "الشكل الكامل" },
        { id: "fields", label: "شرح الحقول" },
        { id: "auto-id", label: "توليد الـ id تلقائيًا" },
        { id: "multi-answer", label: "دعم إجابات متعددة" },
      ]}
    >
      <h2 id="shape">الشكل الكامل</h2>
      <CodeBlock label="QuizQuestion" code={SCHEMA} />

      <h2 id="fields">شرح الحقول</h2>
      <table>
        <thead>
          <tr>
            <th>الحقل</th>
            <th>النوع</th>
            <th>الوصف</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>id</code>
            </td>
            <td>number</td>
            <td>رقم فريد يميّز كل سؤال. يُولَّد تلقائيًا (انظر أدناه)، وليس جزءًا من مصدر البيانات الخام.</td>
          </tr>
          <tr>
            <td>
              <code>question</code>
            </td>
            <td>string</td>
            <td>نص السؤال. يدعم العربية وUTF-8 بالكامل.</td>
          </tr>
          <tr>
            <td>
              <code>answers</code>
            </td>
            <td>string[]</td>
            <td>مصفوفة كل الإجابات الصحيحة المقبولة لهذا السؤال — دائمًا مصفوفة، حتى لو كانت إجابة واحدة فقط.</td>
          </tr>
          <tr>
            <td>
              <code>category</code>
            </td>
            <td>string</td>
            <td>تصنيف موضوعي للسؤال (مثل &quot;جغرافيا&quot;، &quot;علوم&quot;، &quot;أدب&quot;).</td>
          </tr>
        </tbody>
      </table>

      <h2 id="auto-id">توليد الـ id تلقائيًا</h2>
      <p>
        مصدر البيانات الخام (<code>questions.json</code>) لا يحتوي حقل <code>id</code> إطلاقًا.
        يُولَّد الرقم تسلسليًا حسب ترتيب ظهور السؤال في الملف (يبدأ من 1)، مما يعني أن نفس السؤال
        يحصل دائمًا على نفس الـ id طالما ترتيبه في الملف لم يتغيّر — وهذا يجعل روابط{" "}
        <code>/api/games/quiz/&#123;id&#125;</code> مستقرة بين الطلبات.
      </p>
      <Callout type="warn" title="تنبيه عند تعديل ملف الأسئلة">
        <p>
          إذا أُعيد ترتيب الأسئلة داخل <code>questions.json</code> (وليس فقط إضافة أسئلة جديدة في
          آخر الملف)، ستتغيّر قيم الـ id المرتبطة بالأسئلة القديمة. إن كان بوتك يحفظ أرقام أسئلة
          سابقة (مثل قوائم استثناء)، احرص على إضافة الأسئلة الجديدة فقط في نهاية الملف.
        </p>
      </Callout>

      <h2 id="multi-answer">دعم إجابات متعددة</h2>
      <p>
        الحقل <code>answers</code> مصفوفة نصوص دائمًا، تسمح بقبول أكثر من صيغة صحيحة لنفس الإجابة
        (مثل &quot;أوسلو&quot; و&quot;اوسلو&quot; بدون همزة). عند التحقق من إجابة المستخدم في
        البوت، قارن نصه (بعد تطبيع بسيط مثل إزالة الفراغات الزائدة) بكل عنصر في هذه المصفوفة، وليس
        بعنصر واحد فقط.
      </p>
    </DocPageShell>
  );
}
