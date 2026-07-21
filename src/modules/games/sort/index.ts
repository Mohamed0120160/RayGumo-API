/**
 * ملف: index.ts (نقطة الدخول العامة لوحدة "رتب")
 * الغرض: يجمع ويصدّر كل ما يحتاجه باقي المشروع من وحدة "رتب" في مكان
 * واحد فقط، بدل أن يستورد كل ملف (registry.ts مثلًا) من مسارات داخلية
 * متفرقة (sort.service.ts، sort.types.ts...) مباشرة - بنفس نمط
 * quiz/index.ts وeye/index.ts تمامًا.
 */

export {
  getRandomSortQuestion,
  getRandomSortQuestionExcluding,
  getSortQuestionById,
  getAllSortQuestions,
  getSortQuestionCount,
  JsonDbError,
} from "./sort.service";

export type { SortQuestion, SortRandomItem } from "./sort.types";
export { isValidSortQuestion } from "./sort.validation";
