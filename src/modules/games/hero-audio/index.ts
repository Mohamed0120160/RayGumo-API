/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة لعبة "خمن البطل من الصوت")
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة "خمن البطل من
 * الصوت" في مكان واحد فقط، بدل أن يستورد كل ملف من مسارات داخلية
 * متفرقة مباشرة. مطابق تمامًا لبنية
 * src/modules/games/character-guess/index.ts.
 */

export {
  getRandomQuestion,
  getRandomQuestionExcluding,
  getQuestionById,
  getAllQuestions,
  getQuestionCount,
  JsonDbError,
} from "./hero-audio.service";

export type { HeroAudioQuestion } from "./hero-audio.types";
export { isValidHeroAudioQuestion } from "./hero-audio.validation";
