import type { NextRequest } from "next/server";
import { getRandomItemExcluding, GameNotFoundError, JsonDbError } from "@/modules/games/registry";
import { ValidationError, parseIdsList } from "@/lib/validation";
import { ok, notFound, badRequest, serverError } from "@/lib/response";

/**
 * GET /api/games/[game]/random-exclude?ids=1,2,3,4
 *
 * الغرض: ترجع عنصرًا عشوائيًا واحدًا من اللعبة المحددة، مع استثناء كل
 * الـ id المذكورة في معامل الاستعلام "ids" (مفصولة بفواصل).
 *
 * لماذا هذا المسار موجود: الـ API يبقى بلا حالة (stateless) تمامًا - لا
 * يخزّن أي معلومة عن "الأسئلة المستخدمة سابقًا" بشكل دائم. بوت
 * الواتساب هو المسؤول عن تتبّع الأسئلة المستخدمة لكل مجموعة (group) على
 * حدة، ثم يرسل قائمة تلك الـ id مع كل طلب عبر هذا المسار حتى لا يتكرر
 * نفس السؤال على نفس المجموعة.
 *
 * مثال: GET /api/games/quiz/random-exclude?ids=1,2,3,4,5
 *   - يرجع سؤالًا عشوائيًا واحدًا، ليس له id ضمن 1 أو 2 أو 3 أو 4 أو 5.
 *
 * حالة خاصة: إذا استُثنيت كل الأسئلة المتاحة (لم يتبقَّ أي سؤال جديد)،
 * يرجع المسار خطأ 404 واضحًا بدل تكرار سؤال قديم بصمت. عندها على البوت
 * أن يعيد تصفير قائمة الأسئلة المستخدمة لتلك المجموعة والبدء من جديد.
 *
 * مثال بدون معامل ids (أو ids فارغة): يعمل تمامًا مثل /random العادي،
 * لأن "استثناء لا شيء" يعني كل الأسئلة متاحة.
 */
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ game: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { game } = await params;

  try {
    // نقرأ معامل الاستعلام ?ids=1,2,3 من رابط الطلب ونحوّله لمصفوفة أرقام.
    const idsParam = request.nextUrl.searchParams.get("ids");
    const excludeIds = parseIdsList(idsParam);

    const item = await getRandomItemExcluding(game, excludeIds);
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
    return serverError("Unexpected error while fetching random game item (excluding ids)");
  }
}

