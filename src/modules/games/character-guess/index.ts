/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة لعبة "خمن الشخصية")
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة "خمن الشخصية"
 * في مكان واحد فقط، بدل أن يستورد كل ملف من مسارات داخلية متفرقة
 * مباشرة. مطابق تمامًا لبنية src/modules/games/eye/index.ts وsrc/modules/games/quiz/index.ts.
 */

export {
  getRandomQuestion,
  getRandomQuestionExcluding,
  getQuestionById,
  getAllQuestions,
  getQuestionCount,
  JsonDbError,
} from "./character-guess.service";

export type { CharacterGuessQuestion, PublicCharacterGuessQuestion } from "./character-guess.types";
export { isValidCharacterGuessQuestion } from "./character-guess.validation";
