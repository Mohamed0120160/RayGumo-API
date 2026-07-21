/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة لعبة "إيموجي")
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة "إيموجي" في
 * مكان واحد فقط، بدل أن يستورد كل ملف من مسارات داخلية متفرقة مباشرة.
 * مطابق تمامًا لبنية src/modules/games/riddles/index.ts وsrc/modules/games/eye/index.ts.
 */

export {
  getRandomEmojiQuestion,
  getRandomEmojiQuestionExcluding,
  getEmojiQuestionById,
  getAllEmojiQuestions,
  getEmojiQuestionCount,
  JsonDbError,
} from "./emoji.service";

export type { EmojiQuestion } from "./emoji.types";
export { isValidEmojiQuestion } from "./emoji.validation";
