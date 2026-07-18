/**
 * ملف: quiz.service.ts
 * الغرض: طبقة الخدمة (Service) الخاصة بوحدة الكويز - هي المكان الوحيد
 * الذي يحتوي منطق العمل الفعلي لأسئلة الكويز (اختيار عشوائي، بحث بالـ
 * id، إرجاع الكل، حساب العدد).
 *
 * تدفّق البيانات (Data Flow):
 *   route.ts (يستقبل طلب HTTP)
 *       ↓ يستدعي
 *   quiz.service.ts (هذا الملف - منطق العمل)
 *       ↓ يستدعي
 *   lib/json-db.ts (طبقة تخزين JSON العامة)
 *       ↓ تقرأ
 *   src/data/quiz/questions.json (البيانات الفعلية على القرص)
 *
 * كل دالة هنا "تفوّض" القراءة الفعلية لملف JSON إلى lib/json-db.ts
 * (طبقة عامة يمكن لأي لعبة مستقبلية استخدامها أيضًا)، وتقتصر مسؤولية
 * هذا الملف على "ماذا أفعل ببيانات الكويز تحديدًا" فقط.
 */

import { getAllItems, getItemById, getRandomItem, JsonDbError } from "@/lib/json-db";
import type { QuizQuestion } from "./quiz.types";

/** اسم فئة البيانات كما تُخزَّن تحت src/data/ (يطابق اسم المجلد). */
const QUIZ_CATEGORY = "quiz";

/**
 * تُرجع سؤال كويز عشوائيًا واحدًا.
 *
 * خطوات العمل: تقرأ كل ملف questions.json عبر طبقة JSON العامة، ثم
 * تختار عنصرًا عشوائيًا منه. إذا كان الملف فارغًا أو غير موجود، تُرمى
 * JsonDbError (يتعامل معها route.ts لاحقًا برد HTTP مناسب).
 */
export async function getRandomQuestion(): Promise<QuizQuestion> {
  return getRandomItem<QuizQuestion>(QUIZ_CATEGORY);
}

/**
 * تبحث عن سؤال كويز واحد بواسطة id الرقمي الخاص به.
 * ترجع null إذا لم يوجد سؤال بهذا الـ id (وهي حالة طبيعية متوقعة،
 * وليست خطأ - route.ts يقرر كيف يتعامل معها، عادة برد 404).
 */
export async function getQuestionById(id: number): Promise<QuizQuestion | null> {
  return getItemById<QuizQuestion>(QUIZ_CATEGORY, id);
}

/** تُرجع كل أسئلة الكويز الموجودة في questions.json كمصفوفة كاملة. */
export async function getAllQuestions(): Promise<QuizQuestion[]> {
  return getAllItems<QuizQuestion>(QUIZ_CATEGORY);
}

/**
 * تُرجع العدد الإجمالي لأسئلة الكويز المتاحة حاليًا.
 * مفيدة مثلًا لعرض "إجمالي الأسئلة: 50" في بوت الواتساب، أو للتحقق من
 * حجم قاعدة الأسئلة بعد استبدال ملف questions.json بمجموعة جديدة.
 */
export async function getQuestionCount(): Promise<number> {
  const questions = await getAllQuestions();
  return questions.length;
}

// نعيد تصدير JsonDbError هنا حتى تستطيع ملفات route.ts استيرادها من
// نفس مكان استيراد دوال الخدمة، بدل الاستيراد من lib/json-db مباشرة.
export { JsonDbError };
