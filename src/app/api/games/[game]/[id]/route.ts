import type { NextRequest } from "next/server";
import { getItemById, GameNotFoundError, JsonDbError } from "@/modules/games/registry";
import { ValidationError, parseId } from "@/lib/validation";
import { ok, notFound, badRequest, serverError } from "@/lib/response";

/**
 * GET /api/games/[game]/[id]
 *
 * الغرض: ترجع عنصرًا واحدًا محددًا بالضبط عبر رقمه (id)، بدل عنصر
 * عشوائي. مفيد عندما يريد البوت إعادة عرض نفس السؤال (مثلًا بعد إجابة
 * خاطئة)، أو عند بناء نظام تصفح تسلسلي للأسئلة.
 *
 * ملاحظة على ترتيب المسارات: مجلدات "all" و"random" و"count" هي
 * مسارات ثابتة (static segments)، فتأخذ الأولوية تلقائيًا عن هذا
 * المسار الديناميكي [id] في Next.js - أي أن /api/games/quiz/all لن
 * يدخل هنا أبدًا رغم أنه ينطبق شكليًا على النمط [game]/[id].
 *
 * مثال: GET /api/games/quiz/2
 */
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ game: string; id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { game, id } = await params;

  try {
    // نحوّل id من نص (كما يصل من الرابط) إلى رقم صحيح موجب، مع رمي
    // خطأ واضح إذا كانت القيمة غير صالحة (مثل "abc" أو "-1").
    const numericId = parseId(id);
    const item = await getItemById(game, numericId);
    if (!item) {
      return notFound(`No item with id ${numericId} in "${game}"`);
    }
    return ok(item);
  } catch (err) {
    if (err instanceof ValidationError) {
      return badRequest(err.message);
    }
    if (err instanceof GameNotFoundError) {
      return notFound(err.message);
    }
    if (err instanceof JsonDbError) {
      return err.code === "NOT_FOUND" ? notFound(err.message) : serverError(err.message);
    }
    return serverError("Unexpected error while fetching game item");
  }
}
