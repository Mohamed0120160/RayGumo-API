/**
 * ملف: riddles.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة الألغاز - هي المكان الوحيد
 * الذي يحتوي منطق العمل الفعلي للألغاز (تحميل البيانات، التحقق من صحة
 * كل لغز وفرادة الـ id، اختيار عشوائي، اختيار عشوائي مع استثناء، بحث
 * بالـ id، إرجاع الكل، حساب العدد).
 *
 * هذا الملف مطابق لبنية true-false.service.ts في التدفّق العام (id
 * مخزَّن مسبقًا في الملف، وليس مولَّدًا بالترتيب كما في quiz.service.ts).
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   registry.ts (المُبدّل العام بين الألعاب)
 *       ↓ يستدعي
 *   riddles.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل اللغز)
 *       ↓ تقرأ
 *   src/data/riddles/questions.json (البيانات الحقيقية على القرص)
 *
 * ملاحظة عن الـ id: id مخزَّن مسبقًا داخل كل لغز في questions.json نفسه
 * (مرقّم تسلسليًا 1، 2، 3... وقت إنشاء الملف)، وليس مولَّدًا وقت
 * التحميل. لذلك هذا الملف **يتحقق فقط** أن كل لغز في questions.json
 * يمتلك id رقميًا صحيحًا موجبًا وفريدًا (غير مكرر)، ولا يولّد أي id
 * بنفسه - بنفس أسلوب true-false.service.ts بالضبط.
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidRiddle } from "./riddles.validation";
import type { Riddle } from "./riddles.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const RIDDLES_CATEGORY = "riddles";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) للألغاز بعد التحقق
 * من صحتها وفرادة الـ id، حتى لا نعيد قراءة الملف من القرص وإعادة
 * التحقق من كل الألغاز في كل طلب HTTP. تُملأ مرة واحدة فقط عند أول
 * طلب، ثم تُعاد من الذاكرة مباشرة في الطلبات التالية (ضمن نفس عملية
 * التشغيل/lambda instance).
 */
let cachedRiddles: Riddle[] | null = null;

/**
 * تُحمّل بيانات الألغاز من questions.json كما هي (بما فيها حقل id
 * المخزَّن مسبقًا داخل كل لغز)، تتحقق من صحة شكل كل لغز، ثم تتحقق أن
 * كل الـ id فريدة (غير مكررة) بين كل الألغاز الصالحة. أي لغز لا يجتاز
 * التحقق يُتجاهَل بأمان (بدل أن يوقف الـ API بالكامل)، وأي لغز id بتاعه
 * مكرر يُتجاهَل أيضًا مع تسجيل تحذير - أول ظهور للـ id يفوز، والباقي
 * يُتجاهل.
 *
 * خطوات العمل:
 *   1. نقرأ المصفوفة الخام كما هي من questions.json.
 *   2. نتحقق من صحة شكل كل لغز (id/question/answers) عبر isValidRiddle.
 *      أي لغز لا يجتاز التحقق يُتجاهَل بصمت.
 *   3. من بين الألغاز الصالحة، نتأكد أن كل id فريد. لو وُجد id مكرر،
 *      نحتفظ فقط بأول لغز بهذا الـ id ونتجاهل الباقي (مع تحذير في الـ
 *      console يساعد وقت مراجعة عملية استيراد ألغاز جديدة).
 *   4. نخزّن النتيجة في cachedRiddles لإعادة استخدامها لاحقًا.
 */
async function loadRiddles(): Promise<Riddle[]> {
  if (cachedRiddles) return cachedRiddles;

  const raw = await readRawCollection(RIDDLES_CATEGORY);

  const valid = raw.filter(isValidRiddle);

  const seenIds = new Set<number>();
  const deduped: Riddle[] = [];
  for (const riddle of valid) {
    if (seenIds.has(riddle.id)) {
      console.warn(
        `[riddles] تم تجاهل لغز بـ id مكرر: ${riddle.id} ("${riddle.question}"). ` +
          "تأكدي أن كل id في questions.json فريد بعد أي عملية استيراد."
      );
      continue;
    }
    seenIds.add(riddle.id);
    deduped.push(riddle);
  }

  cachedRiddles = deduped;
  return deduped;
}

/**
 * تُرجع لغزًا عشوائيًا واحدًا.
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية، لأنها أكثر قوة
 * وأقل قابلية للتنبؤ - نفس أسلوب quiz.service.ts وtrue-false.service.ts
 * بالضبط.
 */
export async function getRandomRiddle(): Promise<Riddle> {
  const riddles = await loadRiddles();
  if (riddles.length === 0) {
    throw new JsonDbError(`Collection "${RIDDLES_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(riddles.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأنه ناتج عن
  // pickRandomIndex(riddles.length) وقد تحققنا أعلاه أن length > 0.
  return riddles[index] as Riddle;
}

/**
 * تُرجع لغزًا عشوائيًا واحدًا مع استثناء مجموعة من الـ id المُمرَّرة.
 * يستخدمها بوت الواتساب لمنع تكرار نفس اللغز داخل نفس المجموعة (الـ
 * API نفسه لا يحتفظ بأي حالة/state دائمة عن الألغاز المستخدمة - البوت
 * هو من يتتبّع ذلك ويرسل قائمة الاستثناء مع كل طلب).
 *
 * إذا كانت كل الألغاز مستثناة (لم يتبقَّ أي لغز جديد)، تُرمى JsonDbError
 * بكود NOT_FOUND ورسالة واضحة، بدل إرجاع لغز مكرر بصمت.
 */
export async function getRandomRiddleExcluding(excludeIds: number[]): Promise<Riddle> {
  const riddles = await loadRiddles();
  const excludeSet = new Set(excludeIds);
  const remaining = riddles.filter((r) => !excludeSet.has(r.id));

  if (remaining.length === 0) {
    throw new JsonDbError(
      "لا يوجد أي لغز متبقٍ بعد استثناء كل الألغاز المُمرَّرة (كل الألغاز استُخدمت بالفعل)",
      "NOT_FOUND"
    );
  }

  const index = pickRandomIndex(remaining.length);
  // آمن دائمًا لنفس السبب أعلاه: تحققنا أن remaining.length > 0 قبل هذا السطر.
  return remaining[index] as Riddle;
}

/**
 * تبحث عن لغز واحد بواسطة id الرقمي الخاص به.
 * ترجع null إذا لم يوجد لغز بهذا الـ id (وهي حالة طبيعية متوقعة، وليست
 * خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getRiddleById(id: number): Promise<Riddle | null> {
  const riddles = await loadRiddles();
  return riddles.find((r) => r.id === id) ?? null;
}

/** تُرجع كل الألغاز الصالحة الموجودة في questions.json كمصفوفة كاملة. */
export async function getAllRiddles(): Promise<Riddle[]> {
  return loadRiddles();
}

/**
 * تُرجع العدد الإجمالي للألغاز المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الألغاز: 300" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة الألغاز بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getRiddleCount(): Promise<number> {
  const riddles = await getAllRiddles();
  return riddles.length;
}

/**
 * تختار فهرسًا (index) عشوائيًا في المدى [0, length) باستخدام
 * crypto.getRandomValues بدل Math.random العادية. مطابقة تمامًا لدالة
 * pickRandomIndex في quiz.service.ts وtrue-false.service.ts.
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
