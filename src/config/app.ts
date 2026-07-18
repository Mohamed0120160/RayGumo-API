/**
 * إعدادات التطبيق المركزية (App Configuration).
 *
 * هذا الملف هو المكان الوحيد الذي نقرأ منه متغيرات البيئة
 * (Environment Variables) مباشرة، ثم نصدّرها كقيم جاهزة الاستخدام
 * في باقي المشروع. الفائدة: لو احتجنا نغيّر اسم متغير بيئة أو نضيف
 * قيمة افتراضية، نعدّل مكان واحد فقط بدل البحث في كل الملفات.
 *
 * كل القيم هنا لها قيمة افتراضية (fallback)، لذلك المشروع يعمل محليًا
 * بدون الحاجة لملف .env.local إطلاقًا في نسخته الحالية (Quiz MVP).
 */

/** إعدادات عامة عن التطبيق: الاسم، رقم الإصدار، وبيئة التشغيل. */
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_API_NAME ?? "RayGumo API",
  version: process.env.API_VERSION ?? "1.0.0",
  environment: process.env.NODE_ENV ?? "development",
} as const;

