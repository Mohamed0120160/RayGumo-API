/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة لعبة "أعلام")
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة "أعلام" في مكان
 * واحد فقط، بدل أن يستورد كل ملف من مسارات داخلية متفرقة مباشرة.
 * مطابق تمامًا لبنية src/modules/games/eye/index.ts وsrc/modules/games/riddles/index.ts.
 */

export {
  getRandomFlagItem,
  getRandomFlagItemExcluding,
  getFlagItemById,
  getAllFlagItems,
  getFlagItemCount,
  JsonDbError,
} from "./flags.service";

export type { FlagItem } from "./flags.types";
export { isValidFlagItem } from "./flags.validation";
