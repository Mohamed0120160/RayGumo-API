import { promises as fs } from "fs";
import path from "path";

/**
 * طبقة تخزين JSON قابلة لإعادة الاستخدام (Reusable JSON Storage Layer).
 *
 * هذا الملف هو "قلب" نظام تخزين البيانات في المشروع بأكمله. بدل قاعدة
 * بيانات حقيقية، نخزّن كل محتوى (أسئلة كويز حاليًا، وأي لعبة مستقبلية)
 * في ملف JSON واحد داخل src/data/<فئة>/. هذا يسمح للـ API بالعمل على
 * Vercel بدون أي بنية تحتية خارجية (لا حاجة لخادم قاعدة بيانات منفصل).
 *
 * كل عنصر مخزَّن يجب أن يحتوي على الأقل حقل id رقمي فريد (WithId
 * بالأسفل) حتى تعمل دوال البحث بالـ id والاختيار العشوائي.
 *
 * تنبيه مهم جدًا (قيد Vercel): نظام الملفات في دوال Vercel الخادمية
 * للقراءة فقط (read-only) أثناء التشغيل الفعلي، ما عدا مجلد /tmp.
 * هذا يعني أن هذه الطبقة آمنة تمامًا للقراءة (READS) في بيئة الإنتاج.
 * تحديث المحتوى في الإنتاج يتم عبر تعديل ملف JSON ثم عمل git push
 * جديد، وليس عبر كتابة وقت التشغيل (انظر README لتفاصيل أكثر).
 */

/** الحد الأدنى المطلوب من أي عنصر مخزَّن: حقل id رقمي فريد. */
interface WithId {
  id: number;
}

/**
 * خطأ مخصص لكل مشاكل طبقة تخزين JSON، مع كود (code) يوضّح نوع المشكلة
 * بالضبط: هل الملف غير موجود؟ هل محتواه JSON غير صالح؟ إلخ.
 * هذا يسمح لـ route handlers بالتعامل مع كل حالة برد HTTP مناسب.
 */
export class JsonDbError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "INVALID_JSON" | "READ_ERROR"
  ) {
    super(message);
    this.name = "JsonDbError";
  }
}

/** المسار الجذري لمجلد كل بيانات المشروع: src/data */
const DATA_ROOT = path.join(process.cwd(), "src", "data");

/**
 * تحوّل اسم الفئة (category، مثل "quiz") واسم ملف البيانات (fileName،
 * مثل "questions.json") إلى المسار الكامل الآمن على القرص، مع حماية
 * من هجوم "اجتياز المسار" (Path Traversal) - مثال: لو حاول أحدهم
 * تمرير category = "../../etc/passwd" لقراءة ملفات خارج مجلد البيانات
 * المسموح.
 *
 * خطوات العمل:
 *   1. نستخدم path.basename() لأخذ "اسم الملف/المجلد الأخير فقط" من
 *      القيمة الممرَّرة، متجاهلين أي "../" أو مسارات فرعية.
 *   2. نقارن النتيجة بالقيمة الأصلية: لو اختلفتا، فهذا يعني أن القيمة
 *      الأصلية كانت تحتوي مسارًا مشبوهًا، فنرمي خطأ فورًا.
 *   3. إذا كانت القيمة سليمة، نبني المسار الكامل:
 *      DATA_ROOT/category/fileName
 */
function resolveCollectionPath(category: string, fileName: string): string {
  const safeCategory = path.basename(category);
  if (safeCategory !== category || category.trim() === "") {
    throw new JsonDbError(`Invalid category name: "${category}"`, "READ_ERROR");
  }
  return path.join(DATA_ROOT, safeCategory, fileName);
}

