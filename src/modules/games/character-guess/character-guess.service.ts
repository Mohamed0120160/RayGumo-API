/**
 * ملف: character-guess.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة لعبة "خمن الشخصية" - هي
 * المكان الوحيد الذي يحتوي منطق العمل الفعلي (تحميل البيانات، التحقق
 * من صحة كل عنصر وفرادة الـ id، اختيار عشوائي، اختيار عشوائي مع
 * استثناء، بحث بالـ id، إرجاع الكل، حساب العدد).
 *
 * هذا الملف مطابق لبنية eye.service.ts في التدفّق العام (id مخزَّن
 * مسبقًا في الملف، وليس مولَّدًا بالترتيب كما في quiz.service.ts).
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   registry.ts (المُبدّل العام بين الألعاب)
 *       ↓ يستدعي
 *   character-guess.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل العنصر)
 *       ↓ تقرأ
 *   src/data/character-guess/questions.json (البيانات الحقيقية على القرص)
 *
 * ملاحظة مهمة جدًا - منع الغش: على عكس كل الألعاب الأخرى في المشروع،
 * هذه اللعبة تُخفي answers عمدًا في استجابتي getRandomQuestion و
 * getRandomQuestionExcluding (تُرجعان PublicCharacterGuessQuestion بدون
 * answers)، بينما getQuestionById وgetAllQuestions ترجعان العنصر كاملًا
 * مع answers. هذا الفصل مطلوب صراحة حتى لا يستطيع اللاعب رؤية الإجابة
 * الصحيحة قبل التخمين عبر قراءة استجابة /random مباشرة.
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidCharacterGuessQuestion } from "./character-guess.validation";
import type { CharacterGuessQuestion, PublicCharacterGuessQuestion } from "./character-guess.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const CHARACTER_GUESS_CATEGORY = "character-guess";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) لأسئلة "خمن الشخصية"
 * بعد التحقق من صحتها وفرادة الـ id، حتى لا نعيد قراءة الملف من القرص
 * وإعادة التحقق من كل العناصر في كل طلب HTTP. تُملأ مرة واحدة فقط عند
 * أول طلب، ثم تُعاد من الذاكرة مباشرة في الطلبات التالية (ضمن نفس
 * عملية التشغيل/lambda instance).
 */
let cachedQuestions: CharacterGuessQuestion[] | null = null;

/**
 * تُحمّل بيانات "خمن الشخصية" من questions.json كما هي (بما فيها حقل
 * id المخزَّن مسبقًا داخل كل عنصر)، تتحقق من صحة شكل كل عنصر، ثم تتحقق
 * أن كل الـ id فريدة (غير مكررة) بين كل العناصر الصالحة. أي عنصر لا
 * يجتاز التحقق يُتجاهَل بأمان (بدل أن يوقف الـ API بالكامل)، وأي عنصر
 * id بتاعه مكرر يُتجاهَل أيضًا مع تسجيل تحذير - أول ظهور للـ id يفوز،
 * والباقي يُتجاهل.
 */
async function loadQuestions(): Promise<CharacterGuessQuestion[]> {
  if (cachedQuestions) return cachedQuestions;

  const raw = await readRawCollection(CHARACTER_GUESS_CATEGORY);

  const valid = raw.filter(isValidCharacterGuessQuestion);

  const seenIds = new Set<number>();
  const deduped: CharacterGuessQuestion[] = [];
  for (const item of valid) {
    if (seenIds.has(item.id)) {
      console.warn(
        `[character-guess] تم تجاهل سؤال بـ id مكرر: ${item.id}. ` +
          "تأكدي أن كل id في questions.json فريد بعد أي عملية استيراد."
      );
      continue;
    }
    seenIds.add(item.id);
    deduped.push(item);
  }

  cachedQuestions = deduped;
  return deduped;
}

/** تحذف حقل answers من عنصر كامل، لإرجاع نسخة آمنة تمنع الغش. */
function toPublicQuestion(item: CharacterGuessQuestion): PublicCharacterGuessQuestion {
  const { id, question } = item;
  return { id, question };
}

/**
 * تُرجع سؤال "خمن الشخصية" عشوائيًا واحدًا **بدون answers** (لمنع
 * الغش)، لاستجابة /random.
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية، لأنها أكثر قوة
 * وأقل قابلية للتنبؤ - نفس أسلوب quiz.service.ts وeye.service.ts بالضبط.
 */
export async function getRandomQuestion(): Promise<PublicCharacterGuessQuestion> {
  const questions = await loadQuestions();
  if (questions.length === 0) {
    throw new JsonDbError(`Collection "${CHARACTER_GUESS_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(questions.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأنه ناتج عن
  // pickRandomIndex(questions.length) وقد تحققنا أعلاه أن length > 0.
  return toPublicQuestion(questions[index] as CharacterGuessQuestion);
}

/**
 * تُرجع سؤالًا عشوائيًا واحدًا **بدون answers** مع استثناء مجموعة من
 * الـ id المُمرَّرة. يستخدمها بوت الواتساب لمنع تكرار نفس السؤال داخل
 * نفس المجموعة (الـ API نفسه لا يحتفظ بأي حالة/state دائمة عن الأسئلة
 * المستخدمة - البوت هو من يتتبّع ذلك ويرسل قائمة الاستثناء مع كل طلب).
 *
 * إذا كانت كل الأسئلة مستثناة (لم يتبقَّ أي سؤال جديد)، تُرمى
 * JsonDbError بكود NOT_FOUND ورسالة واضحة، بدل إرجاع سؤال مكرر بصمت.
 */
export async function getRandomQuestionExcluding(
  excludeIds: number[]
): Promise<PublicCharacterGuessQuestion> {
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
  return toPublicQuestion(remaining[index] as CharacterGuessQuestion);
}

/**
 * تبحث عن سؤال "خمن الشخصية" واحد بواسطة id الرقمي الخاص به، **مع
 * answers كاملة** (يستخدمها البوت للتحقق محليًا من إجابة اللاعب).
 * ترجع null إذا لم يوجد سؤال بهذا الـ id (وهي حالة طبيعية متوقعة،
 * وليست خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getQuestionById(id: number): Promise<CharacterGuessQuestion | null> {
  const questions = await loadQuestions();
  return questions.find((q) => q.id === id) ?? null;
}

/**
 * تُرجع كل أسئلة "خمن الشخصية" الصالحة **مع answers كاملة** كمصفوفة
 * كاملة. مفيدة لأدوات إدارة المحتوى أو اختبارات المطوّر.
 */
export async function getAllQuestions(): Promise<CharacterGuessQuestion[]> {
  return loadQuestions();
}

/**
 * تُرجع العدد الإجمالي لأسئلة "خمن الشخصية" المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الأسئلة: 400" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة الأسئلة بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getQuestionCount(): Promise<number> {
  const questions = await getAllQuestions();
  return questions.length;
}

/**
 * تختار فهرسًا (index) عشوائيًا في المدى [0, length) باستخدام
 * crypto.getRandomValues بدل Math.random العادية. مطابقة تمامًا لدالة
 * pickRandomIndex في quiz.service.ts وeye.service.ts.
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
