/**
 * ملف: hero-audio.validation.ts
 * الغرض: دوال تحقّق (Validation) خاصة بوحدة لعبة "خمن البطل من
 * الصوت" فقط.
 *
 * نفس فكرة character-guess.validation.ts بالضبط: نتأكد أن كائن قادم
 * من ملف JSON فعلًا يطابق شكل HeroAudioQuestion الصحيح قبل أن نثق به،
 * ونتجاهل أي سجل لا يجتاز التحقق بأمان أثناء التحميل بدل أن يوقف الـ
 * API بالكامل بسبب سجل واحد فاسد.
 *
 * ملاحظة: id هنا **مطلوب ويُتحقَّق منه هنا** لأنه مخزَّن مسبقًا داخل كل
 * عنصر في questions.json نفسه (نفس أسلوب character-guess.validation.ts)،
 * وليس مولَّدًا تلقائيًا وقت التحميل. التحقق من الفرادة (uniqueness)
 * بين كل العناصر يحدث لاحقًا في hero-audio.service.ts (loadQuestions)،
 * وليس هنا - هذا الملف يتحقق فقط من شكل العنصر الواحد بمعزل عن الباقي.
 */

import type { HeroAudioQuestion } from "./hero-audio.types";

/** نتيجة التحقق: إما صالح، أو غير صالح مع رسالة توضّح سبب الرفض بدقة. */
export interface HeroAudioValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * تتحقق أن قيمة واحدة قادمة من JSON هي فعلًا عنصر "خمن البطل من
 * الصوت" صالح الشكل، وتُرجع قائمة أخطاء واضحة (بدل true/false فقط)
 * تشرح بالضبط أي حقل فشل ولماذا.
 *
 * خطوات العمل:
 *   1. نتأكد أن القيمة كائن (object) وليست null أو نوعًا آخر.
 *   2. نتأكد أن id رقم صحيح (integer) موجب (> 0).
 *   3. نتأكد أن audioUrl مصفوفة غير فارغة، وكل عنصر فيها نص غير فارغ.
 *   4. نتأكد أن answer مصفوفة غير فارغة، وكل عنصر فيها نص غير فارغ.
 */
export function validateHeroAudioQuestion(value: unknown): HeroAudioValidationResult {
  const errors: string[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, errors: ["السجل ليس كائنًا (object) صالحًا"] };
  }

  const item = value as Record<string, unknown>;

  if (typeof item.id !== "number" || !Number.isInteger(item.id) || item.id <= 0) {
    errors.push("حقل id مفقود أو ليس رقمًا صحيحًا موجبًا");
  }

  if (!Array.isArray(item.audioUrl) || item.audioUrl.length === 0) {
    errors.push("حقل audioUrl مفقود أو فارغ أو ليس مصفوفة");
  } else if (!item.audioUrl.every((u) => typeof u === "string" && u.trim() !== "")) {
    errors.push("حقل audioUrl يحتوي عنصرًا غير نصي أو فارغًا");
  }

  if (!Array.isArray(item.answer) || item.answer.length === 0) {
    errors.push("حقل answer مفقود أو فارغ أو ليس مصفوفة");
  } else if (!item.answer.every((a) => typeof a === "string" && a.trim() !== "")) {
    errors.push("حقل answer يحتوي عنصرًا غير نصي أو فارغًا");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * نسخة مبسّطة (type guard) تُستخدم عندما نحتاج فقط true/false بدون
 * تفاصيل الأخطاء - مثل الفلترة السريعة بعد التحميل والتحقق الكامل.
 */
export function isValidHeroAudioQuestion(value: unknown): value is HeroAudioQuestion {
  return validateHeroAudioQuestion(value).valid;
}
