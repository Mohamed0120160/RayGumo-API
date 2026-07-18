import Link from "next/link";
import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";
import { EndpointBadge } from "@/components/docs/EndpointBadge";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "الرئيسية",
};

const QUICK_LINKS = [
  { href: "/docs/getting-started", title: "البدء السريع", desc: "أول طلب API خلال دقيقتين." },
  { href: "/docs/api-reference/quiz", title: "Quiz API", desc: "كل نقاط الوصول الخاصة بأسئلة الكويز." },
  { href: "/docs/whatsapp-bot", title: "دليل بوت واتساب", desc: "دمج الـ API في بوت Baileys خطوة بخطوة." },
  { href: "/docs/errors", title: "الأخطاء", desc: "كل رموز الأخطاء المحتملة ومعناها." },
];

const EXAMPLE = `const res = await fetch("https://your-domain.vercel.app/api/games/quiz/random");
const { success, data } = await res.json();

if (success) {
  console.log(data.question); // "ما عاصمة النرويج؟"
}`;

export default function DocsHomePage() {
  return (
    <div>
      <section className="docs-hero">
        <p className="docs-hero-eyebrow">
          <span className="docs-header-dot" aria-hidden="true" />
          v{APP_CONFIG.version} · موثّق بالكامل
        </p>
        <h1>وثائق مطوّري RayGumo API</h1>
        <p>
          واجهة برمجية خفيفة لتغذية بوتات واتساب ومواقع RayGumo بمحتوى الألعاب — بدون قاعدة
          بيانات، بدون تعقيد، جاهزة لأي عدد من الألعاب المستقبلية.
        </p>
        <div className="docs-hero-ctas">
          <Link href="/docs/getting-started" className="docs-btn docs-btn-primary">
            ابدأ الآن ←
          </Link>
          <Link href="/docs/api-reference/quiz" className="docs-btn docs-btn-secondary">
            مرجع Quiz API
          </Link>
        </div>

        <div className="docs-hero-terminal">
          <EndpointBadge method="GET" path="/api/games/quiz/random" />
          <CodeBlock label="javascript" code={EXAMPLE} />
        </div>
      </section>

      <section className="docs-home-section">
        <h2>ابدأ من هنا</h2>
        <div className="docs-card-grid">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="docs-card">
              <p className="docs-card-title">{link.title}</p>
              <p className="docs-card-desc">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="docs-home-section">
        <h2>لماذا RayGumo API؟</h2>
        <div className="docs-card-grid">
          <div className="docs-card">
            <p className="docs-card-title">🧩 بدون قاعدة بيانات</p>
            <p className="docs-card-desc">كل المحتوى في ملفات JSON داخل المستودع — نشر فوري على Vercel بدون بنية تحتية إضافية.</p>
          </div>
          <div className="docs-card">
            <p className="docs-card-title">🤖 مصمم لبوتات واتساب</p>
            <p className="docs-card-desc">شكل استجابة موحّد، ودعم منع تكرار الأسئلة عبر random-exclude، مبني خصيصًا لتجربة بوت تفاعلي.</p>
          </div>
          <div className="docs-card">
            <p className="docs-card-title">📈 جاهز للنمو</p>
            <p className="docs-card-desc">بنية سجلّ الألعاب (Games Registry) تسمح بإضافة أي عدد من الألعاب المستقبلية بدون إعادة تصميم.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
