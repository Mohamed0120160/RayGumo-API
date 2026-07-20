/**
 * ملف: registry.ts
 * الغرض: نقطة الربط المركزية بين اسم اللعبة في الرابط (slug مثل "quiz")
 * وبين وحدة اللعبة الفعلية (module) التي تنفّذ منطقها.
 *
 * لماذا نحتاج هذا الملف: مسارات API مثل /api/games/[game]/random هي
 * مسارات "عامة" (generic) تتعامل مع أي لعبة بنفس الكود. لكن كل لعبة
 * لها وحدة service خاصة بها (quiz.service.ts مثلًا) بدوال مختلفة قليلًا
 * عن بعضها. هذا الملف هو "المُبدّل" (dispatcher) الذي يقرر: "بما أن
 * الطلب عن لعبة quiz، إذًا استخدم دوال وحدة الكويز".
 *
 * لإضافة لعبة جديدة مستقبلًا (مثل anime): وحدة "riddles" (الألغاز) هي
 * أحدث مثال حي مضاف بهذا الأسلوب بالضبط، ويمكن اعتبارها مرجعًا.
 *   1. أنشئ وحدة كاملة في src/modules/games/anime/ بنفس نمط quiz/ أو
 *      true-false/ أو riddles/.
 *   2. أضف "anime" في GAME_REGISTRY داخل src/types/games.ts.
 *   3. أضف حالة جديدة هنا في كل دالة (switch/if) تربط "anime" بوحدة
 *      anime الجديدة.
 *
 * ملفات route.ts نفسها لن تحتاج أي تعديل عند إضافة لعبة جديدة - فقط
 * هذا الملف يحتاج التوسعة.
 */

import * as quiz from "./quiz";
import * as trueFalse from "./true-false";
import * as riddles from "./riddles";
import { isValidGameSlug, type GameSlug } from "@/types/games";

/** خطأ يُرمى عندما يطلب المستخدم لعبة (slug) غير مسجّلة في GAME_REGISTRY. */
export class GameNotFoundError extends Error {
  constructor(slug: string) {
    super(`Unknown game category: "${slug}"`);
    this.name = "GameNotFoundError";
  }
}

/**
 * تتأكد أن الـ slug الممرَّر مسجّل فعلًا في GAME_REGISTRY، وإلا ترمي
 * GameNotFoundError. كلمة "asserts" تخبر TypeScript أن النوع أصبح
 * مضمونًا كـ GameSlug بعد نجاح هذه الدالة بدون رمي خطأ.
 */
function assertValidSlug(slug: string): asserts slug is GameSlug {
  if (!isValidGameSlug(slug)) {
    throw new GameNotFoundError(slug);
  }
}

/**
 * تُرجع عنصرًا عشوائيًا واحدًا من اللعبة المحددة بواسطة slug.
 * أي لعبة تُضاف مستقبلًا تحتاج فرعًا جديدًا هنا.
 */
export async function getRandomItem(slug: string) {
  assertValidSlug(slug);
  switch (slug) {
    case "quiz":
      return quiz.getRandomQuestion();
    case "true-false":
      return trueFalse.getRandomQuestion();
    case "riddles":
      return riddles.getRandomRiddle();
  }
}

/**
 * تُرجع عنصرًا عشوائيًا واحدًا من اللعبة المحددة، مع استثناء مجموعة من
 * الـ id المُمرَّرة (تُستخدم من بوت الواتساب لمنع تكرار نفس السؤال).
 */
export async function getRandomItemExcluding(slug: string, excludeIds: number[]) {
  assertValidSlug(slug);
  switch (slug) {
    case "quiz":
      return quiz.getRandomQuestionExcluding(excludeIds);
    case "true-false":
      return trueFalse.getRandomQuestionExcluding(excludeIds);
    case "riddles":
      return riddles.getRandomRiddleExcluding(excludeIds);
  }
}

/** تُرجع كل عناصر اللعبة المحددة بواسطة slug. */
export async function getAllItems(slug: string) {
  assertValidSlug(slug);
  switch (slug) {
    case "quiz":
      return quiz.getAllQuestions();
    case "true-false":
      return trueFalse.getAllQuestions();
    case "riddles":
      return riddles.getAllRiddles();
  }
}

/** تُرجع عنصرًا واحدًا بواسطة id داخل اللعبة المحددة، أو null إذا لم يوجد. */
export async function getItemById(slug: string, id: number) {
  assertValidSlug(slug);
  switch (slug) {
    case "quiz":
      return quiz.getQuestionById(id);
    case "true-false":
      return trueFalse.getQuestionById(id);
    case "riddles":
      return riddles.getRiddleById(id);
  }
}

/** تُرجع العدد الإجمالي لعناصر اللعبة المحددة. */
export async function getItemCount(slug: string) {
  assertValidSlug(slug);
  switch (slug) {
    case "quiz":
      return quiz.getQuestionCount();
    case "true-false":
      return trueFalse.getQuestionCount();
    case "riddles":
      return riddles.getRiddleCount();
  }
}

export { JsonDbError } from "./quiz";

