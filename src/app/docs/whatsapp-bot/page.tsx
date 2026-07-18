import type { Metadata } from "next";
import { DocPageShell } from "@/components/docs/DocPageShell";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = { title: "بوت واتساب (Baileys)" };

const FETCH_QUESTION = `import fetch from "node-fetch"; // أو fetch المدمجة في Node.js 18+

const API_BASE = "https://your-domain.vercel.app/api/games";

async function fetchQuestion(excludeIds = []) {
  const url = new URL(\`\${API_BASE}/quiz/random-exclude\`);
  if (excludeIds.length > 0) {
    url.searchParams.set("ids", excludeIds.join(","));
  }

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    // "لا يوجد سؤال متبقٍ" أو أي خطأ آخر
    throw new Error(json.message);
  }

  return json.data; // { id, question, answers, category }
}`;

const SEND_QUESTION = `// إرسال السؤال داخل مجموعة واتساب عبر Baileys
async function sendQuizQuestion(sock, groupId, question) {
  await sock.sendMessage(groupId, {
    text: \`🧠 *سؤال كويز*\\n\\n\${question.question}\\n\\n(فئة: \${question.category})\`,
  });
}`;

const CHECK_ANSWER = `// التحقق من إجابة المستخدم مقابل answers[]
function normalize(text) {
  return text.trim().toLowerCase();
}

function isCorrectAnswer(userText, question) {
  const normalizedUserAnswer = normalize(userText);
  return question.answers.some((answer) => normalize(answer) === normalizedUserAnswer);
}`;

const HISTORY_STORE = `// تخزين بسيط لتاريخ الأسئلة المستخدمة لكل مجموعة (في الذاكرة أو أي تخزين دائم لديك)
const usedQuestionsByGroup = new Map(); // groupId -> Set<number>

function getUsedIds(groupId) {
  if (!usedQuestionsByGroup.has(groupId)) {
    usedQuestionsByGroup.set(groupId, new Set());
  }
  return usedQuestionsByGroup.get(groupId);
}

function markQuestionUsed(groupId, questionId) {
  getUsedIds(groupId).add(questionId);
}

function resetHistory(groupId) {
  usedQuestionsByGroup.set(groupId, new Set());
}`;

const FULL_WORKFLOW = `// سير العمل الكامل: أمر "!كويز" في بوت واتساب
async function handleQuizCommand(sock, msg, groupId) {
  const excludeIds = Array.from(getUsedIds(groupId));

  let question;
  try {
    question = await fetchQuestion(excludeIds);
  } catch (err) {
    if (err.message.includes("لا يوجد أي سؤال متبقٍ")) {
      // كل الأسئلة استُخدمت بالفعل - صفّر التاريخ وابدأ من جديد
      resetHistory(groupId);
      question = await fetchQuestion([]);
    } else {
      throw err;
    }
  }

  await sendQuizQuestion(sock, groupId, question);
  markQuestionUsed(groupId, question.id);

  // احفظ "السؤال الحالي" لهذه المجموعة لمقارنة الإجابة القادمة به
  activeQuestionByGroup.set(groupId, question);
}

// عند وصول أي رسالة نصية عادية في المجموعة (وليس أمرًا)
async function handleIncomingAnswer(sock, msg, groupId, userText, userId) {
  const activeQuestion = activeQuestionByGroup.get(groupId);
  if (!activeQuestion) return; // لا يوجد سؤال نشط حاليًا

  if (isCorrectAnswer(userText, activeQuestion)) {
    await sock.sendMessage(groupId, { text: \`✅ إجابة صحيحة! +1 نقطة\` });
    awardPoint(groupId, userId); // منطق النقاط داخل البوت نفسه، ليس من الـ API
    activeQuestionByGroup.delete(groupId);

    // اطلب السؤال التالي تلقائيًا
    await handleQuizCommand(sock, msg, groupId);
  }
}`;

