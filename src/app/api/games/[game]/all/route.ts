import type { NextRequest } from "next/server";
import { getAllItems, GameNotFoundError, JsonDbError } from "@/modules/games/registry";
import { ok, notFound, serverError } from "@/lib/response";

/**
 * GET /api/games/[game]/all
 *
 * الغرض: ترجع كل عناصر اللعبة المحددة كمصفوفة كاملة.
 * يستخدمها: أدوات إدارة المحتوى، أو أوامر بوت تعرض قائمة كاملة، أو
 * لأغراض التحقق والاختبار من طرف المطوّر.
 *
 * مثال: GET /api/games/quiz/all
 */
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ game: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { game } = await params;

  try {
    const items = await getAllItems(game);
    return ok(items);
  } catch (err) {
    if (err instanceof GameNotFoundError) {
      return notFound(err.message);
    }
    if (err instanceof JsonDbError) {
      return err.code === "NOT_FOUND" ? notFound(err.message) : serverError(err.message);
    }
    return serverError("Unexpected error while fetching game items");
  }
}

