import { APP_CONFIG } from "@/config/app";

/**
 * الصفحة الرئيسية (Landing Page) - صفحة معلومات بسيطة جدًا فقط.
 *
 * هذا المشروع خادم API خالص، فهذه الصفحة ليست الوجهة الأساسية
 * للمستخدمين، بل مجرد نقطة تحقق سريعة لأي شخص يفتح رابط المشروع
 * مباشرة في المتصفح، تعرض اسم المشروع ورقم إصداره وأهم الروابط.
 */
export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>{APP_CONFIG.name}</h1>
      <p>
        Version {APP_CONFIG.version} &middot; {APP_CONFIG.environment}
      </p>
      <p>
        This is a lightweight backend-only Game Content API. See the project README for the full
        list of endpoints.
      </p>
      <h2>Quick links</h2>
      <ul>
        <li><code>GET /api/games/quiz/random</code></li>
        <li><code>GET /api/games/quiz/all</code></li>
        <li><code>GET /api/games/quiz/count</code></li>
        <li><code>GET /api/games/quiz/:id</code></li>
      </ul>
    </main>
  );
}