export default function WhatsappBotPage() {
  return (
    <DocPageShell
      currentHref="/docs/whatsapp-bot"
      eyebrow="التكامل"
      title="دليل تكامل بوت واتساب (Baileys)"
      lede="دليل كامل خطوة بخطوة لربط RayGumo API ببوت واتساب مبني على Baileys، من أول طلب حتى نظام كويز تفاعلي كامل."
      toc={[
        { id: "prereqs", label: "قبل أن تبدأ" },
        { id: "fetch", label: "١. جلب سؤال" },
        { id: "send", label: "٢. إرسال السؤال" },
        { id: "check", label: "٣. التحقق من الإجابة" },
        { id: "history", label: "٤. تخزين تاريخ الأسئلة" },
        { id: "workflow", label: "سير العمل الكامل" },
      ]}
    >
      <h2 id="prereqs">قبل أن تبدأ</h2>
      <p>
        هذا الدليل يفترض أن لديك بوت واتساب يعمل بالفعل باستخدام مكتبة{" "}
        <a href="https://github.com/WhiskeySockets/Baileys" target="_blank" rel="noreferrer">
          Baileys
        </a>{" "}
        (أو أي fork منها)، وأن لديك <code>sock</code> (اتصال Baileys النشط) جاهزًا لإرسال الرسائل.
        كل أمثلة هذا الدليل تفترض Node.js 18 أو أحدث (يحتوي <code>fetch</code> مدمجًا).
      </p>

      <h2 id="fetch">١. جلب سؤال من الـ API</h2>
      <p>
        استخدم <code>random-exclude</code> بدل <code>random</code> العادي منذ البداية — هذا يجهّز
        بوتك لمنع التكرار بدون أي تعديل لاحق:
      </p>
      <CodeBlock label="quiz-api.js" code={FETCH_QUESTION} />

      <h2 id="send">٢. إرسال السؤال في المجموعة</h2>
      <CodeBlock label="quiz-bot.js" code={SEND_QUESTION} />

      <h2 id="check">٣. التحقق من إجابة المستخدم</h2>
      <p>
        قارن دائمًا مقابل <strong>كل</strong> عناصر <code>answers[]</code>، وليس عنصرًا واحدًا فقط،
        لأن السؤال قد يقبل أكثر من صيغة صحيحة:
      </p>
      <CodeBlock label="quiz-bot.js" code={CHECK_ANSWER} />

      <h2 id="history">٤. تخزين تاريخ الأسئلة ومنع التكرار</h2>
      <Callout type="note" title="لماذا هذا مسؤولية البوت؟">
        <p>
          RayGumo API بلا حالة (stateless) تمامًا — لا يحفظ أي شيء عن &quot;الأسئلة المستخدمة
          سابقًا&quot;. البوت هو المسؤول عن تتبّع ذلك لكل مجموعة على حدة (في الذاكرة، أو في أي
          تخزين دائم يستخدمه بوتك مثل UltraDB أو MongoDB)، ثم إرسال قائمة تلك الـ id مع كل طلب.
        </p>
      </Callout>
      <CodeBlock label="quiz-history.js" code={HISTORY_STORE} />

      <h2 id="workflow">سير العمل الكامل</h2>
      <p>مثال كامل يجمع كل الخطوات السابقة في تدفق أمر حقيقي:</p>
      <ol>
        <li>المستخدم يرسل أمر (مثل <code>!كويز</code>).</li>
        <li>البوت يطلب سؤالًا من الـ API، مستثنيًا الأسئلة المستخدمة سابقًا لهذه المجموعة.</li>
        <li>الـ API يرجع سؤالًا جديدًا (أو خطأ NOT_FOUND إذا انتهت كل الأسئلة).</li>
        <li>البوت يرسل السؤال في المجموعة، ويسجّل رقمه في تاريخ الاستخدام المحلي.</li>
        <li>عند وصول رسالة تالية، البوت يقارنها بإجابات السؤال النشط.</li>
        <li>عند التطابق: البوت يمنح نقطة، ويطلب السؤال التالي تلقائيًا.</li>
      </ol>
      <CodeBlock label="full-workflow.js" code={FULL_WORKFLOW} />

      <Callout type="tip" title="أمثلة أكثر">
        <p>
          راجع <a href="/docs/examples">صفحة الأمثلة العملية</a> لسيناريوهات إضافية جاهزة للنسخ
          واللصق.
        </p>
      </Callout>
    </DocPageShell>
  );
}
