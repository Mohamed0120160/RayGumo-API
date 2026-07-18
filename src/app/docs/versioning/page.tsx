import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { Callout } from "@/components/docs/Callout";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = { title: "الإصدارات" };

export default function VersioningPage() {
  return (
    <DocPageShell
      currentHref="/docs/versioning"
      eyebrow="مرجعية"
      title="الإصدارات"
      lede="الإصدار الحالي، استراتيجية الإصدارات المستقبلية، وسياسة التغييرات الكاسرة."
      toc={[
        { id: "current", label: "الإصدار الحالي" },
        { id: "strategy", label: "استراتيجية الإصدارات المستقبلية" },
        { id: "breaking", label: "سياسة التغييرات الكاسرة" },
        { id: "deprecation", label: "سياسة الإلغاء التدريجي" },
      ]}
    >
      <h2 id="current">الإصدار الحالي</h2>
      <p>
        الإصدار الحالي هو <code>v{APP_CONFIG.version}</code>، وهو إصدار <strong>MVP</strong> يخدم
        Quiz API فقط. لا يوجد إصدار سابق للمقارنة معه بعد.
      </p>

      <h2 id="strategy">استراتيجية الإصدارات المستقبلية</h2>
      <p>
        المشروع لا يستخدم بادئة إصدار في الرابط حاليًا (مثل <code>/api/v1/...</code>) لأن كل نقاط
        الوصول الحالية <code>GET</code> فقط وقراءة بحتة، بدون أي منطق قد يحتاج تغييرًا كاسرًا قريبًا.
        عند الحاجة الفعلية لإصدار ثانٍ (v2) بسبب تغيير جوهري في شكل الاستجابة أو السلوك، سيُضاف
        الإصدار كبادئة رابط جديدة (<code>/api/v2/...</code>) بينما يستمر <code>/api/v1/...</code>{" "}
        (أو المسار الحالي بدون بادئة) بالعمل دون انقطاع لفترة انتقالية معلنة مسبقًا.
      </p>

      <h2 id="breaking">سياسة التغييرات الكاسرة</h2>
      <p>يُعتبر أي تغيير من التالي تغييرًا كاسرًا (Breaking Change):</p>
      <ul>
        <li>حذف حقل موجود حاليًا من استجابة ناجحة (مثل حذف <code>category</code>).</li>
        <li>تغيير نوع حقل موجود (مثل تحويل <code>answers</code> من مصفوفة إلى نص مفرد).</li>
        <li>تغيير شكل الاستجابة الموحّد نفسه (<code>ApiResponse&lt;T&gt;</code>).</li>
        <li>حذف نقطة وصول موجودة بدون بديل.</li>
        <li>تغيير رمز حالة HTTP المتوقع لحالة معروفة.</li>
      </ul>
      <p>
        <strong>لا يُعتبر</strong> تغييرًا كاسرًا: إضافة حقل جديد اختياري لاستجابة موجودة، إضافة
        نقطة وصول جديدة، أو إضافة لعبة جديدة كليًا تحت <code>/api/games/&#123;لعبة-جديدة&#125;/</code>.
      </p>

      <h2 id="deprecation">سياسة الإلغاء التدريجي</h2>
      <p>
        أي نقطة وصول يُقرَّر إلغاؤها ستبقى تعمل لفترة انتقالية معلنة في{" "}
        <a href="/docs/changelog">سجل التغييرات</a> قبل إزالتها فعليًا، مع رسالة تحذير واضحة إن
        أمكن تقنيًا. لا يوجد حاليًا أي نقطة وصول قيد الإلغاء.
      </p>
      <Callout type="note">
        <p>
          بما أن المشروع لا يزال في مرحلة MVP، أي سياسة هنا قابلة للتطوّر مع نضوج المشروع ونمو عدد
          المستهلكين الفعليين للـ API.
        </p>
      </Callout>
    </DocPageShell>
  );
}
