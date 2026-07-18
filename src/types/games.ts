/**
 * هذا الملف يحتوي "سجلّ الألعاب" العام (Games Registry) على مستوى
 * المشروع بأكمله - وهو النقطة الوحيدة التي تربط اسم اللعبة الظاهر في
 * الرابط (مثل "quiz" في /api/games/quiz/random) بوحدة اللعبة الفعلية
 * داخل src/modules/games/<game>/.
 *
 * حاليًا يوجد لعبة واحدة مسجّلة فقط: quiz. لإضافة لعبة جديدة مستقبلًا
 * (anime, riddles...) يجب:
 *   1. إنشاء وحدة جديدة كاملة في src/modules/games/<game>/ بنفس نمط
 *      وحدة quiz (service + types + validation + index).
 *   2. إضافة اسمها هنا في GAME_REGISTRY.
 *   3. ربطها من داخل src/modules/games/registry.ts (انظر ذلك الملف).
 *
 * هذا التصميم يبقي رابط الـ API ثابتًا دائمًا بالشكل /api/games/[game]/
 * بغض النظر عن عدد الألعاب المضافة مستقبلًا.
 */

/**
 * قائمة أسماء (slugs) كل الألعاب المسجّلة فعليًا في المشروع حاليًا.
 * هذا الثابت هو "مصدر الحقيقة الوحيد" لمعرفة أي الألعاب متاحة.
 */
export const GAME_REGISTRY = ["quiz"] as const;

/** نوع يمثل فقط الأسماء المسجّلة فعليًا في GAME_REGISTRY (حاليًا: "quiz" فقط). */
export type GameSlug = (typeof GAME_REGISTRY)[number];

/**
 * دالة للتحقق: هل الـ slug القادم من رابط الطلب (مثلًا "quiz") مسجّل
 * فعلًا في GAME_REGISTRY أم لا؟
 *
 * لماذا نحتاجها: الـ slug يجي من المستخدم عبر الرابط (params)، وهو نص
 * (string) عادي بدون أي ضمان أنه صحيح. هذه الدالة تتحقق وتُخبر
 * TypeScript (عبر "slug is GameSlug") أن النص أصبح مضمون الصحة بعد
 * نجاح الفحص.
 */
export function isValidGameSlug(slug: string): slug is GameSlug {
  return (GAME_REGISTRY as readonly string[]).includes(slug);
}

