/**
 * ملف: quiz.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة الكويز - هي المكان الوحيد
 * الذي يحتوي منطق العمل الفعلي لأسئلة الكويز (تحميل البيانات، توليد
 * الـ id تلقائيًا، التحقق من الصحة، اختيار عشوائي، اختيار عشوائي مع
 * استثناء، بحث بالـ id، إرجاع الكل، حساب العدد).
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   quiz.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل سؤال الكويز)
 *       ↓ تقرأ
 *   src/data/quiz/questions.json (البيانات الحقيقية على القرص)
 *
 * لماذا لا نستخدم getRandomItem/getItemById/getAllItems الجاهزة من
 * lib/json-db.ts مباشرة كما في السابق؟ لأن مصدر البيانات الخام الآن
 * لا يحتوي حقل id إطلاقًا (المزوّد يعطينا question/answers/category
 * فقط)، والـ id يجب أن يُولَّد هنا في طبقة الكويز نفسها بعد التحميل،
 * وليس في الطبقة العامة lib/json-db.ts التي يجب أن تبقى لا تعرف شيئًا
 * عن تفاصيل الكويز تحديدًا.
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidQuizQuestion } from "./quiz.validation";
import type { QuizQuestion } from "./quiz.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const QUIZ_CATEGORY = "quiz";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) لأسئلة الكويز بعد
 * توليد الـ id والتحقق منها، حتى لا نعيد قراءة الملف من القرص وتوليد
 * كل الـ id من جديد في كل طلب HTTP. تُملأ مرة واحدة فقط عند أول طلب،
 * ثم تُعاد من الذاكرة مباشرة في الطلبات التالية (ضمن نفس عملية
 * التشغيل/lambda instance).
 */
let cachedQuestions: QuizQuestion[] | null = null;

/**
 * تُحمّل بيانات الكويز الخام من questions.json، تولّد id تسلسليًا لكل
 * سؤال (1، 2، 3...) بنفس ترتيب ظهوره في الملف، ثم تتحقق من صحة كل سؤال
 * وتتجاهل بأمان أي سجل غير صالح (بدل أن يوقف الـ API بالكامل).
 *
 * خطوات العمل:
 *   1. نقرأ المصفوفة الخام كما هي (بدون افتراض وجود id فيها).
 *   2. لكل عنصر: نولّد id = ترتيبه في الملف (يبدأ من 1)، بحيث نفس
 *      السؤال يحصل دائمًا على نفس الـ id طالما ترتيبه في الملف لم
 *      يتغيّر - هذا يجعل روابط /api/games/quiz/[id] مستقرة بين الطلبات.
 *   3. نتحقق من صحة شكل كل سؤال (question/answers/category) عبر
 *      isValidQuizQuestion. أي سؤال لا يجتاز التحقق يُتجاهَل بصمت (لا
 *      نرمي خطأ يوقف كل الأسئلة الأخرى بسبب سجل واحد فاسد).
 *   4. نخزّن النتيجة في cachedQuestions لإعادة استخدامها لاحقًا.
 */
async function loadQuestions(): Promise<QuizQuestion[]> {
  if (cachedQuestions) return cachedQuestions;

  const raw = await readRawCollection(QUIZ_CATEGORY);

  const withIds: unknown[] = raw.map((item, index) => {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      // ملاحظة: id يُوضَع بعد نشر (...) بقية الحقول عمدًا، حتى يفوز
      // دائمًا الترقيم التسلسلي المولَّد هنا على أي حقل id قديم/عشوائي
      // قد يوجد صدفة في مصدر البيانات الخام.
      return { ...(item as Record<string, unknown>), id: index + 1 };
    }
    return item;
  });

  const valid = withIds.filter(isValidQuizQuestion);

  cachedQuestions = valid;
  return valid;
}

/**
 * تُرجع سؤال كويز عشوائيًا واحدًا.
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية، لأنها أكثر قوة
 * وأقل قابلية للتنبؤ - مهم خصوصًا مع تكرار الاستدعاء بمعدل عالٍ من
 * بوتات متعددة في نفس الوقت.
 */
