/**
 * ملف: eye.validation.ts
 * الغرض: دوال تحقّق (Validation) خاصة بوحدة لعبة "عين" فقط.
 *
 * نفس فكرة riddles.validation.ts وtrue-false.validation.ts بالضبط:
 * نتأكد أن كائن قادم من ملف JSON فعلًا يطابق شكل EyeItem الصحيح قبل أن
 * نثق به، ونتجاهل أي سجل لا يجتاز التحقق بأمان أثناء التحميل بدل أن
 * يوقف الـ API بالكامل.
 *
 * ملاحظة: id هنا **مطلوب ويُتحقَّق منه هنا** لأنه مخزَّن مسبقًا داخل كل
 * عنصر في questions.json نفسه (نفس أسلوب riddles.validation.ts)، وليس
 * مولَّدًا تلقائيًا وقت التحميل. التحقق من الفرادة (uniqueness) بين كل
 * العناصر يحدث لاحقًا في eye.service.ts (loadEyeItems)، وليس هنا - هذا
 * الملف يتحقق فقط من شكل العنصر الواحد بمعزل عن الباقي.
 */

import type { EyeItem } from "./eye.types";

/** نتيجة التحقق: إما صالح، أو غير صالح مع رسالة توضّح سبب الرفض بدقة. */
export interface EyeValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * تتحقق أن قيمة واحدة قادمة من JSON هي فعلًا عنصر "عين" صالح الشكل،
 * وتُرجع قائمة أخطاء واضحة (بدل true/false فقط) تشرح بالضبط أي حقل فشل
 * ولماذا.
 *
 * خطوات العمل:
 *   1. نتأكد أن القيمة كائن (object) وليست null أو نوعًا آخر.
 *   2. نتأكد أن id رقم صحيح (integer) موجب (> 0). لا نتحقق من الفرادة
 *      هنا - فقط أن القيمة نفسها رقم صحيح موجب صالح الشكل.
 *   3. نتأكد أن img نص غير فارغ (بعد trim).
 *   4. نتأكد أن name نص غير فارغ (بعد trim).
 */
export function validateEyeItem(value: unknown): EyeValidationResult {
  const errors: string[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, errors: ["السجل ليس كائنًا (object) صالحًا"] };
  }

  const item = value as Record<string, unknown>;

  if (typeof item.id !== "number" || !Number.isInteger(item.id) || item.id <= 0) {
    errors.push("حقل id مفقود أو ليس رقمًا صحيحًا موجبًا");
  }

  if (typeof item.img !== "string" || item.img.trim() === "") {
    errors.push("حقل img مفقود أو فارغ أو ليس نصًا");
  }

  if (typeof item.name !== "string" || item.name.trim() === "") {
    errors.push("حقل name مفقود أو فارغ أو ليس نصًا");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * نسخة مبسّطة (type guard) تُستخدم عندما نحتاج فقط true/false بدون
 * تفاصيل الأخطاء - مثل الفلترة السريعة بعد التحميل والتحقق الكامل.
 */
export function isValidEyeItem(value: unknown): value is EyeItem {
  return validateEyeItem(value).valid;
}
