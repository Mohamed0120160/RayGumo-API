import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { FaqAccordion } from "@/components/docs/FaqAccordion";

export const metadata: Metadata = { title: "الأسئلة الشائعة" };

export default function FaqPage() {
  return (
    <DocPageShell currentHref="/docs/faq" eyebrow="مرجعية" title="الأسئلة الشائعة">
      <FaqAccordion
        items={[
          {
            question: "كيف أضيف لعبة جديدة (مثل Anime أو Riddles) للـ API؟",
            answer: (
              <p>
                أنشئ وحدة جديدة كاملة في <code>src/modules/games/&#123;اللعبة&#125;/</code> بنفس
                نمط وحدة الكويز، أضف اسمها في <code>GAME_REGISTRY</code>، ثم اربطها من داخل{" "}
                <code>registry.ts</code>. راجع{" "}
                <a href="/docs/architecture#adding-game">قسم إضافة لعبة جديدة</a> في صفحة بنية
                المشروع للتفاصيل الكاملة خطوة بخطوة.
              </p>
            ),
          },
          {
            question: "كيف أمنع تكرار نفس السؤال في بوتي؟",
            answer: (
              <p>
                استخدم <code>GET /api/games/quiz/random-exclude?ids=1,2,3</code> بدل{" "}
                <code>/random</code>، مع تخزين قائمة الـ id المستخدمة سابقًا لكل مجموعة على حدة في
                بوتك. راجع <a href="/docs/whatsapp-bot">دليل تكامل بوت واتساب</a> لمثال كامل.
              </p>
            ),
          },
          {
            question: "كيف أستخدم فئات (categories) الأسئلة؟",
            answer: (
              <p>
                كل سؤال يحتوي حقل <code>category</code> نصي. الـ API لا يدعم فلترة الفئة كمعامل
                استعلام مباشر بعد، لكن يمكنك جلب كل الأسئلة عبر <code>/all</code> وتصفيتها من طرف
                العميل — راجع <a href="/docs/examples#category">مثال التصفية حسب الفئة</a>.
              </p>
            ),
          },
          {
            question: "كيف أنشر نسخة خاصة بي من المشروع؟",
            answer: (
              <p>
                استنسخ المستودع، ثم اربطه بحساب Vercel وانشره مباشرة — لا توجد متغيرات بيئة مطلوبة
                للتشغيل الأساسي. راجع <a href="/docs/installation">صفحة التثبيت والاستخدام</a> للبدء.
              </p>
            ),
          },
          {
            question: "كيف أربط بوت واتساب بالـ API؟",
            answer: (
              <p>
                راجع <a href="/docs/whatsapp-bot">دليل تكامل بوت واتساب (Baileys)</a> الكامل، الذي
                يغطي جلب الأسئلة، إرسالها، التحقق من الإجابات، ومنع التكرار بأمثلة جاهزة.
              </p>
            ),
          },
          {
            question: "هل يمكنني تعديل ملف الأسئلة مباشرة على الخادم؟",
            answer: (
              <p>
                لا. نظام ملفات Vercel للقراءة فقط أثناء التشغيل. لتحديث المحتوى، عدّل{" "}
                <code>questions.json</code> محليًا ثم ادفع (push) تحديثًا جديدًا عبر Git.
              </p>
            ),
          },
        ]}
      />
    </DocPageShell>
  );
}
