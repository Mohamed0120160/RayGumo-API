/**
 * ملف: emoji.validation.ts
 * الغرض: دوال تحقّق (Validation) خاصة بوحدة لعبة "إيموجي" فقط.
 *
 * نفس فكرة riddles.validation.ts وeye.validation.ts بالضبط: نتأكد أن
 * كائن قادم من ملف JSON فعلًا يطابق شكل EmojiQuestion الصحيح قبل أن
 * نثق به، ونتجاهل أي سجل لا يجتاز التحقق بأمان أثناء التحميل بدل أن
 * يوقف الـ API بالكامل.
 *
 * ملاحظة: id هنا **مطلوب ويُتحقَّق منه هنا** لأنه مخزَّن مسبقًا داخل كل
 * سؤال في questions.json نفسه (نفس أسلوب riddles.validation.ts)، وليس
 * مولَّدًا تلقائيًا وقت التحميل. التحقق من الفرادة (uniqueness) بين كل
 * الأسئلة يحدث لاحقًا في emoji.service.ts (loadEmojiQuestions)، وليس
 * هنا - هذا الملف يتحقق فقط من شكل السؤال الواحد بمعزل عن الباقي.
 */

import type { EmojiQuestion } from "./emoji.types";

/** نتيجة التحقق: إما صالح، أو غير صالح مع رسالة توضّح سبب الرفض بدقة. */
export interface EmojiValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * تتحقق أن قيمة واحدة قادمة من JSON هي فعلًا سؤال "إيموجي" صالح
 * الشكل، وتُرجع قائمة أخطاء واضحة (بدل true/false فقط) تشرح بالضبط أي
 * حقل فشل ولماذا.
 *
 * خطوات العمل:
 *   1. نتأكد أن القيمة كائن (object) وليست null أو نوعًا آخر.
 *   2. نتأكد أن id رقم صحيح (integer) موجب (> 0). لا نتحقق من الفرادة
 *      هنا - فقط أن القيمة نفسها رقم صحيح موجب صالح الشكل.
 *   3. نتأكد أن emoji نص غير فارغ (بعد trim).
 *   4. نتأكد أن category نص غير فارغ (بعد trim).
 *   5. نتأكد أن answers مصفوفة غير فارغة، وكل عنصر فيها نص غير فارغ.
 */
export function validateEmojiQuestion(value: unknown): EmojiValidationResult {
  const errors: string[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, errors: ["السجل ليس كائنًا (object) صالحًا"] };
  }

  const item = value as Record<string, unknown>;

  if (typeof item.id !== "number" || !Number.isInteger(item.id) || item.id <= 0) {
    errors.push("حقل id مفقود أو ليس رقمًا صحيحًا موجبًا");
  }

  if (typeof item.emoji !== "string" || item.emoji.trim() === "") {
    errors.push("حقل emoji مفقود أو فارغ أو ليس نصًا");
  }

  if (typeof item.category !== "string" || item.category.trim() === "") {
    errors.push("حقل category مفقود أو فارغ أو ليس نصًا");
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
export function isValidEmojiQuestion(value: unknown): value is EmojiQuestion {
  return validateEmojiQuestion(value).valid;
}
