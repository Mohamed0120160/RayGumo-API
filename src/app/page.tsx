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
        This is a lightweight backend-only Game Content API. See the project{" "}
        <a href="https://github.com/Mohamed0120160/RayGumo-API#readme">README</a> for the full list of
        endpoints, request/response examples, and a Baileys WhatsApp bot integration guide.
      </p>
      <h2>Quick links</h2>
      <ul>
        <li><code>GET /api/games/quiz/random</code></li>
        <li><code>GET /api/games/quiz/all</code></li>
        <li><code>GET /api/games/quiz/count</code></li>
        <li><code>GET /api/games/quiz/:id</code></li>
        <li><code>GET /api/games/true-false/random</code></li>
        <li><code>GET /api/games/true-false/all</code></li>
        <li><code>GET /api/games/true-false/count</code></li>
        <li><code>GET /api/games/true-false/:id</code></li>
        <li><code>GET /api/games/riddles/random</code></li>
        <li><code>GET /api/games/riddles/random-exclude</code></li>
        <li><code>GET /api/games/riddles/all</code></li>
        <li><code>GET /api/games/riddles/count</code></li>
        <li><code>GET /api/games/riddles/:id</code></li>
        <li><code>GET /api/games/eye/random</code></li>
        <li><code>GET /api/games/eye/random-exclude</code></li>
        <li><code>GET /api/games/eye/all</code></li>
        <li><code>GET /api/games/eye/count</code></li>
        <li><code>GET /api/games/eye/:id</code></li>
        <li><code>GET /api/games/emoji/random</code></li>
        <li><code>GET /api/games/emoji/random-exclude</code></li>
        <li><code>GET /api/games/emoji/all</code></li>
        <li><code>GET /api/games/emoji/count</code></li>
        <li><code>GET /api/games/emoji/:id</code></li>
        <li><code>GET /api/games/character-guess/random</code></li>
        <li><code>GET /api/games/character-guess/random-exclude</code></li>
        <li><code>GET /api/games/character-guess/all</code></li>
        <li><code>GET /api/games/character-guess/count</code></li>
        <li><code>GET /api/games/character-guess/:id</code></li>
      </ul>
      <h2>Games</h2>
      <ul>
        <li>Quiz</li>
        <li>True or False</li>
        <li>Riddles</li>
        <li>Eye</li>
        <li>
          Emoji Game (خمّن الشخصية من الإيموجي) — see{" "}
          <a href="https://github.com/Mohamed0120160/RayGumo-API/blob/main/docs/emoji.md">docs/emoji.md</a>
        </li>
        <li>
          Character Guess (خمّن الشخصية من الوصف) — see{" "}
          <a href="https://github.com/Mohamed0120160/RayGumo-API/blob/main/docs/character-guess.md">
            docs/character-guess.md
          </a>
        </li>
      </ul>
    </main>
  );
}
