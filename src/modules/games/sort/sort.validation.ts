/**
 * ملف: sort.validation.ts
 * الغرض: دوال تحقّق (Validation) خاصة بوحدة لعبة "رتب" فقط.
 *
 * نتحقق أن كائن قادم من ملف JSON فعلًا يطابق شكل SortQuestion الصحيح
 * قبل أن نثق به - بنفس أسلوب quiz.validation.ts وeye.validation.ts.
 * هذا يحمينا من بيانات ناقصة أو تالفة في questions.json (مثل سؤال بدون
 * questions، أو answers ليست مصفوفة، أو id مكرر/غير صالح).
 *
 * أي سجل لا يجتاز هذا التحقق يُتجاهَل بأمان أثناء التحميل (انظر
 * sort.service.ts) بدل أن يوقف الـ API بالكامل بسبب سجل واحد فاسد.
 */

import type { SortQuestion } from "./sort.types";

/** نتيجة التحقق: إما صالح، أو غير صالح مع رسالة توضّح سبب الرفض بدقة. */
export interface SortValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * تتحقق أن قيمة واحدة قادمة من JSON هي فعلًا عنصر "رتب" صالح الشكل،
 * وتُرجع قائمة أخطاء واضحة (بدل true/false فقط) تشرح بالضبط أي حقل
 * فشل ولماذا - مفيد جدًا عند تشخيص مشاكل في ملف questions.json.
 *
 * خطوات العمل:
 *   1. نتأكد أن القيمة كائن (object) وليست null أو نوعًا آخر.
 *   2. نتأكد أن id رقم صحيح موجب.
 *   3. نتأكد أن questions مصفوفة غير فارغة، وكل عنصر فيها نص غير فارغ.
 *   4. نتأكد أن answers مصفوفة غير فارغة، وكل عنصر فيها نص غير فارغ.
 */
export function validateSortQuestion(value: unknown): SortValidationResult {
  const errors: string[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, errors: ["السجل ليس كائنًا (object) صالحًا"] };
  }

  const item = value as Record<string, unknown>;

  if (typeof item.id !== "number" || !Number.isInteger(item.id) || item.id <= 0) {
    errors.push("حقل id مفقود أو ليس رقمًا صحيحًا موجبًا");
  }

  if (!Array.isArray(item.questions) || item.questions.length === 0) {
    errors.push("حقل questions مفقود أو فارغ أو ليس مصفوفة");
  } else if (!item.questions.every((q) => typeof q === "string" && q.trim() !== "")) {
    errors.push("حقل questions يحتوي عنصرًا غير نصي أو فارغًا");
  }

  if (!Array.isArray(item.answers) || item.answers.length === 0) {
    errors.push("حقل answers مفقود أو فارغ أو ليس مصفوفة");
  } else if (!item.answers.every((a) => typeof a === "string" && a.trim() !== "")) {
    errors.push("حقل answers يحتوي عنصرًا غير نصي أو فارغًا");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * نسخة مبسّطة (type guard) تُستخدم عندما نحتاج فقط true/false بدون
 * تفاصيل الأخطاء - مثل الفلترة السريعة بعد التحميل والتحقق الكامل.
 */
export function isValidSortQuestion(value: unknown): value is SortQuestion {
  return validateSortQuestion(value).valid;
}
