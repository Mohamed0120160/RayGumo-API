import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

/**
 * هذا الملف يحتوي دوال مساعدة (helpers) لبناء استجابات الـ API بشكل
 * موحّد. بدل ما كل route يكتب NextResponse.json({...}) يدويًا بشكل
 * متكرر ومختلف الصيغة، نستخدم هذه الدوال الجاهزة فقط.
 *
 * الفائدة: كل استجابة في المشروع (نجاح أو خطأ) لها نفس الشكل بالضبط،
 * وهذا يسهّل على بوتات الواتساب التعامل مع الـ API بثقة.
 */

/**
 * تبني استجابة ناجحة بالشكل الموحّد:
 * { success: true, data: T }
 *
 * @param data البيانات المطلوب إرجاعها للمستخدم.
 * @param init يمكن تمرير رقم (status code) مباشرة، أو كائن ResponseInit كامل.
 */
export function ok<T>(data: T, init?: number | ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, normalizeInit(init, 200));
}

/**
 * تبني استجابة خطأ بالشكل الموحّد:
 * { success: false, message: string, code?: string }
 *
 * @param message نص يشرح الخطأ بلغة مفهومة للمستخدم/المطوّر.
 * @param status رمز حالة HTTP (افتراضيًا 400).
 * @param code كود مختصر اختياري يمكن التعامل معه برمجيًا.
 */
export function fail(
  message: string,
  status = 400,
  code?: string
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, message, ...(code ? { code } : {}) },
    { status }
  );
}

// دوال جاهزة لأشهر أنواع الأخطاء، بأسماء واضحة تدل على معناها -------------

/** خطأ 404: المورد المطلوب غير موجود (مثال: لعبة غير مسجّلة، أو id غير موجود). */
export function notFound(message = "Resource not found"): NextResponse<ApiResponse<never>> {
  return fail(message, 404, "NOT_FOUND");
}

/** خطأ 400: الطلب نفسه غير صالح (بيانات ناقصة أو خاطئة من المستخدم). */
export function badRequest(message = "Invalid request"): NextResponse<ApiResponse<never>> {
  return fail(message, 400, "BAD_REQUEST");
}

/** خطأ 500: خطأ غير متوقع من طرف الخادم نفسه (وليس خطأ المستخدم). */
export function serverError(message = "Internal server error"): NextResponse<ApiResponse<never>> {
  return fail(message, 500, "INTERNAL_ERROR");
}

/**
 * دالة داخلية مساعدة: تحوّل المعامل init (سواء كان رقم status أو كائن
 * ResponseInit كامل أو undefined) إلى كائن ResponseInit موحّد، مع رمز
 * حالة افتراضي إذا لم يُحدَّد شيء.
 */
function normalizeInit(init: number | ResponseInit | undefined, defaultStatus: number): ResponseInit {
  if (typeof init === "number") return { status: init };
  if (!init) return { status: defaultStatus };
  return { status: defaultStatus, ...init };
}
