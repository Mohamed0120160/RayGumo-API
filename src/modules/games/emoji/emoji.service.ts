/**
 * ملف: emoji.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة لعبة "إيموجي" - هي المكان
 * الوحيد الذي يحتوي منطق العمل الفعلي (تحميل البيانات، التحقق من صحة
 * كل سؤال وفرادة الـ id، اختيار عشوائي، اختيار عشوائي مع استثناء، بحث
 * بالـ id، إرجاع الكل، حساب العدد).
 *
 * هذا الملف مطابق لبنية riddles.service.ts وeye.service.ts في التدفّق
 * العام (id مخزَّن مسبقًا في الملف، وليس مولَّدًا بالترتيب كما في
 * quiz.service.ts).
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   registry.ts (المُبدّل العام بين الألعاب)
 *       ↓ يستدعي
 *   emoji.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل السؤال)
 *       ↓ تقرأ
 *   src/data/emoji/questions.json (البيانات الحقيقية على القرص)
 *
 * ملاحظة عن الـ id: id مخزَّن مسبقًا داخل كل سؤال في questions.json
 * نفسه (مرقّم تسلسليًا 1، 2، 3... وقت إنشاء الملف)، وليس مولَّدًا وقت
 * التحميل. لذلك هذا الملف **يتحقق فقط** أن كل سؤال في questions.json
 * يمتلك id رقميًا صحيحًا موجبًا وفريدًا (غير مكرر)، ولا يولّد أي id
 * بنفسه - بنفس أسلوب riddles.service.ts بالضبط.
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidEmojiQuestion } from "./emoji.validation";
import type { EmojiQuestion } from "./emoji.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const EMOJI_CATEGORY = "emoji";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) لأسئلة "إيموجي" بعد
 * التحقق من صحتها وفرادة الـ id، حتى لا نعيد قراءة الملف من القرص
 * وإعادة التحقق من كل الأسئلة في كل طلب HTTP. تُملأ مرة واحدة فقط عند
 * أول طلب، ثم تُعاد من الذاكرة مباشرة في الطلبات التالية (ضمن نفس
 * عملية التشغيل/lambda instance).
 */
let cachedEmojiQuestions: EmojiQuestion[] | null = null;

/**
 * تُحمّل بيانات "إيموجي" من questions.json كما هي (بما فيها حقل id
 * المخزَّن مسبقًا داخل كل سؤال)، تتحقق من صحة شكل كل سؤال، ثم تتحقق أن
 * كل الـ id فريدة (غير مكررة) بين كل الأسئلة الصالحة. أي سؤال لا يجتاز
 * التحقق يُتجاهَل بأمان (بدل أن يوقف الـ API بالكامل)، وأي سؤال id بتاعه
 * مكرر يُتجاهَل أيضًا مع تسجيل تحذير - أول ظهور للـ id يفوز، والباقي
 * يُتجاهل.
 *
 * خطوات العمل:
 *   1. نقرأ المصفوفة الخام كما هي من questions.json.
 *   2. نتحقق من صحة شكل كل سؤال (id/emoji/category/answers) عبر
 *      isValidEmojiQuestion. أي سؤال لا يجتاز التحقق يُتجاهَل بصمت.
 *   3. من بين الأسئلة الصالحة، نتأكد أن كل id فريد. لو وُجد id مكرر،
 *      نحتفظ فقط بأول سؤال بهذا الـ id ونتجاهل الباقي (مع تحذير في الـ
 *      console يساعد وقت مراجعة عملية استيراد أسئلة جديدة).
 *   4. نخزّن النتيجة في cachedEmojiQuestions لإعادة استخدامها لاحقًا.
 */
async function loadEmojiQuestions(): Promise<EmojiQuestion[]> {
  if (cachedEmojiQuestions) return cachedEmojiQuestions;

  const raw = await readRawCollection(EMOJI_CATEGORY);

  const valid = raw.filter(isValidEmojiQuestion);

  const seenIds = new Set<number>();
  const deduped: EmojiQuestion[] = [];
  for (const question of valid) {
    if (seenIds.has(question.id)) {
      console.warn(
        `[emoji] تم تجاهل سؤال بـ id مكرر: ${question.id} ("${question.category}"). ` +
          "تأكدي أن كل id في questions.json فريد بعد أي عملية استيراد."
      );
      continue;
    }
    seenIds.add(question.id);
    deduped.push(question);
  }

  cachedEmojiQuestions = deduped;
  return deduped;
}

/**
 * تُرجع سؤال "إيموجي" عشوائيًا واحدًا.
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية، لأنها أكثر قوة
 * وأقل قابلية للتنبؤ - نفس أسلوب quiz.service.ts وriddles.service.ts
 * بالضبط.
 */
export async function getRandomEmojiQuestion(): Promise<EmojiQuestion> {
  const questions = await loadEmojiQuestions();
  if (questions.length === 0) {
    throw new JsonDbError(`Collection "${EMOJI_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(questions.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأنه ناتج عن
  // pickRandomIndex(questions.length) وقد تحققنا أعلاه أن length > 0.
  return questions[index] as EmojiQuestion;
}

/**
 * تُرجع سؤال "إيموجي" عشوائيًا واحدًا مع استثناء مجموعة من الـ id
 * المُمرَّرة. يستخدمها بوت الواتساب لمنع تكرار نفس السؤال داخل نفس
 * المجموعة (الـ API نفسه لا يحتفظ بأي حالة/state دائمة عن الأسئلة
 * المستخدمة - البوت هو من يتتبّع ذلك ويرسل قائمة الاستثناء مع كل طلب).
 *
 * إذا كانت كل الأسئلة مستثناة (لم يتبقَّ أي سؤال جديد)، تُرمى
 * JsonDbError بكود NOT_FOUND ورسالة واضحة، بدل إرجاع سؤال مكرر بصمت.
 */
export async function getRandomEmojiQuestionExcluding(
  excludeIds: number[]
): Promise<EmojiQuestion> {
  const questions = await loadEmojiQuestions();
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
  return remaining[index] as EmojiQuestion;
}

/**
 * تبحث عن سؤال "إيموجي" واحد بواسطة id الرقمي الخاص به.
 * ترجع null إذا لم يوجد سؤال بهذا الـ id (وهي حالة طبيعية متوقعة، وليست
 * خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getEmojiQuestionById(id: number): Promise<EmojiQuestion | null> {
  const questions = await loadEmojiQuestions();
  return questions.find((q) => q.id === id) ?? null;
}

/** تُرجع كل أسئلة "إيموجي" الصالحة الموجودة في questions.json كمصفوفة كاملة. */
export async function getAllEmojiQuestions(): Promise<EmojiQuestion[]> {
  return loadEmojiQuestions();
}

/**
 * تُرجع العدد الإجمالي لأسئلة "إيموجي" المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الأسئلة: 500" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة البيانات بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getEmojiQuestionCount(): Promise<number> {
  const questions = await getAllEmojiQuestions();
  return questions.length;
}

/**
 * تختار فهرسًا (index) عشوائيًا في المدى [0, length) باستخدام
 * crypto.getRandomValues بدل Math.random العادية. مطابقة تمامًا لدالة
 * pickRandomIndex في quiz.service.ts وriddles.service.ts.
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