export async function getRandomQuestion(): Promise<QuizQuestion> {
  const questions = await loadQuestions();
  if (questions.length === 0) {
    throw new JsonDbError(`Collection "${QUIZ_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(questions.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأنه ناتج عن
  // pickRandomIndex(questions.length) وقد تحققنا أعلاه أن length > 0.
  return questions[index] as QuizQuestion;
}

/**
 * تُرجع سؤالًا عشوائيًا واحدًا مع استثناء مجموعة من الـ id المُمرَّرة.
 * يستخدمها بوت الواتساب لمنع تكرار نفس السؤال داخل نفس المجموعة
 * (الـ API نفسه لا يحتفظ بأي حالة/state دائمة عن الأسئلة المستخدمة -
 * البوت هو من يتتبّع ذلك ويرسل قائمة الاستثناء مع كل طلب).
 *
 * إذا كانت كل الأسئلة مستثناة (لم يتبقَّ أي سؤال جديد)، تُرمى
 * JsonDbError بكود NOT_FOUND ورسالة واضحة، بدل إرجاع سؤال مكرر بصمت.
 */
export async function getRandomQuestionExcluding(excludeIds: number[]): Promise<QuizQuestion> {
  const questions = await loadQuestions();
  const excludeSet = new Set(excludeIds);
  const remaining = questions.filter((q) => !excludeSet.has(q.id));

  if (remaining.length === 0) {
    throw new JsonDbError(
      "لا يوجد أي سؤال متبقٍ بعد استثناء كل الأسئلة المُمرَّرة (كل الأسئلة استُخدمت بالفعل)",
      "NOT_FOUND"
    );
  }

  const index = pickRandomIndex(remaining.length);
  // آمن دائمًا لنفس السبب أعلاه: تحققنا أن remaining.length > 0 قبل هذا السطر.
  return remaining[index] as QuizQuestion;
}

/**
 * تبحث عن سؤال كويز واحد بواسطة id الرقمي الخاص به.
 * ترجع null إذا لم يوجد سؤال بهذا الـ id (وهي حالة طبيعية متوقعة،
 * وليست خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getQuestionById(id: number): Promise<QuizQuestion | null> {
  const questions = await loadQuestions();
  return questions.find((q) => q.id === id) ?? null;
}

/** تُرجع كل أسئلة الكويز الصالحة الموجودة في questions.json كمصفوفة كاملة. */
export async function getAllQuestions(): Promise<QuizQuestion[]> {
  return loadQuestions();
}

/**
 * تُرجع العدد الإجمالي لأسئلة الكويز المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الأسئلة: 260" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة الأسئلة بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getQuestionCount(): Promise<number> {
  const questions = await getAllQuestions();
  return questions.length;
}

/**
 * تختار فهرسًا (index) عشوائيًا في المدى [0, length) باستخدام
 * crypto.getRandomValues بدل Math.random العادية.
 *
 * لماذا: Math.random() في جافاسكريبت مولّد أرقام عشوائية "غير آمن
 * تعميّاً" (non-cryptographic) وله انحيازات طفيفة معروفة في بعض
 * المحركات. crypto.getRandomValues (متوفرة أصلًا في بيئة Node.js
 * وVercel Edge/Serverless بدون أي استيراد إضافي) توفّر توزيعًا أكثر
 * انتظامًا وأقل قابلية للتنبؤ - مناسب أكثر لتجربة "سؤال عشوائي فعلًا"
 * في لعبة كويز تفاعلية.
 */
function pickRandomIndex(length: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  // buffer[0] آمن دائمًا هنا (المصفوفة بحجم 1 عنصر بالضبط تم ملؤه للتو).
  const randomValue = buffer[0] as number;
  // نقسم على (0xFFFFFFFF + 1) لنحصل على كسر عشري في [0, 1) مثل Math.random(),
  // ثم نضربه في length ونقرّبه للأسفل للحصول على فهرس صالح.
  const fraction = randomValue / 0x100000000;
  return Math.floor(fraction * length);
}

// نعيد تصدير JsonDbError هنا حتى تستطيع ملفات route.ts استيرادها من
// نفس مكان استيراد دوال الخدمة، بدل الاستيراد من lib/json-db مباشرة.
export { JsonDbError };
