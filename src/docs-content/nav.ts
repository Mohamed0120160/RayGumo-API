/**
 * ملف: nav.ts
 * الغرض: "سجلّ التوثيق" المركزي - نفس فكرة src/types/games.ts + registry.ts
 * لكن لصفحات التوثيق بدل وحدات الألعاب.
 *
 * هذا الملف هو "مصدر الحقيقة الوحيد" لبنية التنقل الكاملة في /docs:
 * الشريط الجانبي، وترتيب صفحات "السابق/التالي" في أسفل كل صفحة، كلاهما
 * يُشتقّان تلقائيًا من هنا.
 *
 * لإضافة API جديد مستقبلًا (مثلًا anime) في التوثيق:
 *   1. أنشئ ملف بيانات جديد في src/docs-content/api-reference/anime.ts
 *      بنفس نمط quiz.ts (انظر ذلك الملف).
 *   2. أضف صفحته هنا في مصفوفة API_REFERENCE_PAGES بالأسفل.
 *   3. لا حاجة لأي تعديل آخر - الشريط الجانبي، والتنقل بين الصفحات،
 *      والبحث كلها تلتقط الصفحة الجديدة تلقائيًا.
 *
 * لا تحتاج أبدًا لتعديل مكوّنات الواجهة (Sidebar, TableOfContents...)
 * عند إضافة صفحة جديدة - فقط عدّل هذا الملف.
 */

export interface DocPage {
  /** المسار الكامل تحت /docs، مثال: "/docs/getting-started" */
  href: string;
  /** العنوان الظاهر في الشريط الجانبي والعنوان <title> */
  title: string;
  /** وصف مختصر (يُستخدم في نتائج البحث) */
  description: string;
  /** شارة اختيارية تظهر بجانب العنوان في الشريط الجانبي (مثل "GET" أو "قريبًا") */
  badge?: string;
  /** هل الصفحة لـ API لم يُطلَق بعد (تُعرض بشكل باهت وغير قابلة للنقر الكامل) */
  planned?: boolean;
}

export interface DocGroup {
  title: string;
  pages: DocPage[];
}

/** مجموعة صفحات "الأساسيات" - نظرة عامة، البدء، البنية. */
export const GETTING_STARTED_GROUP: DocGroup = {
  title: "الأساسيات",
  pages: [
    { href: "/docs", title: "الرئيسية", description: "مقدمة عن RayGumo API والغرض منه." },
    { href: "/docs/overview", title: "نظرة عامة", description: "ما هو RayGumo API، ولمن، وما هي حالات الاستخدام." },
    { href: "/docs/getting-started", title: "البدء السريع", description: "الرابط الأساسي، شكل الطلب والاستجابة." },
    { href: "/docs/installation", title: "التثبيت والاستخدام", description: "أمثلة جاهزة للمتصفح، Node.js، JavaScript وTypeScript." },
    { href: "/docs/architecture", title: "بنية المشروع", description: "الطبقات، المجلدات، وكيفية إضافة API جديد." },
  ],
};

/**
 * مجموعة "مرجع الـ API" - قائمة كل واجهات البرمجة الموثّقة، متاحة كانت
 * أو مخطط لها مستقبلًا. هذه القائمة هي التي تسمح بالنمو غير المحدود:
 * أي API جديد فقط يُضاف كعنصر هنا.
 */
export const API_REFERENCE_GROUP: DocGroup = {
  title: "مرجع الـ API",
  pages: [
    { href: "/docs/api-reference", title: "مقدمة المرجع", description: "كيف تُقرأ صفحات مرجع الـ API." },
    { href: "/docs/api-reference/quiz", title: "Quiz API", description: "كل نقاط API الخاصة بلعبة الأسئلة.", badge: "GET" },
    { href: "/docs/api-reference/quiz/schema", title: "مخطط بيانات الكويز", description: "شكل كل سؤال وحقوله بالتفصيل." },
    { href: "/docs/api-reference/anime", title: "Anime API", description: "توثيق مستقبلي عند إطلاق هذا الـ API.", badge: "قريبًا", planned: true },
    { href: "/docs/api-reference/character", title: "Character API", description: "توثيق مستقبلي عند إطلاق هذا الـ API.", badge: "قريبًا", planned: true },
    { href: "/docs/api-reference/riddles", title: "Riddles API", description: "توثيق مستقبلي عند إطلاق هذا الـ API.", badge: "قريبًا", planned: true },
    { href: "/docs/api-reference/images", title: "Images API", description: "توثيق مستقبلي عند إطلاق هذا الـ API.", badge: "قريبًا", planned: true },
  ],
};

/** مجموعة "التكامل" - دمج الـ API في تطبيقات حقيقية. */
export const INTEGRATION_GROUP: DocGroup = {
  title: "التكامل",
  pages: [
    { href: "/docs/whatsapp-bot", title: "بوت واتساب (Baileys)", description: "دليل كامل خطوة بخطوة لربط بوت واتساب بالـ API." },
    { href: "/docs/examples", title: "أمثلة عملية", description: "سيناريوهات جاهزة للنسخ واللصق." },
  ],
};

/** مجموعة "المرجعية" - أخطاء، إصدارات، تغييرات، أسئلة شائعة. */
export const REFERENCE_GROUP: DocGroup = {
  title: "مرجعية",
  pages: [
    { href: "/docs/errors", title: "الأخطاء", description: "كل رموز الأخطاء المحتملة وسبب كل واحد." },
    { href: "/docs/versioning", title: "الإصدارات", description: "سياسة الإصدارات، التغييرات الكاسرة، وسياسة الإلغاء." },
    { href: "/docs/changelog", title: "سجل التغييرات", description: "تاريخ تطور المشروع." },
    { href: "/docs/faq", title: "الأسئلة الشائعة", description: "إجابات لأكثر الأسئلة تكرارًا من المطورين." },
  ],
};

/** كل مجموعات التنقل بالترتيب الظاهر في الشريط الجانبي. */
export const DOC_NAV: DocGroup[] = [
  GETTING_STARTED_GROUP,
  API_REFERENCE_GROUP,
  INTEGRATION_GROUP,
  REFERENCE_GROUP,
];

/**
 * قائمة مسطّحة بكل الصفحات الحقيقية فقط (تُستخدم للبحث ولحساب
 * السابق/التالي). الصفحات المخطط لها (planned: true) ليس لها page.tsx
 * فعلي بعد، فتُستثنى هنا حتى لا يقود البحث أو زر "التالي" لصفحة 404.
 */
export const ALL_DOC_PAGES: DocPage[] = DOC_NAV.flatMap((group) => group.pages).filter(
  (page) => !page.planned
);

/** تُرجع الصفحة السابقة والتالية لمسار معيّن، لعرضهما في تذييل الصفحة. */
export function getPageNav(href: string): { prev?: DocPage; next?: DocPage } {
  const index = ALL_DOC_PAGES.findIndex((p) => p.href === href);
  if (index === -1) return {};
  return {
    prev: ALL_DOC_PAGES[index - 1],
    next: ALL_DOC_PAGES[index + 1],
  };
}
