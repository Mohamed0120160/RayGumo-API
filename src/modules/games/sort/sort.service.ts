/**
 * ملف: sort.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة لعبة "رتب" - هي المكان
 * الوحيد الذي يحتوي منطق العمل الفعلي (تحميل البيانات، التحقق من صحة
 * كل عنصر وفرادة الـ id، اختيار عشوائي مع اختيار ترتيب واحد للحروف،
 * اختيار عشوائي مع استثناء، بحث بالـ id، إرجاع الكل، حساب العدد).
 *
 * هذا الملف مطابق لبنية eye.service.ts وriddles.service.ts في التدفّق
 * العام (id مخزَّن مسبقًا في الملف، وليس مولَّدًا بالترتيب كما في
 * quiz.service.ts).
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   registry.ts (المُبدّل العام بين الألعاب)
 *       ↓ يستدعي
 *   sort.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل العنصر)
 *       ↓ تقرأ
 *   src/data/sort/questions.json (البيانات الحقيقية على القرص)
 *
 * ملاحظة عن random/random-exclude: هاتان الدالتان تُرجعان عنصر
 * SortRandomItem: id + question واحد فقط (مُختار عشوائيًا من مصفوفة
 * questions) + answers كاملة - بنفس أسلوب باقي الألعاب في المشروع
 * (quiz، eye، riddles...) التي ترجع answers دائمًا حتى في الاستجابات
 * العشوائية. getAllSortQuestions وgetSortQuestionById يرجعان العنصر
 * الكامل (بما فيه answers ومصفوفة questions كاملة)، لأن الغرض منهما
 * أدوات إدارة المحتوى.
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidSortQuestion } from "./sort.validation";
import type { SortQuestion, SortRandomItem } from "./sort.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const SORT_CATEGORY = "sort";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) لأسئلة "رتب" بعد
 * التحقق من صحتها وفرادة الـ id، حتى لا نعيد قراءة الملف من القرص
 * وإعادة التحقق من كل العناصر في كل طلب HTTP. تُملأ مرة واحدة فقط عند
 * أول طلب، ثم تُعاد من الذاكرة مباشرة في الطلبات التالية (ضمن نفس
 * عملية التشغيل/lambda instance).
 */
let cachedQuestions: SortQuestion[] | null = null;

/**
 * تُحمّل بيانات "رتب" من questions.json كما هي (بما فيها حقل id
 * المخزَّن مسبقًا داخل كل عنصر)، تتحقق من صحة شكل كل عنصر، ثم تتحقق أن
 * كل الـ id فريدة (غير مكررة) بين كل العناصر الصالحة. أي عنصر لا يجتاز
 * التحقق يُتجاهَل بأمان (بدل أن يوقف الـ API بالكامل)، وأي عنصر id بتاعه
 * مكرر يُتجاهَل أيضًا مع تسجيل تحذير - أول ظهور للـ id يفوز، والباقي
 * يُتجاهل. بنفس أسلوب eye.service.ts بالضبط.
 */
async function loadQuestions(): Promise<SortQuestion[]> {
  if (cachedQuestions) return cachedQuestions;

  const raw = await readRawCollection(SORT_CATEGORY);

  const valid = raw.filter(isValidSortQuestion);

  const seenIds = new Set<number>();
  const deduped: SortQuestion[] = [];
  for (const item of valid) {
    if (seenIds.has(item.id)) {
      console.warn(
        `[sort] تم تجاهل عنصر بـ id مكرر: ${item.id}. ` +
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
 * تحوّل عنصر SortQuestion كامل إلى SortRandomItem: تختار عشوائيًا سطرًا
 * واحدًا فقط من مصفوفة questions، وتُبقي answers كاملة في الناتج (بنفس
 * أسلوب باقي الألعاب في المشروع).
 */
function toRandomItem(item: SortQuestion): SortRandomItem {
  const index = pickRandomIndex(item.questions.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأن كل عنصر
  // اجتاز isValidSortQuestion، أي أن questions.length > 0 دائمًا هنا.
  const question = item.questions[index] as string;
  return { id: item.id, question, answers: item.answers };
}

/**
 * تُرجع سؤال "رتب" عشوائيًا واحدًا، بشكل SortRandomItem
 * (id + question مفرد + answers كاملة).
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية - نفس أسلوب
 * quiz.service.ts وeye.service.ts بالضبط.
 */
export async function getRandomSortQuestion(): Promise<SortRandomItem> {
  const questions = await loadQuestions();
  if (questions.length === 0) {
    throw new JsonDbError(`Collection "${SORT_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(questions.length);
  // آمن دائمًا لنفس السبب أعلاه.
  const item = questions[index] as SortQuestion;
  return toRandomItem(item);
}

/**
 * تُرجع سؤال "رتب" عشوائيًا واحدًا (بشكل SortRandomItem) مع
 * استثناء مجموعة من الـ id المُمرَّرة. يستخدمها بوت الواتساب لمنع تكرار
 * نفس السؤال داخل نفس المجموعة (الـ API نفسه لا يحتفظ بأي حالة/state
 * دائمة عن الأسئلة المستخدمة - البوت هو من يتتبّع ذلك ويرسل قائمة
 * الاستثناء مع كل طلب).
 *
 * إذا كانت كل الأسئلة مستثناة (لم يتبقَّ أي سؤال جديد)، تُرمى
 * JsonDbError بكود NOT_FOUND ورسالة واضحة، بدل إرجاع سؤال مكرر بصمت.
 */
export async function getRandomSortQuestionExcluding(
  excludeIds: number[]
): Promise<SortRandomItem> {
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
  const item = remaining[index] as SortQuestion;
  return toRandomItem(item);
}

/**
 * تبحث عن سؤال "رتب" واحد كاملًا (بما فيه answers) بواسطة id الرقمي
 * الخاص به. ترجع null إذا لم يوجد سؤال بهذا الـ id (وهي حالة طبيعية
 * متوقعة، وليست خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getSortQuestionById(id: number): Promise<SortQuestion | null> {
  const questions = await loadQuestions();
  return questions.find((q) => q.id === id) ?? null;
}

/** تُرجع كل أسئلة "رتب" الصالحة الموجودة في questions.json كمصفوفة كاملة (بما فيها answers). */
export async function getAllSortQuestions(): Promise<SortQuestion[]> {
  return loadQuestions();
}

/**
 * تُرجع العدد الإجمالي لأسئلة "رتب" المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الأسئلة: 500" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة الأسئلة بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getSortQuestionCount(): Promise<number> {
  const questions = await getAllSortQuestions();
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
