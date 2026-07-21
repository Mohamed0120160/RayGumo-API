/**
 * ملف: eye.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة لعبة "عين" - هي المكان
 * الوحيد الذي يحتوي منطق العمل الفعلي (تحميل البيانات، التحقق من صحة
 * كل عنصر وفرادة الـ id، اختيار عشوائي، اختيار عشوائي مع استثناء، بحث
 * بالـ id، إرجاع الكل، حساب العدد).
 *
 * هذا الملف مطابق لبنية riddles.service.ts في التدفّق العام (id مخزَّن
 * مسبقًا في الملف، وليس مولَّدًا بالترتيب كما في quiz.service.ts).
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   registry.ts (المُبدّل العام بين الألعاب)
 *       ↓ يستدعي
 *   eye.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة قراءة JSON خام عامة، بدون أي معرفة بشكل العنصر)
 *       ↓ تقرأ
 *   src/data/eye/questions.json (البيانات الحقيقية على القرص)
 *
 * ملاحظة عن الـ id: id مخزَّن مسبقًا داخل كل عنصر في questions.json
 * نفسه (مرقّم تسلسليًا 1، 2، 3... وقت إنشاء الملف)، وليس مولَّدًا وقت
 * التحميل. لذلك هذا الملف **يتحقق فقط** أن كل عنصر في questions.json
 * يمتلك id رقميًا صحيحًا موجبًا وفريدًا (غير مكرر)، ولا يولّد أي id
 * بنفسه - بنفس أسلوب riddles.service.ts بالضبط.
 */

import { readRawCollection, JsonDbError } from "@/lib/json-db";
import { isValidEyeItem } from "./eye.validation";
import type { EyeItem } from "./eye.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const EYE_CATEGORY = "eye";

/**
 * ذاكرة تخزين مؤقت داخل الذاكرة (in-memory cache) لعناصر "عين" بعد
 * التحقق من صحتها وفرادة الـ id، حتى لا نعيد قراءة الملف من القرص
 * وإعادة التحقق من كل العناصر في كل طلب HTTP. تُملأ مرة واحدة فقط عند
 * أول طلب، ثم تُعاد من الذاكرة مباشرة في الطلبات التالية (ضمن نفس
 * عملية التشغيل/lambda instance).
 */
let cachedEyeItems: EyeItem[] | null = null;

/**
 * تُحمّل بيانات "عين" من questions.json كما هي (بما فيها حقل id
 * المخزَّن مسبقًا داخل كل عنصر)، تتحقق من صحة شكل كل عنصر، ثم تتحقق أن
 * كل الـ id فريدة (غير مكررة) بين كل العناصر الصالحة. أي عنصر لا يجتاز
 * التحقق يُتجاهَل بأمان (بدل أن يوقف الـ API بالكامل)، وأي عنصر id بتاعه
 * مكرر يُتجاهَل أيضًا مع تسجيل تحذير - أول ظهور للـ id يفوز، والباقي
 * يُتجاهل.
 *
 * خطوات العمل:
 *   1. نقرأ المصفوفة الخام كما هي من questions.json.
 *   2. نتحقق من صحة شكل كل عنصر (id/img/name) عبر isValidEyeItem. أي
 *      عنصر لا يجتاز التحقق يُتجاهَل بصمت.
 *   3. من بين العناصر الصالحة، نتأكد أن كل id فريد. لو وُجد id مكرر،
 *      نحتفظ فقط بأول عنصر بهذا الـ id ونتجاهل الباقي (مع تحذير في الـ
 *      console يساعد وقت مراجعة عملية استيراد عناصر جديدة).
 *   4. نخزّن النتيجة في cachedEyeItems لإعادة استخدامها لاحقًا.
 */
async function loadEyeItems(): Promise<EyeItem[]> {
  if (cachedEyeItems) return cachedEyeItems;

  const raw = await readRawCollection(EYE_CATEGORY);

  const valid = raw.filter(isValidEyeItem);

  const seenIds = new Set<number>();
  const deduped: EyeItem[] = [];
  for (const item of valid) {
    if (seenIds.has(item.id)) {
      console.warn(
        `[eye] تم تجاهل عنصر بـ id مكرر: ${item.id} ("${item.name}"). ` +
          "تأكدي أن كل id في questions.json فريد بعد أي عملية استيراد."
      );
      continue;
    }
    seenIds.add(item.id);
    deduped.push(item);
  }

  cachedEyeItems = deduped;
  return deduped;
}

/**
 * تُرجع عنصر "عين" عشوائيًا واحدًا.
 *
 * الاختيار العشوائي يعتمد على crypto.getRandomValues (عبر
 * pickRandomIndex بالأسفل) بدل Math.random العادية، لأنها أكثر قوة
 * وأقل قابلية للتنبؤ - نفس أسلوب quiz.service.ts وriddles.service.ts
 * بالضبط.
 */
export async function getRandomEyeItem(): Promise<EyeItem> {
  const items = await loadEyeItems();
  if (items.length === 0) {
    throw new JsonDbError(`Collection "${EYE_CATEGORY}" is empty`, "NOT_FOUND");
  }
  const index = pickRandomIndex(items.length);
  // آمن دائمًا: index مضمون أن يكون ضمن حدود المصفوفة لأنه ناتج عن
  // pickRandomIndex(items.length) وقد تحققنا أعلاه أن length > 0.
  return items[index] as EyeItem;
}

/**
 * تُرجع عنصر "عين" عشوائيًا واحدًا مع استثناء مجموعة من الـ id
 * المُمرَّرة. يستخدمها بوت الواتساب لمنع تكرار نفس الصورة داخل نفس
 * المجموعة (الـ API نفسه لا يحتفظ بأي حالة/state دائمة عن العناصر
 * المستخدمة - البوت هو من يتتبّع ذلك ويرسل قائمة الاستثناء مع كل طلب).
 *
 * إذا كانت كل العناصر مستثناة (لم يتبقَّ أي عنصر جديد)، تُرمى
 * JsonDbError بكود NOT_FOUND ورسالة واضحة، بدل إرجاع عنصر مكرر بصمت.
 */
export async function getRandomEyeItemExcluding(excludeIds: number[]): Promise<EyeItem> {
  const items = await loadEyeItems();
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
  return remaining[index] as EyeItem;
}

/**
 * تبحث عن عنصر "عين" واحد بواسطة id الرقمي الخاص به.
 * ترجع null إذا لم يوجد عنصر بهذا الـ id (وهي حالة طبيعية متوقعة، وليست
 * خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getEyeItemById(id: number): Promise<EyeItem | null> {
  const items = await loadEyeItems();
  return items.find((i) => i.id === id) ?? null;
}

/** تُرجع كل عناصر "عين" الصالحة الموجودة في questions.json كمصفوفة كاملة. */
export async function getAllEyeItems(): Promise<EyeItem[]> {
  return loadEyeItems();
}

/**
 * تُرجع العدد الإجمالي لعناصر "عين" المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الصور: 130" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة البيانات بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getEyeItemCount(): Promise<number> {
  const items = await getAllEyeItems();
  return items.length;
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
