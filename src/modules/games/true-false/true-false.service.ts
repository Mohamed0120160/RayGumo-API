/**
 * ملف: true-false.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة "صح أو خطأ" - هي المكان
 * الوحيد الذي يحتوي منطق العمل الفعلي لأسئلة هذه اللعبة (تحميل البيانات،
 * التحقق من صحة كل سؤال وفرادة الـ id، اختيار عشوائي، اختيار عشوائي مع
 * استثناء، بحث بالـ id، إرجاع الكل، حساب العدد).
 *
 * هذا الملف مطابق لبنية quiz.service.ts في التدفّق العام، لكنه يختلف في
 * نقطة جوهرية واحدة: مصدر الـ id.
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   registry.ts (المُبدّل العام بين الألعاب)
 *       ↓ يستدعي
 *   true-false.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل سؤال صح/خطأ)
 *       ↓ تقرأ
 *   src/data/true-false/questions.json (البيانات الحقيقية على القرص)
 *
 * ملاحظة مهمة عن الـ id (تختلف عن quiz.service.ts):
 * في وحدة الكويز، id يُولَّد تلقائيًا وقت التحميل حسب ترتيب السؤال في
 * الملف. هنا في "صح أو خطأ"، id **مخزَّن يدويًا/مسبقًا داخل كل سؤال في
 * questions.json نفسه** (حقل id ثابت لكل سؤال)، وليس مولَّدًا. السبب:
 * تسهيل استيراد أسئلة جديدة دفعات لاحقة بدون أن يتغيّر id أي سؤال قديم
 * (لو الـ id كان يتولّد بالترتيب، إضافة سؤال في المنتصف كانت هتغيّر id
 * كل الأسئلة اللي بعده - وهو بالظبط اللي عايزين نتجنبه لمنع التكرار).
 * لذلك هذا الملف **يتحقق فقط** أن كل سؤال في questions.json يمتلك id
 * رقميًا صحيحًا موجبًا وفريدًا (غير مكرر)، ولا يولّد أي id بنفسه.
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidTrueFalseQuestion } from "./true-false.validation";
import type { TrueFalseQuestion } from "./true-false.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const TRUE_FALSE_CATEGORY = "true-false";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) لأسئلة "صح أو خطأ"
 * بعد التحقق من صحتها وفرادة الـ id، حتى لا نعيد قراءة الملف من القرص
 * وإعادة التحقق من كل الأسئلة في كل طلب HTTP. تُملأ مرة واحدة فقط عند
 * أول طلب، ثم تُعاد من الذاكرة مباشرة في الطلبات التالية (ضمن نفس
 * عملية التشغيل/lambda instance).
 */
let cachedQuestions: TrueFalseQuestion[] | null = null;

/**
 * تُحمّل بيانات "صح أو خطأ" من questions.json كما هي (بما فيها حقل id
 * المخزَّن مسبقًا داخل كل سؤال)، تتحقق من صحة شكل كل سؤال، ثم تتحقق أن
 * كل الـ id فريدة (غير مكررة) بين كل الأسئلة الصالحة. أي سؤال لا يجتاز
 * التحقق يُتجاهَل بأمان (بدل أن يوقف الـ API بالكامل)، وأي سؤال id بتاعه
 * مكرر يُتجاهَل أيضًا مع تسجيل تحذير - أول ظهور للـ id يفوز، والباقي
 * يُتجاهل.
 *
 * خطوات العمل:
 *   1. نقرأ المصفوفة الخام كما هي من questions.json.
 *   2. نتحقق من صحة شكل كل سؤال (id/question/answer/category) عبر
 *      isValidTrueFalseQuestion. أي سؤال لا يجتاز التحقق يُتجاهَل بصمت.
 *   3. من بين الأسئلة الصالحة، نتأكد أن كل id فريد. لو وُجد id مكرر،
 *      نحتفظ فقط بأول سؤال بهذا الـ id ونتجاهل الباقي (مع تحذير في
 *      الـ console يساعد وقت مراجعة عملية استيراد أسئلة جديدة).
 *   4. نخزّن النتيجة في cachedQuestions لإعادة استخدامها لاحقًا.
 */
async function loadQuestions(): Promise<TrueFalseQuestion[]> {
  if (cachedQuestions) return cachedQuestions;

  const raw = await readRawCollection(TRUE_FALSE_CATEGORY);

  const valid = raw.filter(isValidTrueFalseQuestion);

  const seenIds = new Set<number>();
  const deduped: TrueFalseQuestion[] = [];
  for (const question of valid) {
    if (seenIds.has(question.id)) {
      console.warn(
        `[true-false] تم تجاهل سؤال بـ id مكرر: ${question.id} ("${question.question}"). ` +
          "تأكدي أن كل id في questions.json فريد بعد أي عملية استيراد."
      );
      continue;
    }
    seenIds.add(question.id);
    deduped.push(question);
  }

  cachedQuestions = deduped;
  return deduped;
}

/**
 * تُرجع سؤال "صح أو خطأ" عشوائيًا واحدًا.
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية، لأنها أكثر قوة
 * وأقل قابلية للتنبؤ - نفس أسلوب quiz.service.ts بالضبط.
 */
export async function getRandomQuestion(): Promise<TrueFalseQuestion> {
  const questions = await loadQuestions();
  if (questions.length === 0) {
    throw new JsonDbError(`Collection "${TRUE_FALSE_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(questions.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأنه ناتج عن
  // pickRandomIndex(questions.length) وقد تحققنا أعلاه أن length > 0.
  return questions[index] as TrueFalseQuestion;
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
export async function getRandomQuestionExcluding(
  excludeIds: number[]
): Promise<TrueFalseQuestion> {
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
  return remaining[index] as TrueFalseQuestion;
}

/**
 * تبحث عن سؤال "صح أو خطأ" واحد بواسطة id الرقمي الخاص به.
 * ترجع null إذا لم يوجد سؤال بهذا الـ id (وهي حالة طبيعية متوقعة،
 * وليست خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getQuestionById(id: number): Promise<TrueFalseQuestion | null> {
  const questions = await loadQuestions();
  return questions.find((q) => q.id === id) ?? null;
}

/** تُرجع كل أسئلة "صح أو خطأ" الصالحة الموجودة في questions.json كمصفوفة كاملة. */
export async function getAllQuestions(): Promise<TrueFalseQuestion[]> {
  return loadQuestions();
}

/**
 * تُرجع العدد الإجمالي لأسئلة "صح أو خطأ" المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الأسئلة: 420" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة الأسئلة بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getQuestionCount(): Promise<number> {
  const questions = await getAllQuestions();
  return questions.length;
}

/**
 * تختار فهرسًا (index) عشوائيًا في المدى [0, length) باستخدام
 * crypto.getRandomValues بدل Math.random العادية. مطابقة تمامًا لدالة
 * pickRandomIndex في quiz.service.ts.
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

// نعيد تصدير JsonDbError هنا حتى تستطيع ملفات route.ts (وregistry.ts)
// استيرادها من نفس مكان استيراد دوال الخدمة، بدل الاستيراد من
// lib/json-db مباشرة.
export { JsonDbError };
