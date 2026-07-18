/**
 * ملف: quiz.validation.ts
 * الغرض: دوال تحقّق (Validation) خاصة بوحدة الكويز فقط.
 *
 * حاليًا يوجد تحقق واحد فعلي نحتاجه هنا: التأكد أن كائن قادم من ملف
 * JSON فعلًا يطابق شكل QuizQuestion الصحيح قبل أن نثق به. هذا يحمينا
 * من بيانات ناقصة أو تالفة في questions.json (مثل سؤال بدون answers،
 * أو answers ليست مصفوفة، أو نص فارغ).
 *
 * أي سجل لا يجتاز هذا التحقق يُتجاهَل بأمان أثناء التحميل (انظر
 * quiz.service.ts) بدل أن يوقف الـ API بالكامل بسبب سجل واحد فاسد.
 *
 * ملاحظة: التحقق من صحة "الطلب" نفسه (مثل تحويل id من نص لرقم) موجود
 * في src/lib/validation.ts لأنه تحقق عام يُستخدم في أي مسار مستقبلي،
 * وليس خاصًا بالكويز وحده.
 */

import type { QuizQuestion } from "./quiz.types";

/** نتيجة التحقق: إما صالح، أو غير صالح مع رسالة توضّح سبب الرفض بدقة. */
export interface QuizValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * تتحقق أن قيمة واحدة قادمة من JSON هي فعلًا سؤال كويز صالح الشكل،
 * وتُرجع قائمة أخطاء واضحة (بدل true/false فقط) تشرح بالضبط أي حقل
 * فشل ولماذا - مفيد جدًا عند تشخيص مشاكل في ملف questions.json.
 *
 * خطوات العمل:
 *   1. نتأكد أن القيمة كائن (object) وليست null أو نوعًا آخر.
 *   2. نتأكد أن question نص غير فارغ (بعد trim).
 *   3. نتأكد أن answers مصفوفة غير فارغة، وكل عنصر فيها نص غير فارغ.
 *   4. نتأكد أن category نص غير فارغ.
 *
 * ملاحظة: id لا يُتحقَّق منه هنا لأنه يُولَّد تلقائيًا أثناء التحميل
 * (انظر assignAutoIds في quiz.service.ts) وليس جزءًا من بيانات
 * المصدر الخام القادمة من مزوّد البيانات.
 */
export function validateQuizQuestion(value: unknown): QuizValidationResult {
  const errors: string[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, errors: ["السجل ليس كائنًا (object) صالحًا"] };
  }

  const item = value as Record<string, unknown>;

  if (typeof item.question !== "string" || item.question.trim() === "") {
    errors.push("حقل question مفقود أو فارغ أو ليس نصًا");
  }

  if (!Array.isArray(item.answers) || item.answers.length === 0) {
    errors.push("حقل answers مفقود أو فارغ أو ليس مصفوفة");
  } else if (!item.answers.every((a) => typeof a === "string" && a.trim() !== "")) {
    errors.push("حقل answers يحتوي عنصرًا غير نصي أو فارغًا");
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
export function isValidQuizQuestion(value: unknown): value is QuizQuestion {
  return validateQuizQuestion(value).valid;
}
