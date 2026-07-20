/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة "صح أو خطأ")
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة "صح أو خطأ" في
 * مكان واحد فقط، بدل أن يستورد كل ملف من مسارات داخلية متفرقة مباشرة.
 * مطابق تمامًا لبنية src/modules/games/quiz/index.ts.
 */

export {
  getRandomQuestion,
  getRandomQuestionExcluding,
  getQuestionById,
  getAllQuestions,
  getQuestionCount,
  JsonDbError,
} from "./true-false.service";

export type { TrueFalseQuestion } from "./true-false.types";
export { isValidTrueFalseQuestion } from "./true-false.validation";
