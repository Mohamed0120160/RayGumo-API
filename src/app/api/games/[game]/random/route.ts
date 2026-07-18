import type { NextRequest } from "next/server";
import { getRandomItem, GameNotFoundError, JsonDbError } from "@/modules/games/registry";
import { ok, notFound, serverError } from "@/lib/response";

/**
 * GET /api/games/[game]/random
 *
 * الغرض: ترجع عنصرًا عشوائيًا واحدًا من اللعبة المحددة. حاليًا اللعبة
 * الوحيدة المتاحة هي "quiz"، لكن هذا الرابط عام (generic) ويعمل مع أي
 * لعبة تُضاف مستقبلًا للسجلّ registry.ts بدون أي تعديل هنا.
 *
 * يستخدمها: أوامر الألعاب في بوتات الواتساب، مثل أمر "!كويز" الذي
 * يطلب سؤالًا عشوائيًا جديدًا في كل مرة.
 *
 * مثال: GET /api/games/quiz/random
 */

// force-dynamic تمنع Next.js من تخزين هذا الـ route في ذاكرة تخزين
// مؤقت ثابتة عند البناء، لأننا نريد نتيجة عشوائية مختلفة في كل طلب
// فعلي، وليس نفس النتيجة المحفوظة من وقت البناء.
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ game: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { game } = await params;

  try {
    const item = await getRandomItem(game);
    return ok(item);
  } catch (err) {
    // اللعبة (slug) غير مسجّلة أصلًا في GAME_REGISTRY.
    if (err instanceof GameNotFoundError) {
      return notFound(err.message);
    }
    // خطأ من طبقة تخزين JSON: إما الملف غير موجود (نرجع 404)
    // أو أي خطأ قراءة/تحليل آخر (نرجع 500).
    if (err instanceof JsonDbError) {
      return err.code === "NOT_FOUND" ? notFound(err.message) : serverError(err.message);
    }
    return serverError("Unexpected error while fetching random game item");
  }
}

