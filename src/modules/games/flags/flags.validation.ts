/**
 * ملف: flags.validation.ts
 * الغرض: دوال تحقّق (Validation) خاصة بوحدة لعبة "أعلام" فقط.
 *
 * نفس فكرة eye.validation.ts وriddles.validation.ts بالضبط: نتأكد أن
 * كائن قادم من ملف JSON فعلًا يطابق شكل FlagItem الصحيح قبل أن نثق به،
 * ونتجاهل أي سجل لا يجتاز التحقق بأمان أثناء التحميل بدل أن يوقف الـ
 * API بالكامل.
 *
 * ملاحظة: id هنا **مطلوب ويُتحقَّق منه هنا** لأنه مخزَّن مسبقًا داخل كل
 * عنصر في questions.json نفسه (نفس أسلوب eye.validation.ts)، وليس
 * مولَّدًا تلقائيًا وقت التحميل. التحقق من الفرادة (uniqueness) بين كل
 * العناصر يحدث لاحقًا في flags.service.ts (loadFlagItems)، وليس هنا -
 * هذا الملف يتحقق فقط من شكل العنصر الواحد بمعزل عن الباقي.
 */

import type { FlagItem } from "./flags.types";

/** نتيجة التحقق: إما صالح، أو غير صالح مع رسالة توضّح سبب الرفض بدقة. */
export interface FlagValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * تتحقق أن قيمة واحدة قادمة من JSON هي فعلًا عنصر "أعلام" صالح الشكل،
 * وتُرجع قائمة أخطاء واضحة (بدل true/false فقط) تشرح بالضبط أي حقل فشل
 * ولماذا.
 *
 * خطوات العمل:
 *   1. نتأكد أن القيمة كائن (object) وليست null أو نوعًا آخر.
 *   2. نتأكد أن id رقم صحيح (integer) موجب (> 0). لا نتحقق من الفرادة
 *      هنا - فقط أن القيمة نفسها رقم صحيح موجب صالح الشكل.
 *   3. نتأكد أن flag نص غير فارغ (بعد trim).
 *   4. نتأكد أن emoji نص غير فارغ (بعد trim).
 *   5. نتأكد أن answers مصفوفة غير فارغة، وكل عنصر فيها نص غير فارغ.
 */
export function validateFlagItem(value: unknown): FlagValidationResult {
  const errors: string[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, errors: ["السجل ليس كائنًا (object) صالحًا"] };
  }

  const item = value as Record<string, unknown>;

  if (typeof item.id !== "number" || !Number.isInteger(item.id) || item.id <= 0) {
    errors.push("حقل id مفقود أو ليس رقمًا صحيحًا موجبًا");
  }

  if (typeof item.flag !== "string" || item.flag.trim() === "") {
    errors.push("حقل flag مفقود أو فارغ أو ليس نصًا");
  }

  if (typeof item.emoji !== "string" || item.emoji.trim() === "") {
    errors.push("حقل emoji مفقود أو فارغ أو ليس نصًا");
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
export function isValidFlagItem(value: unknown): value is FlagItem {
  return validateFlagItem(value).valid;
}
