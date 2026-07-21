# دليل مشروع RayGumo API (بالعربية)

مرجع شامل لكل جزء من المشروع بعد تحويله إلى **MVP خفيف الوزن** مخصص
لخدمة محتوى الكويز فقط حاليًا، مع بقاء المعمارية جاهزة لإضافة ألعاب
مستقبلية.

---

## جدول المحتويات

1. [نظرة عامة على المشروع](#نظرة-عامة-على-المشروع)
2. [شجرة المجلدات الكاملة](#شجرة-المجلدات-الكاملة)
3. [شرح كل ملف ومجلد](#شرح-كل-ملف-ومجلد)
4. [مسار تدفق الطلب (Request Flow)](#مسار-تدفق-الطلب-request-flow)
5. [النشر على Vercel](#النشر-على-vercel)
6. [نظام تخزين JSON](#نظام-تخزين-json)
7. [دليل تكامل الكويز (Quiz Integration Guide)](#دليل-تكامل-الكويز-quiz-integration-guide)
8. [إضافة لعبة جديدة مستقبلًا](#إضافة-لعبة-جديدة-مستقبلًا)
9. [متغيرات البيئة](#متغيرات-البيئة)
10. [جدول كل نقاط الـ API](#جدول-كل-نقاط-الـ-api)
11. [معالجة الأخطاء](#معالجة-الأخطاء)
12. [دليل التطوير](#دليل-التطوير)

---

## نظرة عامة على المشروع

### ما هو RayGumo API؟

**RayGumo API** هو خادم API مركزي خفيف الوزن (backend واحد) مبني بـ
Next.js 16 و TypeScript، الغرض منه تزويد **بوتات واتساب** (وربما مواقع
مستقبلًا) بمحتوى ألعاب جاهز عبر HTTP.

**هذه نسخة MVP (منتج بحد أدنى قابل للاستخدام)**: حاليًا يوجد فيها لعبة
واحدة فقط - **الكويز (Quiz)** - لكن المعمارية مبنية عمدًا بحيث إضافة
ألعاب جديدة لاحقًا (خمّن الأنمي، ألغاز، صح/خطأ، خمّن الشخصية...) لا
تتطلب أي تغيير في بنية روابط الـ API، فقط إضافة وحدة لعبة جديدة مستقلة.

### لماذا يوجد هذا المشروع؟

بدل ما كل بوت واتساب يخزّن أسئلة الكويز الخاصة به بشكل منفصل ويكرر نفس
المنطق، كل البوتات تتصل بنفس RayGumo API وتحصل على نفس المحتوى بنفس
الشكل الموحّد. تحديث سؤال أو إضافة سؤال جديد يحدث في مكان واحد فقط،
وكل البوتات المتصلة تستفيد فورًا.

### كيف يعمل؟

المشروع **لا يحتاج قاعدة بيانات حقيقية**. أسئلة الكويز مخزّنة في ملف
JSON واحد بسيط (`src/data/quiz/questions.json`)، والخادم يقرأه عند كل
طلب ويرجع النتيجة بشكل استجابة JSON موحّدة. المشروع يُنشر على **Vercel**
(منصة استضافة بلا خوادم).

**مبدأ مهم يجب فهمه**: هذا المشروع **ليس** قاعدة بيانات لاعبين. لا
يحتوي أنظمة نقاط خبرة (XP)، مستويات، حسابات مستخدمين، أو تصنيفات. كل
هذا يبقى مسؤولية كل بوت على حدة - RayGumo API مسؤوليته الوحيدة هي
**تزويد محتوى الألعاب فقط**.

### ماذا تمت إزالته في هذه النسخة؟

نسخة MVP هذه أُزيلت منها كل الأنظمة غير المستخدمة فعليًا للحفاظ على
مشروع بسيط وخفيف وسهل الصيانة:

- **وحدة الذكاء الاصطناعي (AI)** بالكامل (chat, rewrite, translate,
  summarize) وكل مزودّيها الوهميين (mock/openai/gemini).
- **وحدة الأدوات (Tools)** بالكامل (health, ping, version).
- **وحدة الأدمن (Admin)** ومسار `/api/admin/status`.
- **نظام مصادقة مفتاح API** (`X-API-KEY` / `ADMIN_API_KEY`) بالكامل.
- **هيكل تحديد معدل الطلبات (Rate Limiting)** غير المستخدم.
- كل ألعاب المحتوى غير الكويز (Anime، Characters، Riddles، Images).
- كل دوال وملفات المساعدة (utilities) التي لم تعد مستخدمة بعد هذه
  الإزالات (مثل `lib/random.ts`، ودوال JSON body parsing في
  `lib/validation.ts`).

النتيجة: مشروع أبسط بكثير، لكن بنفس جودة البنية المعمارية، وجاهز
للتوسّع لاحقًا بنفس السهولة.

---

## شجرة المجلدات الكاملة

```
raygumo-api/
├── .env.example                          # مثال لمتغيرات البيئة (لا شيء إلزامي حاليًا)
├── .gitignore
├── README.md                             # التوثيق الأساسي (نظرة عامة + روابط للتفاصيل)
├── docs/                                 # دليل استخدام كل لعبة/API (لمبرمجي البوتات)
│   ├── quiz.md
│   └── true-false.md
├── info/                                 # شرح معماري تفصيلي (هذا المجلد)
│   ├── PROJECT_GUIDE_AR.md               # هذا الملف
│   ├── ARCHITECTURE_AR.md                # شرح مبسّط للمبتدئين بالعربية
│   ├── CHANGES.md                        # سجل تغييرات تاريخي
│   └── CHANGES_DOCS_PORTAL.md            # سجل تغييرات تاريخي (بوابة التوثيق)
├── eslint.config.mjs                     # إعدادات فحص جودة الكود
├── next.config.ts                        # إعدادات Next.js (بما فيها CORS)
├── package.json                          # الاعتماديات وأوامر npm
├── tsconfig.json                         # إعدادات TypeScript
├── vercel.json                           # إعدادات نشر Vercel
│
└── src/
    ├── app/                              # كل ما يخص التوجيه (routing) في Next.js
    │   ├── layout.tsx                    # التخطيط الجذري (مطلوب من Next.js)
    │   ├── page.tsx                      # الصفحة الرئيسية (معلومات بسيطة)
    │   ├── not-found.tsx                 # صفحة 404 العامة (غير API)
    │   │
    │   └── api/                          # كل نقاط الـ API (route handlers)
    │       ├── [...notfound]/
    │       │   └── route.ts              # يلتقط أي مسار API غير معروف
    │       │
    │       └── games/[game]/
    │           ├── random/route.ts          # GET عنصر عشوائي
    │           ├── random-exclude/route.ts  # GET عنصر عشوائي مع استثناء ids (منع التكرار)
    │           ├── all/route.ts             # GET كل العناصر
    │           ├── count/route.ts           # GET العدد الإجمالي
    │           └── [id]/route.ts            # GET عنصر واحد بالـ id
    │
    ├── modules/
    │   └── games/                        # كل منطق الألعاب
    │       ├── registry.ts               # يربط اسم اللعبة (slug) بوحدتها
    │       ├── quiz/                     # وحدة الكويز
    │       │   ├── quiz.service.ts       # عشوائي/عشوائي مع استثناء/بالـid/الكل/العدد
    │       │   ├── quiz.types.ts         # نوع QuizQuestion (answers: string[])
    │       │   ├── quiz.validation.ts    # التحقق من شكل سؤال الكويز
    │       │   └── index.ts              # نقطة الدخول العامة للوحدة
    │       ├── true-false/               # وحدة لعبة "صح أو خطأ"
    │       │   ├── true-false.service.ts    # نفس بنية quiz.service.ts
    │       │   ├── true-false.types.ts      # نوع TrueFalseQuestion (answer: boolean)
    │       │   ├── true-false.validation.ts # التحقق من شكل سؤال "صح أو خطأ"
    │       │   └── index.ts              # نقطة الدخول العامة للوحدة
    │       ├── riddles/                  # وحدة لعبة الألغاز
    │       │   ├── riddles.service.ts       # id مخزَّن مسبقًا في الملف (نمط true-false)
    │       │   ├── riddles.types.ts         # نوع Riddle (answers: string[])
    │       │   ├── riddles.validation.ts    # التحقق من شكل اللغز
    │       │   └── index.ts              # نقطة الدخول العامة للوحدة
    │       ├── eye/                      # وحدة لعبة "عين" (تخمين صورة)
    │       │   ├── eye.service.ts           # id مخزَّن مسبقًا في الملف (نمط true-false)
    │       │   ├── eye.types.ts             # نوع EyeItem (name: string)
    │       │   ├── eye.validation.ts        # التحقق من شكل عنصر "عين"
    │       │   └── index.ts              # نقطة الدخول العامة للوحدة
    │       └── emoji/                    # وحدة لعبة "إيموجي" (تخمين شخصية)
    │           ├── emoji.service.ts         # id مخزَّن مسبقًا في الملف (نمط true-false)
    │           ├── emoji.types.ts           # نوع EmojiQuestion (category + answers: string[])
    │           ├── emoji.validation.ts      # التحقق من شكل سؤال "إيموجي"
    │           └── index.ts              # نقطة الدخول العامة للوحدة
    │
    ├── data/
    │   ├── quiz/
    │   │   └── questions.json            # 260 سؤال كويز عربي حقيقي (id يُولَّد تلقائيًا)
    │   ├── true-false/
    │   │   └── questions.json            # 420 سؤال "صح أو خطأ" عربي حقيقي (id مخزَّن يدويًا)
    │   ├── riddles/
    │   │   └── questions.json            # 300 لغز عربي حقيقي (id مخزَّن يدويًا)
    │   ├── eye/
    │   │   └── questions.json            # 130 عنصر "عين" حقيقي (id مخزَّن يدويًا)
    │   └── emoji/
    │       └── questions.json            # 500 سؤال "إيموجي" حقيقي (id مخزَّن يدويًا)
    │
    ├── lib/                              # دوال مساعدة عامة (تخدم أي لعبة مستقبلية)
    │   ├── json-db.ts                    # طبقة قراءة ملفات JSON (خام + مع id جاهز)
    │   ├── response.ts                   # بناء استجابات موحّدة (ok/fail)
    │   └── validation.ts                 # التحقق من صحة id وقائمة ids
    │
    ├── types/
    │   ├── api.ts                        # شكل الاستجابة الموحّد
    │   └── games.ts                      # سجلّ أسماء الألعاب المسجّلة (GAME_REGISTRY)
    │
    └── config/
        └── app.ts                        # قراءة متغيرات البيئة مركزيًا
```

---

## شرح كل ملف ومجلد

### الجذر (Root)

#### `package.json`
**الغرض:** يحدد اسم المشروع، الاعتماديات، وأوامر npm (`dev`, `build`,
`lint`, `start`).
**يُستخدم بواسطة:** npm/Vercel عند التثبيت والبناء والتشغيل.

#### `tsconfig.json`
**الغرض:** إعدادات TypeScript، بما فيها اختصار المسارات `@/*` الذي
يشير إلى `src/*`.
**يُستخدم بواسطة:** أداة بناء Next.js وأي محرر كود يفهم TypeScript.

#### `next.config.ts`
**الغرض:** إعدادات Next.js، أهمها هيدرات CORS على كل `/api/*` للسماح
لأي بوت مستضاف في أي مكان بالاتصال مباشرة. الآن مضبوطة لطرق GET فقط
(كل نقاط الـ API الحالية للقراءة فقط).
**يُستخدم بواسطة:** خادم Next.js عند تشغيله.

#### `eslint.config.mjs`
**الغرض:** إعدادات فحص جودة الكود وفق قواعد Next.js الرسمية.
**يُستخدم بواسطة:** أمر `npm run lint`.

#### `vercel.json`
**الغرض:** يخبر Vercel أن هذا مشروع Next.js وبأي أوامر يبنيه وينشّطه.
**يُستخدم بواسطة:** منصة Vercel عند كل عملية نشر.

#### `.env.example`
**الغرض:** قالب لمتغيرات البيئة الاختيارية (لا يوجد أي متغير إلزامي في
هذه النسخة).
**يُستخدم بواسطة:** أي مطوّر يريد تخصيص اسم/إصدار التطبيق محليًا.

---

### `src/app/` — طبقة التوجيه (Routing)

#### `src/app/layout.tsx`
**الغرض:** التخطيط الجذري المطلوب من Next.js.
**يُستخدم بواسطة:** Next.js داخليًا لتغليف كل الصفحات.

#### `src/app/page.tsx`
**الغرض:** صفحة معلومات بسيطة تظهر عند فتح رابط المشروع مباشرة (اسم
المشروع، رقم الإصدار، روابط الكويز السريعة).
**يُستخدم بواسطة:** أي شخص يزور الرابط الرئيسي للتأكد أن الخادم شغّال.

#### `src/app/not-found.tsx`
**الغرض:** صفحة 404 لأي مسار غير API غير موجود.
**يُستخدم بواسطة:** Next.js تلقائيًا.

#### `src/app/api/[...notfound]/route.ts`
**الغرض:** يلتقط أي طلب لمسار تحت `/api/*` لا يطابق أي route حقيقي،
ويرجع خطأ JSON موحّد بدل صفحة HTML افتراضية. يغطي GET فقط، لأن كل
مسارات المشروع الحالية من نوع GET.
**يُستخدم بواسطة:** أي بوت يطلب مسار خاطئ بالغلط.

#### `src/app/api/games/[game]/random/route.ts`
**الغرض:** يرجع عنصرًا عشوائيًا واحدًا من اللعبة المحددة (حاليًا: quiz
فقط). عام (generic) ويعمل مع أي لعبة تُضاف مستقبلًا للسجلّ بدون تعديل.
**يُستخدم بواسطة:** أمر لعبة عشوائية في بوت الواتساب (مثل `!كويز`).

#### `src/app/api/games/[game]/all/route.ts`
**الغرض:** يرجع كل عناصر اللعبة كمصفوفة كاملة.
**يُستخدم بواسطة:** أوامر عرض قائمة كاملة، أو أدوات فحص المحتوى.

#### `src/app/api/games/[game]/count/route.ts`
**الغرض:** يرجع العدد الإجمالي لعناصر اللعبة (مثلًا: كم سؤال كويز
متاح). مسار جديد أُضيف في نسخة الـ MVP هذه.
**يُستخدم بواسطة:** عرض إحصائية بسيطة في البوت، أو التحقق من حجم
البيانات بعد تحديث `questions.json`.

#### `src/app/api/games/[game]/[id]/route.ts`
**الغرض:** يرجع عنصرًا واحدًا محددًا بالضبط عبر رقمه.
**يُستخدم بواسطة:** حالات تحتاج نفس السؤال بالضبط (مثل إعادة عرضه بعد
إجابة خاطئة).

#### `src/app/api/games/[game]/random-exclude/route.ts`
**الغرض:** يرجع عنصرًا عشوائيًا واحدًا، مع استثناء مجموعة من الـ id
المُمرَّرة عبر `?ids=1,2,3`. مسار جديد لدعم "منع تكرار الأسئلة" - الـ
API يبقى بلا حالة (stateless)، والبوت هو من يتتبّع الأسئلة المستخدمة
لكل مجموعة ويمرّرها هنا في كل طلب.
**يُستخدم بواسطة:** بوت الواتساب، بدلًا من `/random` العادي، عندما
يريد تجنّب تكرار سؤال استُخدم مؤخرًا في نفس المجموعة.

---

### `src/modules/games/` — منطق الألعاب

#### `src/modules/games/registry.ts`
**الغرض:** "المُبدّل" (dispatcher) المركزي الذي يربط اسم اللعبة (slug
مثل "quiz") بوحدة اللعبة الفعلية. كل route.ts في `app/api/games/`
يستدعي دوال هذا الملف فقط (`getRandomItem`, `getRandomItemExcluding`,
`getAllItems`, `getItemById`, `getItemCount`)، وهو من يقرر داخليًا أي
وحدة لعبة يستخدم. حاليًا يحتوي فرعًا واحدًا فقط (`"quiz"`) في كل دالة.
**يُستخدم بواسطة:** كل ملفات `route.ts` تحت `app/api/games/`.

#### `src/modules/games/quiz/` — وحدة الكويز الكاملة

هذه الوحدة **مستقلة تمامًا** عن أي لعبة أخرى، ولا تعرف شيئًا عن باقي
المشروع سوى الاستيراد من `lib/json-db.ts` العام. هذا النمط (module
self-contained) هو القالب الذي يجب اتّباعه لأي لعبة مستقبلية.

##### `quiz.types.ts`
**الغرض:** يعرّف شكل `QuizQuestion` (id, question, answers, category).
لاحظ أن `answers` مصفوفة نصوص (وليس نصًا مفردًا)، لدعم أكثر من إجابة
صحيحة لنفس السؤال. لا يوجد حقل `difficulty` في هذا الإصدار لأن مجموعة
البيانات الحقيقية لا تحتوي هذا الحقل. لا يحتوي أي منطق تنفيذي، فقط
تعريفات أنواع.
**يُستخدم بواسطة:** بقية ملفات وحدة الكويز، وأي كود خارجي يحتاج نوع
سؤال الكويز.

##### `quiz.validation.ts`
**الغرض:** دالة `isValidQuizQuestion` (type guard) ودالة
`validateQuizQuestion` (ترجع تفاصيل الأخطاء) للتحقق أن كائنًا قادمًا
من JSON يطابق شكل `QuizQuestion` الصحيح فعلًا: `question` نص غير فارغ،
`answers` مصفوفة نصوص غير فارغة، `category` نص غير فارغ.
**يُستخدم بواسطة:** `quiz.service.ts` أثناء تحميل البيانات، لتجاهل أي
سجل غير صالح بأمان بدل إيقاف الـ API بالكامل.

##### `quiz.service.ts`
**الغرض:** المنطق الفعلي لوحدة الكويز:
`getRandomQuestion()`, `getRandomQuestionExcluding(excludeIds)`,
`getQuestionById(id)`, `getAllQuestions()`, `getQuestionCount()`. هذا
الملف أيضًا مسؤول عن تحميل البيانات الخام من `questions.json` وتوليد
الـ `id` تلقائيًا لكل سؤال حسب ترتيبه في الملف، ثم التحقق من صحتها
وتجاهل أي سجل فاسد، مع تخزين النتيجة في ذاكرة مؤقتة (cache) لتفادي
إعادة القراءة والتوليد في كل طلب.
**يُستخدم بواسطة:** `index.ts` (يعيد تصديرها)، وبشكل غير مباشر
`registry.ts`.

##### `index.ts`
**الغرض:** نقطة الدخول العامة للوحدة - يجمع كل ما يحتاجه باقي المشروع
(الدوال الأربع + النوع + دالة التحقق) في استيراد واحد:
`import { getRandomQuestion } from "@/modules/games/quiz"`.
**يُستخدم بواسطة:** `src/modules/games/registry.ts`.

---

### `src/data/quiz/questions.json`
**الغرض:** المحتوى الفعلي - مصفوفة JSON من 260 سؤال كويز عربي حقيقي
عبر 10 تصنيفات (جغرافيا، تاريخ، علوم، فضاء، رياضة، أنمي، ألعاب فيديو،
أفلام ومسلسلات، تكنولوجيا، ثقافة عامة). **هذا هو المكان الوحيد الذي
تعدّل فيه المحتوى** (تضيف سؤالًا، تصحح إجابة...) بدون أي تعديل برمجي.
لا حاجة لكتابة `id` يدويًا عند إضافة سؤال - يُولَّد تلقائيًا حسب ترتيب
السؤال في الملف (انظر `quiz.service.ts`).
**يُستخدم بواسطة:** `quiz.service.ts` عبر `lib/json-db.ts` (تحديدًا
دالة `readRawCollection`).

---

### `src/lib/` — الأدوات المساعدة العامة

#### `src/lib/json-db.ts`
**الغرض:** "قاعدة بيانات JSON" المصغّرة العامة - تقرأ ملفات JSON بأمان
(حماية من اجتياز المسار)، مع أخطاء واضحة (NOT_FOUND، INVALID_JSON).
تحتوي `readRawCollection` (قراءة خام بدون افتراض وجود `id` جاهز -
تستخدمها وحدة الكويز لأن بياناتها الخام لا تحتوي `id`) بالإضافة لدوال
أقدم عامة (`readCollection`, `getRandomItem`, `getItemById`,
`getAllItems`) تفترض وجود `id` جاهز، متاحة لأي لعبة مستقبلية تُخزَّن
بياناتها بـ `id` جاهز من المصدر.
**يُستخدم بواسطة:** `quiz.service.ts` حاليًا (عبر `readRawCollection`)، وأي وحدة لعبة مستقبلية.

#### `src/lib/response.ts`
**الغرض:** يبني استجابات HTTP بالشكل الموحّد (`ok()`, `notFound()`,
`badRequest()`, `serverError()`).
**يُستخدم بواسطة:** كل ملفات `route.ts` في المشروع بدون استثناء.

#### `src/lib/validation.ts`
**الغرض:** `parseId` للتحقق من صحة معامل `id` القادم من الرابط (تحويله
لرقم صحيح موجب، مع رمي خطأ واضح إذا كان غير صالح)، و`parseIdsList`
لتحويل معامل استعلام مثل `?ids=1,2,3` إلى مصفوفة أرقام صحيحة (يُستخدم
في مسار `random-exclude` الجديد).
**يُستخدم بواسطة:** `app/api/games/[game]/[id]/route.ts` (`parseId`)
و`app/api/games/[game]/random-exclude/route.ts` (`parseIdsList`).

---

### `src/types/`

#### `src/types/api.ts`
**الغرض:** يحدد `ApiResponse<T>` - الشكل الموحّد (نجاح/فشل) لكل استجابة.
**يُستخدم بواسطة:** `lib/response.ts`.

#### `src/types/games.ts`
**الغرض:** `GAME_REGISTRY` - قائمة أسماء الألعاب المسجّلة فعليًا في
المشروع (حاليًا: `["quiz"]` فقط)، بالإضافة لدالة `isValidGameSlug`
للتحقق من صحة أي slug قادم من الرابط.
**يُستخدم بواسطة:** `modules/games/registry.ts`.

---

### `src/config/app.ts`
**الغرض:** المكان الوحيد الذي يُقرأ فيه `process.env` مباشرة، يصدّر
`APP_CONFIG` (اسم التطبيق، رقم الإصدار، بيئة التشغيل).
**يُستخدم بواسطة:** `src/app/page.tsx`.

---

## مسار تدفق الطلب (Request Flow)

```
المستخدم (على واتساب)
    كتب: "!كويز"
        ↓
بوت الواتساب (WhatsApp Bot، مبني بـ Baileys)
    يستقبل الأمر، يرسل طلب HTTP للـ API
        ↓
    GET https://your-api.vercel.app/api/games/quiz/random
        ↓
RayGumo API (Next.js Route Handler)
    src/app/api/games/[game]/random/route.ts يستقبل الطلب
    يستخرج "quiz" من params.game
    يستدعي getRandomItem("quiz") من modules/games/registry.ts
        ↓
    registry.ts
    يتحقق أن "quiz" مسجّل في GAME_REGISTRY (نعم)
    يستدعي quiz.getRandomQuestion() من وحدة الكويز
        ↓
    quiz.service.ts
    يستدعي readRawCollection("quiz") من lib/json-db.ts
    يولّد id تسلسليًا لكل سؤال حسب ترتيبه في الملف
    يتحقق من صحة كل سؤال عبر quiz.validation.ts
        ↓
Quiz JSON Data (طبقة التخزين)
    lib/json-db.ts يقرأ src/data/quiz/questions.json من القرص
    يحوّله من نص JSON إلى مصفوفة JavaScript
    quiz.service.ts يختار فهرسًا عشوائيًا ويرجع ذلك السؤال
        ↓
API Response (الاستجابة)
    lib/response.ts يغلّف السؤال بالشكل الموحّد:
    { "success": true, "data": { "id": 3, "question": "...", "answers": [...], ... } }
    يُرجع كـ HTTP 200
        ↓
بوت الواتساب
    يستقبل استجابة JSON، يقرأ data.question ومصفوفة data.answers
        ↓
Bot Response (رد البوت)
    يرسل السؤال كرسالة واتساب للمستخدم:
    "❓ من كتب مسرحية روميو وجولييت؟"
```

**النقطة المهمة**: RayGumo API لا يعرف شيئًا عن واتساب أو Baileys أو
المستخدم النهائي - فقط يستقبل طلب HTTP ويرجع JSON. البوت هو من يترجم
هذا الـ JSON لرسالة واتساب مفهومة.

---

## النشر على Vercel

### لماذا Vercel؟

- **بدون خوادم (Serverless)**: كل route يعمل كدالة مستقلة تُستدعى فقط
  عند وصول طلب فعلي.
- **تكامل مباشر مع Next.js**: Vercel هي الشركة المطوّرة لـ Next.js.
- **نشر تلقائي**: كل `push` لمستودع Git يُطلق نشرًا تلقائيًا.
- **مجاني للمشاريع الصغيرة**: مناسب جدًا لمشروع بحجم MVP كهذا.

### كيف يعمل النشر؟

1. تربط مستودع GitHub/GitLab بمشروع Vercel جديد (مرة واحدة فقط).
2. Vercel تكتشف تلقائيًا أنه مشروع Next.js.
3. عند كل `push`، تنفّذ: `npm install` ثم `npm run build`، ثم تنشر
   النتيجة كدوال serverless.

### كيف تُنشر تحديثات الأسئلة؟

تعدّل `src/data/quiz/questions.json` مباشرة، تعمل commit و push،
وVercel تعيد النشر تلقائيًا خلال ثوانٍ لدقائق. **لا حاجة لأي متغيرات
بيئة أو إعدادات إضافية** - هذه نسخة MVP بدون أي مصادقة أو أسرار.

**تنبيه مهم**: نظام ملفات Vercel في بيئة الإنتاج **للقراءة فقط**. أي
محاولة لتعديل ملف JSON وقت التشغيل ستفشل. التحديث الوحيد الموثوق هو
عبر `git push` جديد.

---

## نظام تخزين JSON

### أين تُخزَّن بيانات الكويز؟

```
src/data/quiz/questions.json
```

ملف واحد فقط - مصفوفة JSON، كل عنصر بداخلها كائن (object) بالشكل:

```json
{
  "id": 1,
  "question": "",
  "answers": [""],
  "category": ""
}
```

لاحظ أن `answers` مصفوفة نصوص دائمًا (حتى لو كانت تحتوي إجابة واحدة
فقط)، وأن `id` لا يُكتَب يدويًا في الملف - يُولَّد تلقائيًا عند
التحميل حسب ترتيب كل سؤال (انظر القسم التالي).

### كيف تُقرأ؟

`src/lib/json-db.ts` مسؤولة عن القراءة الخام الآمنة، و`quiz.service.ts`
مسؤولة عن توليد الـ `id` والتحقق من الصحة بعدها. عند استدعاء
`getRandomQuestion()` من وحدة الكويز:

1. تبني المسار الآمن: `src/data/quiz/questions.json`.
2. تقرأ محتوى الملف كنص من القرص عبر `readRawCollection`.
3. تحوّله من نص إلى JavaScript عبر `JSON.parse`.
4. تتأكد أنه مصفوفة فعلًا (وإلا خطأ واضح).
5. تولّد `id` تسلسليًا لكل عنصر حسب ترتيبه (1، 2، 3...).
6. تتحقق من صحة كل عنصر (`question`/`answers`/`category`) وتتجاهل أي
   عنصر غير صالح بأمان.
7. تخزّن النتيجة في ذاكرة مؤقتة (cache) داخل العملية، ثم تختار عنصرًا
   عشوائيًا منها وترجعه.

القراءة والتوليد والتحقق تحدث مرة واحدة فقط لكل عملية تشغيل (lambda
instance) بفضل الذاكرة المؤقتة، وليس في كل طلب على حدة.

---

## دليل تكامل الكويز (Quiz Integration Guide)

### كيف تضيف أسئلة جديدة؟

افتح `src/data/quiz/questions.json` وأضف كائنًا جديدًا في نهاية
المصفوفة - **بدون** حقل `id` (يُولَّد تلقائيًا حسب ترتيب السؤال في
الملف):

```json
{
  "question": "كم عدد قارات العالم؟",
  "answers": ["سبع قارات", "سبعة"],
  "category": "جغرافيا"
}
```

احفظ، اعمل commit و push - هذا كل ما تحتاجه. لاحظ أن `answers` مصفوفة
حتى لو كانت تحتوي إجابة واحدة فقط، ويمكن أن تحتوي أكثر من إجابة مقبولة
لنفس السؤال.

### كيف تستبدل questions.json بالكامل بمجموعة أسئلتك الحقيقية؟

1. جهّز ملف JSON جديد بنفس الشكل تمامًا: مصفوفة من كائنات، كل كائن فيه
   `question` (نص)، `answers` (مصفوفة نصوص غير فارغة)، و`category`
   (نص). لا حاجة لكتابة `id` - يُولَّد تلقائيًا حسب الترتيب.
2. استبدل محتوى `src/data/quiz/questions.json` بالكامل بملفك الجديد.
3. تأكد أن الملف JSON صالح التركيب (مصفوفة صحيحة، بدون فواصل ناقصة أو
   زائدة).
4. اعمل commit و push - Vercel تعيد النشر تلقائيًا.
5. اختبر: `curl https://your-api.vercel.app/api/games/quiz/count` للتأكد
   أن العدد الجديد صحيح.

أي سجل ناقص أو غير صالح في الملف الجديد **لن يوقف الـ API بالكامل** -
سيُتجاهَل بأمان أثناء التحميل ولن يظهر في أي استجابة.

**نصيحة**: قبل الاستبدال، تحقق أن ملفك JSON صالح (مثلًا عبر أداة أونلاين
لفحص JSON، أو `python3 -c "import json; json.load(open('questions.json'))"`)
حتى لا يفشل النشر بسبب خطأ نحوي بسيط.

### كيف يجب أن يستدعي البوت الـ API؟

مثال بسيط بلغة JavaScript (كما قد يُستخدم داخل بوت Baileys)، مع دعم
منع التكرار عبر `random-exclude`:

```js
// usedIds: مصفوفة id الأسئلة المستخدمة سابقًا لهذه المجموعة (يديرها البوت بنفسه)
async function getRandomQuizQuestion(usedIds = []) {
  const idsParam = usedIds.length ? `?ids=${usedIds.join(",")}` : "";
  const response = await fetch(
    `https://your-api.vercel.app/api/games/quiz/random-exclude${idsParam}`
  );
  const result = await response.json();

  if (!result.success) {
    if (result.code === "NOT_FOUND") {
      // كل الأسئلة استُخدمت - صفّر القائمة وحاول مجددًا
      return getRandomQuizQuestion([]);
    }
    console.error("Quiz API error:", result.message);
    return null;
  }

  return result.data; // { id, question, answers, category }
}
```

### أمثلة على طلبات API

```bash
# سؤال عشوائي
curl https://your-api.vercel.app/api/games/quiz/random

# سؤال عشوائي مع استثناء أسئلة مستخدمة سابقًا (منع التكرار)
curl "https://your-api.vercel.app/api/games/quiz/random-exclude?ids=1,2,3"

# كل الأسئلة
curl https://your-api.vercel.app/api/games/quiz/all

# العدد الإجمالي
curl https://your-api.vercel.app/api/games/quiz/count

# سؤال محدد بالـ id
curl https://your-api.vercel.app/api/games/quiz/3
```

### أمثلة على استجابات API

**نجاح - سؤال عشوائي:**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "question": "في أي قارة تقع البرازيل؟",
    "answers": ["أمريكا الجنوبية"],
    "category": "جغرافيا"
  }
}
```

**نجاح - العدد الإجمالي:**

```json
{
  "success": true,
  "data": { "count": 260 }
}
```

**فشل - id غير موجود:**

```json
{
  "success": false,
  "message": "No item with id 999 in \"quiz\"",
  "code": "NOT_FOUND"
}
```

**فشل - id غير صالح (مثل نص بدل رقم):**

```json
{
  "success": false,
  "message": "Invalid id parameter: \"abc\"",
  "code": "BAD_REQUEST"
}
```

---

## إضافة لعبة جديدة مستقبلًا

المعمارية جاهزة تمامًا لإضافة ألعاب جديدة بدون تغيير بنية روابط الـ
API. الألعاب المسجّلة حاليًا هي `quiz`، `true-false`، `riddles` (ألغاز)،
`eye` (عين)، `emoji` (خمّن الشخصية من الإيموجي)، `character-guess`
(خمّن الشخصية من الوصف)، و`sort` (رتب) — وكل من `riddles`، `eye`،
`emoji`، `character-guess`، و`sort` أُضيفت بالفعل بنفس الخطوات الموضّحة
هنا، فيمكن اعتبار أيّ منها مثالًا حيًا كاملًا. لإضافة لعبة جديدة أخرى (مثال: `anime`):

### الخطوة 1: أنشئ وحدة اللعبة الجديدة

أنشئ `src/modules/games/anime/` بنفس نمط `quiz/` أو `true-false/` أو
`riddles/` بالضبط:

```
anime/
├── anime.service.ts     # getRandomX, getXById, getAllX, getXCount, getRandomXExcluding
├── anime.types.ts       # نوع العنصر (Anime مثلًا)
├── anime.validation.ts  # isValidAnime
└── index.ts              # نقطة الدخول العامة
```

> ملاحظة: وحدة `riddles` الفعلية في المشروع الآن (`src/modules/games/riddles/`)
> تتبع بالضبط نمط `true-false` — أي أن `id` مخزَّن مسبقًا ومرقّم داخل
> `questions.json` نفسه، وليس مولَّدًا تلقائيًا بالترتيب كما في الكويز.
> اختاري النمط المناسب (`quiz`-style أو `true-false`/`riddles`-style)
> حسب طبيعة بياناتك.

### الخطوة 2: أنشئ ملف بيانات اللعبة

```
src/data/anime/questions.json
```

بمصفوفة عناصر بنفس نمط الكويز أو الألغاز.

### الخطوة 3: سجّل اللعبة في `types/games.ts`

```ts
export const GAME_REGISTRY = ["quiz", "true-false", "riddles", "eye", "emoji", "anime"] as const;
```

### الخطوة 4: اربطها في `modules/games/registry.ts`

أضف فرعًا جديدًا `"anime"` في كل دالة من الدوال الخمس (بما فيها
`getRandomItemExcluding` لدعم منع التكرار في اللعبة الجديدة أيضًا):

```ts
import * as anime from "./anime";

export async function getRandomItem(slug: string) {
  assertValidSlug(slug);
  switch (slug) {
    case "quiz":
      return quiz.getRandomQuestion();
    case "true-false":
      return trueFalse.getRandomQuestion();
    case "riddles":
      return riddles.getRandomRiddle();
    case "eye":
      return eye.getRandomEyeItem();
    case "emoji":
      return emoji.getRandomEmojiQuestion();
    case "anime":
      return anime.getRandomX();
  }
}
```

(وبنفس الطريقة لـ `getRandomItemExcluding`, `getAllItems`, `getItemById`, `getItemCount`)

### الخطوة 5: لا حاجة لأي route جديد!

`/api/games/anime/random`, `/random-exclude`, `/all`, `/count`, و
`/[id]` تعمل تلقائيًا بمجرد إتمام الخطوات أعلاه - بنفس ملفات
`route.ts` الموجودة فعلًا تحت `app/api/games/[game]/`.

### الخطوة 6 (اختيارية): رابط مختصر بدون `/games/`

لو حابة رابطًا مختصرًا زي `/api/anime/...` (بدل `/api/games/anime/...`)،
تقدري تضيفي قاعدتي `rewrite` في `next.config.ts`:

```ts
async rewrites() {
  return [
    { source: "/api/anime/:path*", destination: "/api/games/anime/:path*" },
    { source: "/api/anime", destination: "/api/games/anime" },
  ];
},
```

هذا اختياري تمامًا - كل الألعاب تعمل بشكل كامل عبر `/api/games/[game]/...`
بدون أي حاجة لرابط مختصر.

---

## متغيرات البيئة

| المتغيّر | إلزامي؟ | الشرح |
|---|---|---|
| `NEXT_PUBLIC_API_NAME` | لا | الاسم الظاهر في الصفحة الرئيسية. القيمة الافتراضية: `RayGumo API`. |
| `API_VERSION` | لا | رقم الإصدار (معلوماتي فقط حاليًا). القيمة الافتراضية: `1.0.0`. |

لا توجد أي متغيرات إلزامية في هذه النسخة - لا مصادقة، لا مفاتيح API
خارجية. المشروع يعمل مباشرة بدون أي إعداد إضافي.

---

## جدول كل نقاط الـ API

| Endpoint | Method | الوصف |
|---|---|---|
| `/api/games/quiz/random` | GET | يرجع سؤال كويز عشوائي واحد |
| `/api/games/quiz/random-exclude?ids=1,2,3` | GET | سؤال كويز عشوائي مع استثناء ids (anti-repeat) |
| `/api/games/quiz/all` | GET | يرجع كل أسئلة الكويز |
| `/api/games/quiz/count` | GET | يرجع العدد الإجمالي لأسئلة الكويز |
| `/api/games/quiz/:id` | GET | يرجع سؤال كويز واحد محدد بواسطة id |
| `/api/games/true-false/random` | GET | يرجع سؤال "صح أو خطأ" عشوائي واحد |
| `/api/games/true-false/random-exclude?ids=1,2,3` | GET | سؤال "صح أو خطأ" عشوائي مع استثناء ids |
| `/api/games/true-false/all` | GET | يرجع كل أسئلة "صح أو خطأ" |
| `/api/games/true-false/count` | GET | يرجع العدد الإجمالي لأسئلة "صح أو خطأ" |
| `/api/games/true-false/:id` | GET | يرجع سؤال "صح أو خطأ" واحد محدد بواسطة id |
| `/api/games/riddles/random` | GET | يرجع لغزًا عشوائيًا واحدًا |
| `/api/games/riddles/random-exclude?ids=1,2,3` | GET | لغز عشوائي مع استثناء ids (anti-repeat) |
| `/api/games/riddles/all` | GET | يرجع كل الألغاز |
| `/api/games/riddles/count` | GET | يرجع العدد الإجمالي للألغاز |
| `/api/games/riddles/:id` | GET | يرجع لغزًا واحدًا محددًا بواسطة id |
| `/api/games/eye/random` | GET | يرجع عنصر "عين" عشوائيًا واحدًا (صورة) |
| `/api/games/eye/random-exclude?ids=1,2,3` | GET | عنصر "عين" عشوائي مع استثناء ids (anti-repeat) |
| `/api/games/eye/all` | GET | يرجع كل عناصر "عين" |
| `/api/games/eye/count` | GET | يرجع العدد الإجمالي لعناصر "عين" |
| `/api/games/eye/:id` | GET | يرجع عنصر "عين" واحدًا محددًا بواسطة id |
| `/api/games/emoji/random` | GET | يرجع سؤال "إيموجي" عشوائيًا واحدًا |
| `/api/games/emoji/random-exclude?ids=1,2,3` | GET | سؤال "إيموجي" عشوائي مع استثناء ids (anti-repeat) |
| `/api/games/emoji/all` | GET | يرجع كل أسئلة "إيموجي" |
| `/api/games/emoji/count` | GET | يرجع العدد الإجمالي لأسئلة "إيموجي" |
| `/api/games/emoji/:id` | GET | يرجع سؤال "إيموجي" واحدًا محددًا بواسطة id |
| `/api/*` (أي مسار آخر) | GET | 404 بشكل JSON موحّد |

---

## معالجة الأخطاء

المشروع يتعامل مع هذه الحالات بشكل واضح، ويرجع دائمًا شكل الخطأ الموحّد:

- **ملف مفقود**: إذا لم يوجد `questions.json`، تُرمى `NOT_FOUND`.
- **JSON غير صالح**: إذا كان محتوى الملف نصًا غير صالح كـ JSON أو ليس
  مصفوفة، تُرمى `INVALID_JSON`.
- **id غير صالح**: قيم `:id` غير رقمية أو غير موجبة تُرفض بـ
  `400 BAD_REQUEST` قبل حتى محاولة قراءة البيانات.
- **مجموعة بيانات فارغة**: طلب `random` على مجموعة فارغة يرجع
  `404 NOT_FOUND` بدل أن ينهار الكود.
- **لعبة غير معروفة**: أي `[game]` غير موجود في `GAME_REGISTRY` يرجع
  `404 NOT_FOUND`.
- **مسار غير معروف**: أي طلب تحت `/api/*` لا يطابق route معرّف يرجع
  `404` عبر المعالج الشامل، بشكل JSON (وليس صفحة HTML افتراضية).

---

## دليل التطوير

### `npm install`

يثبّت كل الاعتماديات المذكورة في `package.json`.

### `npm run dev`

يشغّل خادم التطوير المحلي على `http://localhost:3000` مع إعادة تحميل
تلقائي عند أي تعديل.

### `npm run build`

يبني نسخة الإنتاج - يفحص أخطاء TypeScript، يحسّن الكود، يجهّزه للنشر.
Vercel تنفّذ هذا تلقائيًا عند كل نشر.

### `npm run lint`

يفحص جودة الكود وفق قواعد ESLint. يُفضَّل تشغيله قبل أي commit.

### `npm run start`

يشغّل نسخة الإنتاج المبنية مسبقًا محليًا، لاختبار سلوك الإنتاج الحقيقي.
