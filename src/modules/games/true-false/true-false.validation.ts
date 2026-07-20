/**
 * ملف: true-false.validation.ts
 * الغرض: دوال تحقّق (Validation) خاصة بوحدة "صح أو خطأ" فقط.
 *
 * نفس فكرة quiz.validation.ts بالضبط: نتأكد أن كائن قادم من ملف JSON
 * فعلًا يطابق شكل TrueFalseQuestion الصحيح قبل أن نثق به، ونتجاهل أي
 * سجل لا يجتاز التحقق بأمان أثناء التحميل بدل أن يوقف الـ API بالكامل.
 *
 * ملاحظة: على عكس الكويز، id هنا **مطلوب ويُتحقَّق منه هنا** لأنه
 * مخزَّن يدويًا/مسبقًا داخل كل سؤال في questions.json نفسه، وليس
 * مولَّدًا تلقائيًا وقت التحميل. التحقق من الفرادة (uniqueness) بين كل
 * الأسئلة يحدث لاحقًا في true-false.service.ts (loadQuestions)، وليس
 * هنا - هذا الملف يتحقق فقط من شكل السؤال الواحد بمعزل عن الباقي.
 */

import type { TrueFalseQuestion } from "./true-false.types";

/** نتيجة التحقق: إما صالح، أو غير صالح مع رسالة توضّح سبب الرفض بدقة. */
export interface TrueFalseValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * تتحقق أن قيمة واحدة قادمة من JSON هي فعلًا سؤال "صح أو خطأ" صالح
 * الشكل، وتُرجع قائمة أخطاء واضحة تشرح بالضبط أي حقل فشل ولماذا.
 *
 * خطوات العمل:
 *   1. نتأكد أن القيمة كائن (object) وليست null أو نوعًا آخر.
 *   2. نتأكد أن id رقم صحيح (integer) موجب (> 0). لا نتحقق من الفرادة
 *      هنا - فقط أن القيمة نفسها رقم صحيح موجب صالح الشكل.
 *   3. نتأكد أن question نص غير فارغ (بعد trim).
 *   4. نتأكد أن answer قيمة منطقية (boolean) فعلية — true أو false فقط،
 *      وليس نصًا مثل "true" أو رقمًا مثل 1.
 *   5. نتأكد أن category نص غير فارغ.
 */
export function validateTrueFalseQuestion(value: unknown): TrueFalseValidationResult {
  const errors: string[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, errors: ["السجل ليس كائنًا (object) صالحًا"] };
  }

  const item = value as Record<string, unknown>;

  if (typeof item.id !== "number" || !Number.isInteger(item.id) || item.id <= 0) {
    errors.push("حقل id مفقود أو ليس رقمًا صحيحًا موجبًا");
  }

  if (typeof item.question !== "string" || item.question.trim() === "") {
    errors.push("حقل question مفقود أو فارغ أو ليس نصًا");
  }

  if (typeof item.answer !== "boolean") {
    errors.push("حقل answer مفقود أو ليس قيمة منطقية (boolean)");
  }

  if (typeof item.category !== "string" || item.category.trim() === "") {
    errors.push("حقل category مفقود أو فارغ أو ليس نصًا");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * نسخة مبسّطة (type guard) تُستخدم عندما نحتاج فقط true/false بدون
 * تفاصيل الأخطاء - مثل الفلترة السريعة بعد التحميل والتحقق الكامل.
 */
export function isValidTrueFalseQuestion(value: unknown): value is TrueFalseQuestion {
  return validateTrueFalseQuestion(value).valid;
}
