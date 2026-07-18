/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة الكويز)
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة الكويز في مكان
 * واحد فقط، بدل أن يستورد كل ملف route.ts من مسارات داخلية متفرقة
 * (quiz.service.ts، quiz.types.ts...) مباشرة.
 *
 * الفائدة: أي كود خارج هذا المجلد (مثل route.ts أو registry.ts) يكتب
 * فقط:
 *   import { getRandomQuestion } from "@/modules/games/quiz";
 * بدل معرفة البنية الداخلية للمجلد. هذا يسهّل أيضًا إعادة تنظيم ملفات
 * الوحدة داخليًا مستقبلًا بدون كسر أي كود يستوردها من الخارج.
 */

export {
  getRandomQuestion,
  getQuestionById,
  getAllQuestions,
  getQuestionCount,
  JsonDbError,
} from "./quiz.service";

export type { QuizQuestion } from "./quiz.types";
export { isValidQuizQuestion } from "./quiz.validation";

