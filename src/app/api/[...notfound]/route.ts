import { notFound } from "@/lib/response";

/**
 * معالج شامل (Catch-All Handler) لأي مسار تحت /api/* لا يطابق أي
 * route معرّف فعليًا في المشروع.
 *
 * الغرض: يضمن أن أي طلب لمسار API غير موجود يحصل دائمًا على استجابة
 * JSON بالشكل الموحّد للمشروع (success: false)، بدل صفحة 404 الافتراضية
 * من Next.js التي تكون HTML وليست JSON - وهذا مهم لأن بوتات الواتساب
 * تتوقع JSON فقط من أي رد على /api/*.
 *
 * ملاحظة: كل نقاط الـ API في هذا المشروع حاليًا من نوع GET فقط، لذلك
 * هذا المعالج يغطي GET فقط. عند إضافة أي method آخر (POST مثلًا)
 * لأي وحدة مستقبلية، أضف معالجًا مطابقًا هنا أيضًا.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return notFound("This API route does not exist");
}

