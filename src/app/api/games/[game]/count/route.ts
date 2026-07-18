import type { NextRequest } from "next/server";
import { getItemCount, GameNotFoundError, JsonDbError } from "@/modules/games/registry";
import { ok, notFound, serverError } from "@/lib/response";

/**
 * GET /api/games/[game]/count
 *
 * الغرض: ترجع العدد الإجمالي لعناصر اللعبة المحددة (مثلًا: كم سؤال
 * كويز متاح حاليًا).
 *
 * يستخدمها: بوتات الواتساب لعرض إحصائية بسيطة (مثل "إجمالي الأسئلة:
 * 50")، أو للتحقق من حجم البيانات بعد استبدال ملف questions.json.
 *
 * ملاحظة على ترتيب المسارات: "count" هو مسار ثابت (static segment)،
 * فيأخذ الأولوية تلقائيًا عن المسار الديناميكي [id] في Next.js - أي أن
 * /api/games/quiz/count لن يُفسَّر أبدًا كطلب سؤال بـ id="count".
 *
 * مثال: GET /api/games/quiz/count
 */
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ game: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { game } = await params;

  try {
    const count = await getItemCount(game);
    return ok({ count });
  } catch (err) {
    if (err instanceof GameNotFoundError) {
      return notFound(err.message);
    }
    if (err instanceof JsonDbError) {
      return err.code === "NOT_FOUND" ? notFound(err.message) : serverError(err.message);
    }
    return serverError("Unexpected error while counting game items");
  }
}

