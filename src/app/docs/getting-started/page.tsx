import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = { title: "البدء السريع" };

const SUCCESS_EXAMPLE = `{
  "success": true,
  "data": {
    "id": 1,
    "question": "ما عاصمة النرويج؟",
    "answers": ["أوسلو", "اوسلو"],
    "category": "جغرافيا"
  }
}`;

const ERROR_EXAMPLE = `{
  "success": false,
  "message": "Unknown game category: \\"riddles\\"",
  "code": "NOT_FOUND"
}`;

const CURL_EXAMPLE = `curl https://your-domain.vercel.app/api/games/quiz/random`;

export default function GettingStartedPage() {
  return (
    <DocPageShell
      currentHref="/docs/getting-started"
      eyebrow="الأساسيات"
      title="البدء السريع"
      lede="كل ما تحتاج معرفته لإرسال أول طلب ناجح خلال دقيقتين."
      toc={[
        { id: "base-url", label: "الرابط الأساسي" },
        { id: "request-format", label: "شكل الطلب" },
        { id: "response-format", label: "شكل الاستجابة" },
        { id: "success", label: "استجابة النجاح" },
        { id: "error", label: "استجابة الخطأ" },
        { id: "first-request", label: "أول طلب فعلي" },
      ]}
    >
      <h2 id="base-url">الرابط الأساسي</h2>
      <p>
        كل نقاط الوصول تبدأ بدومين نشر مشروعك على Vercel (أو رابط بيئة التطوير المحلية)، متبوعًا
        بمسار <code>/api/games/&#123;اسم اللعبة&#125;/...</code>:
      </p>
      <CodeBlock label="Base URL" code={`https://your-domain.vercel.app/api/games/`} />
      <Callout type="note">
        <p>
          استبدل <code>your-domain.vercel.app</code> برابط نشر مشروعك الفعلي. أثناء التطوير
          المحلي يكون الرابط عادة <code>http://localhost:3000/api/games/</code>.
        </p>
      </Callout>

      <h2 id="request-format">شكل الطلب</h2>
      <p>
        كل نقاط الوصول الحالية من نوع <code>GET</code> فقط — لا حاجة لإرسال أي جسم طلب (body)، ولا
        رؤوس (headers) خاصة. الطلبات تُقبل من أي مصدر (CORS مفتوح بالكامل) حتى تعمل بوتات
        وتطبيقات مستضافة في أي مكان آخر بدون عوائق.
      </p>

      <h2 id="response-format">شكل الاستجابة</h2>
      <p>
        كل استجابة في المشروع — بغض النظر عن نقطة الوصول — تلتزم بشكل موحّد واحد فقط، حتى تستطيع
        التعامل معه بثقة دون الحاجة لتوقع أشكال JSON مختلفة لكل رابط:
      </p>
      <CodeBlock
        label="TypeScript"
        code={`type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string; code?: string };`}
      />

      <h2 id="success">استجابة النجاح</h2>
      <p>
        عند النجاح، <code>success</code> تكون <code>true</code> دائمًا، و<code>data</code> تحتوي
        البيانات الفعلية المطلوبة (سؤال واحد، أو مصفوفة أسئلة، أو عدد):
      </p>
      <CodeBlock label="مثال" code={SUCCESS_EXAMPLE} />

      <h2 id="error">استجابة الخطأ</h2>
      <p>
        عند الفشل، <code>success</code> تكون <code>false</code> دائمًا، مع <code>message</code>{" "}
        نصي يشرح المشكلة، و<code>code</code> اختياري (مثل <code>NOT_FOUND</code> أو{" "}
        <code>BAD_REQUEST</code>) يمكن التعامل معه برمجيًا:
      </p>
      <CodeBlock label="مثال" code={ERROR_EXAMPLE} />
      <p>
        راجع <a href="/docs/errors">صفحة الأخطاء</a> لقائمة كاملة بكل الرموز المحتملة.
      </p>

      <h2 id="first-request">أول طلب فعلي</h2>
      <p>جرّب الآن مباشرة من الطرفية:</p>
      <CodeBlock label="bash" code={CURL_EXAMPLE} />
      <p>
        الخطوة التالية: <a href="/docs/installation">صفحة التثبيت والاستخدام</a> لأمثلة جاهزة
        بلغات ومنصات مختلفة (المتصفح، Node.js، TypeScript).
      </p>
    </DocPageShell>
  );
}
