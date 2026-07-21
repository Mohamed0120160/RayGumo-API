/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة لعبة "عين")
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة "عين" في مكان
 * واحد فقط، بدل أن يستورد كل ملف من مسارات داخلية متفرقة مباشرة.
 * مطابق تمامًا لبنية src/modules/games/quiz/index.ts وsrc/modules/games/riddles/index.ts.
 */

export {
  getRandomEyeItem,
  getRandomEyeItemExcluding,
  getEyeItemById,
  getAllEyeItems,
  getEyeItemCount,
  JsonDbError,
} from "./eye.service";

export type { EyeItem } from "./eye.types";
export { isValidEyeItem } from "./eye.validation";
