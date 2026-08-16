/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة لعبة "كويز موبايل ليجندز")
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة "كويز موبايل
 * ليجندز" في مكان واحد فقط، بدل أن يستورد كل ملف من مسارات داخلية
 * متفرقة مباشرة. مطابق تمامًا لبنية src/modules/games/flags/index.ts
 * وsrc/modules/games/riddles/index.ts.
 */

export {
  getRandomMlbbQuizQuestion,
  getRandomMlbbQuizQuestionExcluding,
  getMlbbQuizQuestionById,
  getAllMlbbQuizQuestions,
  getMlbbQuizQuestionCount,
  JsonDbError,
} from "./mlbb-quiz.service";

export type { MlbbQuizQuestion } from "./mlbb-quiz.types";
export { isValidMlbbQuizQuestion } from "./mlbb-quiz.validation";
