import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = { title: "التثبيت والاستخدام" };

const BROWSER_EXAMPLE = `fetch("https://your-domain.vercel.app/api/games/quiz/random")
  .then((res) => res.json())
  .then(({ success, data }) => {
    if (success) {
      document.getElementById("question").textContent = data.question;
    }
  });`;

const NODE_EXAMPLE = `// Node.js 18+ يحتوي fetch مدمجًا، لا حاجة لأي مكتبة إضافية
async function getRandomQuestion() {
  const res = await fetch("https://your-domain.vercel.app/api/games/quiz/random");
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data; // { id, question, answers, category }
}

getRandomQuestion().then((q) => console.log(q.question));`;

const JS_EXAMPLE = `async function fetchQuizQuestion(excludeIds = []) {
  const url = new URL("https://your-domain.vercel.app/api/games/quiz/random-exclude");
  if (excludeIds.length > 0) {
    url.searchParams.set("ids", excludeIds.join(","));
  }

  const res = await fetch(url);
  const json = await res.json();
  return json;
}`;

const TS_EXAMPLE = `interface QuizQuestion {
  id: number;
  question: string;
  answers: string[];
  category: string;
}

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string; code?: string };

async function getRandomQuestion(): Promise<QuizQuestion> {
  const res = await fetch("https://your-domain.vercel.app/api/games/quiz/random");
  const json = (await res.json()) as ApiResponse<QuizQuestion>;

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data;
}`;

export default function InstallationPage() {
  return (
    <DocPageShell
      currentHref="/docs/installation"
      eyebrow="الأساسيات"
      title="التثبيت والاستخدام"
      lede="لا توجد مكتبة (SDK) رسمية بعد — RayGumo API هو HTTP عادي، يعمل مع أي بيئة تدعم fetch."
      toc={[
        { id: "simple", label: "الاستخدام البسيط" },
        { id: "browser", label: "من المتصفح" },
        { id: "node", label: "من Node.js" },
        { id: "javascript", label: "JavaScript" },
        { id: "typescript", label: "TypeScript" },
      ]}
    >
      <h2 id="simple">الاستخدام البسيط</h2>
      <p>
        لا حاجة لتثبيت أي حزمة (package). RayGumo API هو HTTP بسيط، ويمكن استدعاؤه من أي لغة أو
        بيئة تدعم إرسال طلبات HTTP وقراءة JSON — بما في ذلك <code>fetch</code>، أو{" "}
        <code>axios</code>، أو حتى <code>curl</code> مباشرة من الطرفية.
      </p>

      <h2 id="browser">من المتصفح</h2>
      <p>يعمل مباشرة داخل أي صفحة ويب بفضل رؤوس CORS المفتوحة على كل نقاط الوصول:</p>
      <CodeBlock label="browser.js" code={BROWSER_EXAMPLE} />

      <h2 id="node">من Node.js</h2>
      <p>
        Node.js 18 وما بعده يحتوي <code>fetch</code> مدمجًا، فلا حاجة لأي مكتبة HTTP خارجية —
        وهذا الأسلوب المستخدم في كل أمثلة بوت الواتساب لاحقًا:
      </p>
      <CodeBlock label="node.js" code={NODE_EXAMPLE} />

      <h2 id="javascript">JavaScript</h2>
      <p>مثال أكثر اكتمالًا يوضّح بناء رابط مع معامل استعلام (query param) ديناميكيًا:</p>
      <CodeBlock label="javascript" code={JS_EXAMPLE} />

      <h2 id="typescript">TypeScript</h2>
      <p>نفس المنطق، مع أنواع (types) كاملة تطابق شكل استجابة الـ API بالضبط:</p>
      <CodeBlock label="typescript" code={TS_EXAMPLE} />

      <Callout type="tip">
        <p>
          تبني بوت واتساب؟ انتقل مباشرة إلى <a href="/docs/whatsapp-bot">دليل تكامل بوت واتساب</a>{" "}
          لأمثلة Baileys كاملة وجاهزة للاستخدام.
        </p>
      </Callout>
    </DocPageShell>
  );
}
