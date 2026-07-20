/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة الألغاز)
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة الألغاز في مكان
 * واحد فقط، بدل أن يستورد كل ملف من مسارات داخلية متفرقة مباشرة.
 * مطابق تمامًا لبنية src/modules/games/quiz/index.ts وsrc/modules/games/true-false/index.ts.
 */

export {
  getRandomRiddle,
  getRandomRiddleExcluding,
  getRiddleById,
  getAllRiddles,
  getRiddleCount,
  JsonDbError,
} from "./riddles.service";

export type { Riddle } from "./riddles.types";
export { isValidRiddle } from "./riddles.validation";
