/**
 * ملف: flags.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة لعبة "أعلام" - هي المكان
 * الوحيد الذي يحتوي منطق العمل الفعلي (تحميل البيانات، التحقق من صحة
 * كل عنصر وفرادة الـ id، اختيار عشوائي، اختيار عشوائي مع استثناء، بحث
 * بالـ id، إرجاع الكل، حساب العدد).
 *
 * هذا الملف مطابق لبنية eye.service.ts في التدفّق العام (id مخزَّن
 * مسبقًا في الملف، وليس مولَّدًا بالترتيب كما في quiz.service.ts).
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   registry.ts (المُبدّل العام بين الألعاب)
 *       ↓ يستدعي
 *   flags.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل العنصر)
 *       ↓ تقرأ
 *   src/data/flags/questions.json (البيانات الحقيقية على القرص)
 *
 * ملاحظة عن الـ id: id مخزَّن مسبقًا داخل كل عنصر في questions.json
 * نفسه (مرقّم تسلسليًا 1، 2، 3... وقت إنشاء الملف)، وليس مولَّدًا وقت
 * التحميل. لذلك هذا الملف **يتحقق فقط** أن كل عنصر في questions.json
 * يمتلك id رقميًا صحيحًا موجبًا وفريدًا (غير مكرر)، ولا يولّد أي id
 * بنفسه - بنفس أسلوب eye.service.ts بالضبط.
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidFlagItem } from "./flags.validation";
import type { FlagItem } from "./flags.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const FLAGS_CATEGORY = "flags";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) لعناصر "أعلام" بعد
 * التحقق من صحتها وفرادة الـ id، حتى لا نعيد قراءة الملف من القرص
 * وإعادة التحقق من كل العناصر في كل طلب HTTP. تُملأ مرة واحدة فقط عند
 * أول طلب، ثم تُعاد من الذاكرة مباشرة في الطلبات التالية (ضمن نفس
 * عملية التشغيل/lambda instance).
 */
let cachedFlagItems: FlagItem[] | null = null;

/**
 * تُحمّل بيانات "أعلام" من questions.json كما هي (بما فيها حقل id
 * المخزَّن مسبقًا داخل كل عنصر)، تتحقق من صحة شكل كل عنصر، ثم تتحقق أن
 * كل الـ id فريدة (غير مكررة) بين كل العناصر الصالحة. أي عنصر لا يجتاز
 * التحقق يُتجاهَل بأمان (بدل أن يوقف الـ API بالكامل)، وأي عنصر id بتاعه
 * مكرر يُتجاهَل أيضًا مع تسجيل تحذير - أول ظهور للـ id يفوز، والباقي
 * يُتجاهل.
 *
 * خطوات العمل:
 *   1. نقرأ المصفوفة الخام كما هي من questions.json.
 *   2. نتحقق من صحة شكل كل عنصر (id/flag/emoji/answers) عبر
 *      isValidFlagItem. أي عنصر لا يجتاز التحقق يُتجاهَل بصمت.
 *   3. من بين العناصر الصالحة، نتأكد أن كل id فريد. لو وُجد id مكرر،
 *      نحتفظ فقط بأول عنصر بهذا الـ id ونتجاهل الباقي (مع تحذير في الـ
 *      console يساعد وقت مراجعة عملية استيراد عناصر جديدة).
 *   4. نخزّن النتيجة في cachedFlagItems لإعادة استخدامها لاحقًا.
 */
async function loadFlagItems(): Promise<FlagItem[]> {
  if (cachedFlagItems) return cachedFlagItems;

  const raw = await readRawCollection(FLAGS_CATEGORY);

  const valid = raw.filter(isValidFlagItem);

  const seenIds = new Set<number>();
  const deduped: FlagItem[] = [];
  for (const item of valid) {
    if (seenIds.has(item.id)) {
      console.warn(
        `[flags] تم تجاهل عنصر بـ id مكرر: ${item.id} ("${item.answers[0]}"). ` +
          "تأكدي أن كل id في questions.json فريد بعد أي عملية استيراد."
      );
      continue;
    }
    seenIds.add(item.id);
    deduped.push(item);
  }

  cachedFlagItems = deduped;
  return deduped;
}

/**
 * تُرجع عنصر "أعلام" عشوائيًا واحدًا.
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية، لأنها أكثر قوة
 * وأقل قابلية للتنبؤ - نفس أسلوب quiz.service.ts وeye.service.ts
 * بالضبط.
 */
export async function getRandomFlagItem(): Promise<FlagItem> {
  const items = await loadFlagItems();
  if (items.length === 0) {
    throw new JsonDbError(`Collection "${FLAGS_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(items.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأنه ناتج عن
  // pickRandomIndex(items.length) وقد تحققنا أعلاه أن length > 0.
  return items[index] as FlagItem;
}

/**
 * تُرجع عنصر "أعلام" عشوائيًا واحدًا مع استثناء مجموعة من الـ id
 * المُمرَّرة. يستخدمها بوت الواتساب لمنع تكرار نفس العلم داخل نفس
 * المجموعة (الـ API نفسه لا يحتفظ بأي حالة/state دائمة عن العناصر
 * المستخدمة - البوت هو من يتتبّع ذلك ويرسل قائمة الاستثناء مع كل طلب).
 *
 * إذا كانت كل العناصر مستثناة (لم يتبقَّ أي عنصر جديد)، تُرمى
 * JsonDbError بكود NOT_FOUND ورسالة واضحة، بدل إرجاع عنصر مكرر بصمت.
 */
export async function getRandomFlagItemExcluding(excludeIds: number[]): Promise<FlagItem> {
  const items = await loadFlagItems();
  const excludeSet = new Set(excludeIds);
  const remaining = items.filter((i) => !excludeSet.has(i.id));

  if (remaining.length === 0) {
    throw new JsonDbError(
      "لا يوجد أي عنصر متبقٍ بعد استثناء كل العناصر المُمرَّرة (كل العناصر استُخدمت بالفعل)",
      "NOT_FOUND"
    );
  }

  const index = pickRandomIndex(remaining.length);
  // آمن دائمًا لنفس السبب أعلاه: تحققنا أن remaining.length > 0 قبل هذا السطر.
  return remaining[index] as FlagItem;
}

/**
 * تبحث عن عنصر "أعلام" واحد بواسطة id الرقمي الخاص به.
 * ترجع null إذا لم يوجد عنصر بهذا الـ id (وهي حالة طبيعية متوقعة، وليست
 * خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getFlagItemById(id: number): Promise<FlagItem | null> {
  const items = await loadFlagItems();
  return items.find((i) => i.id === id) ?? null;
}

/** تُرجع كل عناصر "أعلام" الصالحة الموجودة في questions.json كمصفوفة كاملة. */
export async function getAllFlagItems(): Promise<FlagItem[]> {
  return loadFlagItems();
}

/**
 * تُرجع العدد الإجمالي لعناصر "أعلام" المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الأعلام: 195" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة البيانات بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getFlagItemCount(): Promise<number> {
  const items = await getAllFlagItems();
  return items.length;
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