/**
 * تقرأ ملف JSON الخاص بفئة معينة وتحوّله إلى مصفوفة عناصر (array)
 * بأمان تام، مع رمي JsonDbError بكود واضح عند أي فشل.
 *
 * خطوات العمل:
 *   1. نحدد المسار الآمن للملف عبر resolveCollectionPath.
 *   2. نحاول قراءة محتوى الملف كنص. إذا كان الملف غير موجود (ENOENT)،
 *      نرمي خطأ NOT_FOUND؛ أي خطأ آخر في القراءة نرميه كـ READ_ERROR.
 *   3. نحاول تحويل النص المقروء إلى JSON عبر JSON.parse. إذا فشل
 *      التحويل (نص غير صالح كـ JSON)، نرمي INVALID_JSON.
 *   4. نتأكد أن الناتج فعلًا مصفوفة (Array) وليس كائن مفرد أو أي شيء
 *      آخر - وإلا نرمي INVALID_JSON أيضًا.
 *   5. أخيرًا نرجع المصفوفة بنوعها العام T.
 */
export async function readCollection<T extends WithId>(
  category: string,
  fileName = "questions.json"
): Promise<T[]> {
  return readRawCollection(category, fileName) as Promise<T[]>;
}

/**
 * تقرأ ملف JSON الخاص بفئة معينة وتحوّله إلى مصفوفة "خام" (raw) بدون
 * أي افتراض مسبق عن شكل عناصرها - وتحديدًا بدون افتراض وجود حقل id
 * جاهز في كل عنصر (على عكس readCollection<T extends WithId>).
 *
 * لماذا نحتاجها: بعض مصادر البيانات الحقيقية (مثل quiz - انظر
 * modules/games/quiz/quiz.service.ts) لا تحتوي id إطلاقًا، ويُولَّد
 * الـ id لاحقًا في طبقة الخدمة الخاصة باللعبة بعد القراءة. هذه الدالة
 * تقتصر على القراءة والتحقق من صحة تركيب JSON العام فقط (ملف موجود؟
 * JSON صالح؟ مصفوفة؟)، دون معرفة أي شيء عن حقول العناصر الداخلية.
 */
export async function readRawCollection(
  category: string,
  fileName = "questions.json"
): Promise<unknown[]> {
  const filePath = resolveCollectionPath(category, fileName);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      throw new JsonDbError(`Collection "${category}" does not exist`, "NOT_FOUND");
    }
    throw new JsonDbError(`Failed to read collection "${category}"`, "READ_ERROR");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new JsonDbError(`Collection "${category}" contains invalid JSON`, "INVALID_JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new JsonDbError(`Collection "${category}" must be a JSON array`, "INVALID_JSON");
  }

  return parsed;
}

/**
 * تُرجع عنصرًا عشوائيًا واحدًا من فئة معينة.
 * خطوات العمل: نقرأ كل عناصر الفئة، نتأكد أنها ليست فارغة، ثم نختار
 * فهرسًا (index) عشوائيًا ونرجع العنصر الموجود عنده.
 */
export async function getRandomItem<T extends WithId>(
  category: string,
  fileName = "questions.json"
): Promise<T> {
  const items = await readCollection<T>(category, fileName);
  if (items.length === 0) {
    throw new JsonDbError(`Collection "${category}" is empty`, "NOT_FOUND");
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index] as T;
}

/**
 * تبحث عن عنصر واحد بواسطة id الرقمي الخاص به داخل فئة معينة.
 * ترجع null إذا لم يوجد عنصر بهذا الـ id (وليس خطأ - لأن "غير موجود"
 * هنا حالة طبيعية متوقعة يقررها المستدعي كيف يتعامل معها).
 */
export async function getItemById<T extends WithId>(
  category: string,
  id: number,
  fileName = "questions.json"
): Promise<T | null> {
  const items = await readCollection<T>(category, fileName);
  return items.find((item) => item.id === id) ?? null;
}

/** تُرجع كل عناصر فئة معينة (المصفوفة كاملة بدون فلترة). */
export async function getAllItems<T extends WithId>(
  category: string,
  fileName = "questions.json"
): Promise<T[]> {
  return readCollection<T>(category, fileName);
}
