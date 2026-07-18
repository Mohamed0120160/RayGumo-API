/**
 * هذا الملف يحدد "الشكل الموحّد" لكل استجابة (response) ترجع من أي API
 * في المشروع بالكامل.
 *
 * الفكرة: بدل ما كل route يرجّع شكل JSON مختلف، كل الـ routes تلتزم بنفس
 * البنية (شكلين فقط: نجاح أو فشل). هذا يخلي أي بوت واتساب يتعامل مع
 * الـ API بثقة وبدون ما يحتاج يتوقع أشكال مختلفة لكل endpoint.
 */

/**
 * شكل الاستجابة عند النجاح.
 * success = true دايمًا، و data تحتوي البيانات الفعلية (أي نوع T).
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * شكل الاستجابة عند حدوث خطأ.
 * success = false دايمًا، message نص يشرح الخطأ بلغة مفهومة،
 * و code (اختياري) كود مختصر يستخدمه المبرمج للتعامل البرمجي مع الخطأ
 * مثل "NOT_FOUND" أو "BAD_REQUEST".
 */
export interface ApiError {
  success: false;
  message: string;
  /** كود اختياري يمكن قراءته برمجيًا (مثال: "NOT_FOUND"، "INVALID_INPUT"). */
  code?: string;
}

/**
 * النوع النهائي: أي استجابة API في المشروع هي إما ApiSuccess أو ApiError.
 * بهذا الشكل، TypeScript يجبرنا نتعامل مع الحالتين في الكود المستهلك.
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

