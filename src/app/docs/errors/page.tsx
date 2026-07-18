import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = { title: "الأخطاء" };

const NOT_FOUND_GAME = `{
  "success": false,
  "message": "Unknown game category: \\"riddles\\"",
  "code": "NOT_FOUND"
}`;

const NOT_FOUND_QUESTION = `{
  "success": false,
  "message": "No item with id 9999 in \\"quiz\\"",
  "code": "NOT_FOUND"
}`;

const ALL_EXCLUDED = `{
  "success": false,
  "message": "لا يوجد أي سؤال متبقٍ بعد استثناء كل الأسئلة الممرَّرة (كل الأسئلة استُخدمت بالفعل)",
  "code": "NOT_FOUND"
}`;

const INVALID_ID = `{
  "success": false,
  "message": "Invalid id parameter: \\"abc\\"",
  "code": "BAD_REQUEST"
}`;

const INVALID_IDS_LIST = `{
  "success": false,
  "message": "Invalid id value in \\"ids\\" parameter: \\"x\\"",
  "code": "BAD_REQUEST"
}`;

const UNKNOWN_ROUTE = `{
  "success": false,
  "message": "This API route does not exist",
  "code": "NOT_FOUND"
}`;

const SERVER_ERROR = `{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_ERROR"
}`;

export default function ErrorsPage() {
  return (
    <DocPageShell
      currentHref="/docs/errors"
      eyebrow="مرجعية"
      title="الأخطاء"
      lede="كل رموز الأخطاء المحتملة، حالة HTTP المرتبطة بها، وسبب حدوث كل واحد."
      toc={[
        { id: "shape", label: "شكل استجابة الخطأ" },
        { id: "not-found", label: "404 — NOT_FOUND" },
        { id: "bad-request", label: "400 — BAD_REQUEST" },
        { id: "unknown-route", label: "مسار API غير موجود أصلًا" },
        { id: "server-error", label: "500 — INTERNAL_ERROR" },
      ]}
    >
      <h2 id="shape">شكل استجابة الخطأ</h2>
      <p>
        كل خطأ في المشروع يلتزم بنفس الشكل: <code>success: false</code>، <code>message</code>{" "}
        وصفي، و<code>code</code> اختياري للتعامل البرمجي.
      </p>

      <h2 id="not-found">404 — NOT_FOUND</h2>
      <p>يحدث في ثلاث حالات مختلفة، لكن كلها بنفس الكود:</p>

      <h3>لعبة غير مسجّلة</h3>
      <p>
        عند طلب slug لعبة غير موجودة في <code>GAME_REGISTRY</code> (مثل لعبة لم تُطلَق بعد):
      </p>
      <CodeBlock label="مثال" code={NOT_FOUND_GAME} />

      <h3>سؤال غير موجود</h3>
      <p>
        عند طلب <code>id</code> صحيح الصيغة لكن غير موجود فعليًا في مجموعة البيانات:
      </p>
      <CodeBlock label="مثال" code={NOT_FOUND_QUESTION} />

      <h3>كل الأسئلة استُثنيت</h3>
      <p>
        عند استخدام <code>random-exclude</code> ومرّرت كل الـ id المتاحة، بحيث لا يتبقى أي سؤال
        جديد:
      </p>
      <CodeBlock label="مثال" code={ALL_EXCLUDED} />
      <Callout type="tip">
        <p>هذه هي الإشارة للبوت لتصفير تاريخ الأسئلة المستخدمة لهذه المجموعة والبدء من جديد.</p>
      </Callout>

      <h2 id="bad-request">400 — BAD_REQUEST</h2>
      <p>يحدث عندما تكون المدخلات نفسها غير صالحة (وليس المشكلة أن المورد غير موجود):</p>

      <h3>معامل id غير صالح</h3>
      <CodeBlock label="مثال (id=abc)" code={INVALID_ID} />

      <h3>قيمة غير رقمية داخل قائمة ids</h3>
      <CodeBlock label="مثال (ids=1,x,3)" code={INVALID_IDS_LIST} />

      <h2 id="unknown-route">مسار API غير موجود أصلًا</h2>
      <p>
        أي طلب لمسار تحت <code>/api/</code> لا يطابق أي route معرّف فعليًا يرجع دائمًا JSON (وليس
        صفحة 404 من Next.js)، لأن بوتات الواتساب تتوقع JSON فقط:
      </p>
      <CodeBlock label="مثال" code={UNKNOWN_ROUTE} />

      <h2 id="server-error">500 — INTERNAL_ERROR</h2>
      <p>خطأ غير متوقع من طرف الخادم نفسه (مثل ملف JSON تالف). نادر الحدوث في التشغيل العادي:</p>
      <CodeBlock label="مثال" code={SERVER_ERROR} />
    </DocPageShell>
  );
}
