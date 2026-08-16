/**
 * ملف: hero-audio.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة لعبة "خمن البطل من
 * الصوت" - هي المكان الوحيد الذي يحتوي منطق العمل الفعلي (تحميل
 * البيانات، التحقق من صحة كل عنصر وفرادة الـ id، اختيار عشوائي،
 * اختيار عشوائي مع استثناء، بحث بالـ id، إرجاع الكل، حساب العدد).
 *
 * هذا الملف مطابق تمامًا لبنية character-guess.service.ts (id مخزَّن
 * مسبقًا في الملف وليس مولَّدًا بالترتيب)، بما في ذلك إرجاع answer
 * كاملة في كل الدوال بلا استثناء.
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   registry.ts (المُبدّل العام بين الألعاب)
 *       ↓ يستدعي
 *   hero-audio.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل العنصر)
 *       ↓ تقرأ
 *   src/data/hero-audio/questions.json (البيانات الحقيقية على القرص)
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidHeroAudioQuestion } from "./hero-audio.validation";
import type { HeroAudioQuestion } from "./hero-audio.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const HERO_AUDIO_CATEGORY = "hero-audio";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) لعناصر "خمن البطل
 * من الصوت" بعد التحقق من صحتها وفرادة الـ id، حتى لا نعيد قراءة
 * الملف من القرص وإعادة التحقق من كل العناصر في كل طلب HTTP. تُملأ
 * مرة واحدة فقط عند أول طلب، ثم تُعاد من الذاكرة مباشرة في الطلبات
 * التالية (ضمن نفس عملية التشغيل/lambda instance).
 */
let cachedQuestions: HeroAudioQuestion[] | null = null;

/**
 * تُحمّل بيانات "خمن البطل من الصوت" من questions.json كما هي (بما
 * فيها حقل id المخزَّن مسبقًا داخل كل عنصر)، تتحقق من صحة شكل كل عنصر،
 * ثم تتحقق أن كل الـ id فريدة (غير مكررة) بين كل العناصر الصالحة. أي
 * عنصر لا يجتاز التحقق يُتجاهَل بأمان (بدل أن يوقف الـ API بالكامل)،
 * وأي عنصر id بتاعه مكرر يُتجاهَل أيضًا مع تسجيل تحذير - أول ظهور
 * للـ id يفوز، والباقي يُتجاهل.
 */
async function loadQuestions(): Promise<HeroAudioQuestion[]> {
  if (cachedQuestions) return cachedQuestions;

  const raw = await readRawCollection(HERO_AUDIO_CATEGORY);

  const valid = raw.filter(isValidHeroAudioQuestion);

  const seenIds = new Set<number>();
  const deduped: HeroAudioQuestion[] = [];
  for (const item of valid) {
    if (seenIds.has(item.id)) {
      console.warn(
        `[hero-audio] تم تجاهل عنصر بـ id مكرر: ${item.id}. ` +
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

/**
 * تُرجع عنصر "خمن البطل من الصوت" عشوائيًا واحدًا (مع answer كاملة).
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية، لأنها أكثر قوة
 * وأقل قابلية للتنبؤ - نفس أسلوب character-guess.service.ts بالضبط.
 */
export async function getRandomQuestion(): Promise<HeroAudioQuestion> {
  const questions = await loadQuestions();
  if (questions.length === 0) {
    throw new JsonDbError(`Collection "${HERO_AUDIO_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(questions.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأنه ناتج عن
  // pickRandomIndex(questions.length) وقد تحققنا أعلاه أن length > 0.
  return questions[index] as HeroAudioQuestion;
}

/**
 * تُرجع عنصرًا عشوائيًا واحدًا (مع answer كاملة) مع استثناء مجموعة من
 * الـ id المُمرَّرة. يستخدمها بوت الواتساب لمنع تكرار نفس البطل داخل
 * نفس المجموعة (الـ API نفسه لا يحتفظ بأي حالة/state دائمة عن العناصر
 * المستخدمة - البوت هو من يتتبّع ذلك ويرسل قائمة الاستثناء مع كل طلب).
 *
 * إذا كانت كل العناصر مستثناة (لم يتبقَّ أي عنصر جديد)، تُرمى
 * JsonDbError بكود NOT_FOUND ورسالة واضحة، بدل إرجاع عنصر مكرر بصمت.
 */
export async function getRandomQuestionExcluding(
  excludeIds: number[]
): Promise<HeroAudioQuestion> {
  const questions = await loadQuestions();
  const excludeSet = new Set(excludeIds);
  const remaining = questions.filter((q) => !excludeSet.has(q.id));

  if (remaining.length === 0) {
    throw new JsonDbError(
      "لا يوجد أي عنصر متبقٍ بعد استثناء كل العناصر المُمرَّرة (كل الأبطال استُخدموا بالفعل)",
      "NOT_FOUND"
    );
  }

  const index = pickRandomIndex(remaining.length);
  // آمن دائمًا لنفس السبب أعلاه: تحققنا أن remaining.length > 0 قبل هذا السطر.
  return remaining[index] as HeroAudioQuestion;
}

/**
 * تبحث عن عنصر "خمن البطل من الصوت" واحد بواسطة id الرقمي الخاص به.
 * ترجع null إذا لم يوجد عنصر بهذا الـ id (وهي حالة طبيعية متوقعة،
 * وليست خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getQuestionById(id: number): Promise<HeroAudioQuestion | null> {
  const questions = await loadQuestions();
  return questions.find((q) => q.id === id) ?? null;
}

/** تُرجع كل عناصر "خمن البطل من الصوت" الصالحة الموجودة في questions.json كمصفوفة كاملة. */
export async function getAllQuestions(): Promise<HeroAudioQuestion[]> {
  return loadQuestions();
}

/**
 * تُرجع العدد الإجمالي لعناصر "خمن البطل من الصوت" المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الأبطال: 127" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة البيانات بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getQuestionCount(): Promise<number> {
  const questions = await getAllQuestions();
  return questions.length;
}

/**
 * تختار فهرسًا (index) عشوائيًا في المدى [0, length) باستخدام
 * crypto.getRandomValues بدل Math.random العادية. مطابقة تمامًا لدالة
 * pickRandomIndex في character-guess.service.ts وeye.service.ts.
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
