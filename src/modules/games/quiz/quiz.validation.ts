/**
 * ملف: quiz.validation.ts
 * الغرض: دوال تحقّق (Validation) خاصة بوحدة الكويز فقط.
 *
 * حاليًا يوجد تحقق واحد فعلي نحتاجه هنا: التأكد أن كائن قادم من ملف
 * JSON فعلًا يطابق شكل QuizQuestion الصحيح قبل أن نثق به. هذا يحمينا
 * من بيانات ناقصة أو تالفة في questions.json (مثل سؤال بدون answer).
 *
 * ملاحظة: التحقق من صحة "الطلب" نفسه (مثل تحويل id من نص لرقم) موجود
 * في src/lib/validation.ts لأنه تحقق عام يُستخدم في أي مسار مستقبلي،
 * وليس خاصًا بالكويز وحده.
 */

import type { QuizQuestion } from "./quiz.types";

/**
 * تتحقق أن قيمة واحدة قادمة من JSON هي فعلًا سؤال كويز صالح الشكل.
 *
 * خطوات العمل:
 *   1. نتأكد أن القيمة كائن (object) وليست null أو نوعًا آخر.
 *   2. نتأكد أن id رقم.
 *   3. نتأكد أن question و answer و category نصوص.
 *   4. نتأكد أن difficulty واحدة من القيم الثلاث المسموحة فقط.
 *
 * ترجع true فقط إذا نجحت كل هذه الشروط معًا.
 */
export function isValidQuizQuestion(value: unknown): value is QuizQuestion {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  if (typeof item.id !== "number") return false;
  if (typeof item.question !== "string") return false;
  if (typeof item.answer !== "string") return false;
  if (typeof item.category !== "string") return false;
  if (item.difficulty !== "easy" && item.difficulty !== "medium" && item.difficulty !== "hard") {
    return false;
  }

  return true;
}
