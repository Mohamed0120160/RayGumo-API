/**
 * ملف: character-guess.types.ts
 * الغرض: تعريفات الأنواع (TypeScript Types) الخاصة بوحدة لعبة "خمن
 * الشخصية" فقط. هذا الملف مسؤول فقط عن "شكل" بيانات العنصر، ولا يحتوي
 * أي منطق تنفيذي - بنفس نمط eye.types.ts وriddles.types.ts تمامًا.
 */

/**
 * شكل عنصر "خمن الشخصية" الكامل كما يُخزَّن في questions.json (يتضمن
 * answers). هذا الشكل هو ما تُرجعه استجابات [id] وall - أي endpoint لا
 * يحتاج منع غش فيه.
 *
 * - id: رقم صحيح موجب فريد يميّز كل سؤال. **مخزَّن مسبقًا داخل
 *   questions.json نفسه** (نفس أسلوب eye.types.ts وriddles.types.ts)،
 *   وليس مولَّدًا تلقائيًا وقت التحميل. عند إضافة أسئلة جديدة، يجب
 *   إعطاء كل سؤال id فريدًا لم يُستخدم من قبل.
 * - question: نص وصف الشخصية المطلوب تخمينها (يدعم العربية وUTF-8
 *   بالكامل).
 * - answers: مصفوفة كل الإجابات المقبولة لهذا الوصف (قد تشمل تهجئات أو
 *   لغات مختلفة لنفس اسم الشخصية).
 */
export interface CharacterGuessQuestion {
  id: number;
  question: string;
  answers: string[];
}

/**
 * شكل العنصر "الآمن" (بدون answers) كما يُرجَع في استجابات random
 * وrandom-exclude تحديدًا - لمنع أي غش عبر قراءة الإجابات مباشرة من
 * استجابة الـ API قبل محاولة التخمين.
 */
export type PublicCharacterGuessQuestion = Omit<CharacterGuessQuestion, "answers">;
