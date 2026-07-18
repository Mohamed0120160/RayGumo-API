/**
 * ملف: validation.ts
 * الغرض: دوال تحقّق عامة من صحة المدخلات (Input Validation)، يمكن
 * لأي وحدة لعبة مستقبلية استخدامها - وليست خاصة بالكويز وحده.
 *
 * حاليًا كل نقاط الـ API في المشروع من نوع GET فقط (لا توجد أي POST
 * تستقبل جسم طلب/body)، لذلك الدالة الوحيدة الفعلية المطلوبة هنا هي
 * parseId، المستخدمة في GET /api/games/[game]/[id].
 */

/**
 * خطأ مخصص يُرمى عند فشل أي عملية تحقق من المدخلات.
 * نستخدم class مخصص (بدل Error عادي) حتى نستطيع التعرف عليه لاحقًا
 * في route handlers عبر `err instanceof ValidationError` ونرجع 400
 * بدل 500.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * تحوّل قيمة نصية قادمة من رابط الطلب (route param) إلى رقم صحيح موجب
 * يمثّل id. ترمي ValidationError إذا كانت القيمة مفقودة أو غير صالحة.
 *
 * خطوات العمل:
 *   1. التحقق أن القيمة ليست undefined أو null أو نص فارغ.
 *   2. تحويلها إلى رقم عبر Number().
 *   3. التأكد أنها رقم صحيح (Integer) وأكبر من صفر.
 */
export function parseId(raw: string | undefined | null): number {
  if (raw === undefined || raw === null || raw.trim() === "") {
    throw new ValidationError("Missing required id parameter");
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`Invalid id parameter: "${raw}"`);
  }
  return id;
}

/**
 * تحوّل قيمة استعلام (query param) نصية مفصولة بفواصل مثل "1,2,3,4" إلى
 * مصفوفة أرقام صحيحة، لاستخدامها في GET /api/games/[game]/random-exclude
 * (مثال: ?ids=1,2,3,4).
 *
 * خطوات العمل:
 *   1. إذا كانت القيمة مفقودة أو فارغة، نرجع مصفوفة فارغة []  (يعني
 *      "لا يوجد شيء لاستثنائه" - وهذا سلوك طبيعي مقبول، وليس خطأ).
 *   2. نقسّم النص على الفاصلة "،" أو "," ونزيل الفراغات الزائدة من كل
 *      جزء.
 *   3. نتجاهل أي جزء فارغ ينتج عن فواصل متكررة (مثل "1,,2").
 *   4. نحوّل كل جزء متبقٍ إلى رقم صحيح، ونرمي ValidationError برسالة
 *      واضحة إذا كان أي جزء غير رقم صحيح صالح.
 */
export function parseIdsList(raw: string | undefined | null): number[] {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return [];
  }

  const parts = raw
    .split(/[,،]/)
    .map((part) => part.trim())
    .filter((part) => part !== "");

  return parts.map((part) => {
    const id = Number(part);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError(`Invalid id value in "ids" parameter: "${part}"`);
    }
    return id;
  });
}
