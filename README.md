# RayGumo API

**API خفيف وقابل للتوسّع لمحتوى الألعاب (Game Content API)**، مبني بـ **Next.js 16 (App Router) + TypeScript**، مصمَّم لتقديم محتوى الألعاب لبوتات الواتساب (المبنية على Baileys) وأي مواقع مستقبلية من نشر واحد فقط.

هذا المشروع في مرحلة **MVP (نسخة أولية قابلة للاستخدام)**. حاليًا يقدّم أربع ألعاب — **Quiz (كويز)**، **True or False (صح أو خطأ)**، **Riddles (ألغاز)**، و**Eye (عين)** — والبنية المعمارية مصمَّمة عمدًا بحيث إضافة ألعاب جديدة مستقبلًا (تخمين أنمي، تخمين شخصيات...) لا تتطلب أي تعديل في بنية routes الـ API، بل فقط وحدات ألعاب جديدة مستقلة بذاتها.

RayGumo API هو **مزوّد محتوى فقط** — هو **لا** يدير حسابات اللاعبين، نقاط الخبرة (XP)، المستويات، الترتيب (rankings)، أو المواسم. هذا المنطق مسؤولية كل بوت على حدة.

لا حاجة لقاعدة بيانات. كل المحتوى موجود في ملف JSON داخل المشروع نفسه.

> 🤖 **مبرمج بوت واتساب وعايز تستخدم الـ API بسرعة؟**
> روحي مباشرة لمجلد [`docs/`](./docs/) — فيه دليل استخدام كامل لكل لعبة على حدة ([`docs/quiz.md`](./docs/quiz.md)، [`docs/true-false.md`](./docs/true-false.md)، [`docs/riddles.md`](./docs/riddles.md)، و[`docs/eye.md`](./docs/eye.md))، فيه بس الـ endpoints وأمثلة Baileys الجاهزة للنسخ، من غير أي تفاصيل معمارية داخلية. هذا الملف (`README.md`) للمطوّرين اللي بيشتغلوا على المشروع نفسه.
>
> 📚 **شرح تفصيلي إضافي عن معمارية المشروع** (للمساهمين في الكود) موجود في مجلد [`info/`](./info/).

---

## جدول المحتويات

- [التقنيات المستخدمة](#التقنيات-المستخدمة)
- [بنية المجلدات](#بنية-المجلدات)
- [التثبيت](#التثبيت)
- [التشغيل المحلي](#التشغيل-المحلي)
- [متغيرات البيئة](#متغيرات-البيئة)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [مرجع الـ API](#مرجع-الـ-api)
- [بيانات الكويز](#بيانات-الكويز)
- [بيانات صح أو خطأ](#بيانات-صح-أو-خطأ)
- [Riddles API (ألغاز)](#riddles-api-ألغاز)
- [Eye API (عين)](#eye-api-عين)
- [إضافة لعبة جديدة](#إضافة-لعبة-جديدة)
- [التعامل مع الأخطاء](#التعامل-مع-الأخطاء)
- [النشر على Vercel](#النشر-على-vercel)

---

## التقنيات المستخدمة

- Next.js 16+ (App Router, Route Handlers)
- TypeScript (وضع strict)
- ESLint (`next/core-web-vitals`, `next/typescript`)
- بدون قاعدة بيانات خارجية — تخزين عبر ملف JSON مسطّح
- بدون أي متغيرات بيئة إلزامية — يعمل فورًا من غير إعدادات

---

## بنية المجلدات

على مستوى جذر المشروع، التوثيق مقسّم في مجلدين منفصلين حسب الجمهور المستهدف:

- **[`docs/`](./docs/)** — دليل استخدام كل لعبة/API على حدة (endpoints، أمثلة طلبات واستجابات، تكامل Baileys جاهز). موجّه لمبرمجي البوتات اللي بيستهلكوا الـ API فقط.
- **[`info/`](./info/)** — شرح معماري تفصيلي للمشروع (بنية الكود، تدفّق البيانات، سجل التغييرات). موجّه للمطوّرين اللي بيشتغلوا على كود المشروع نفسه.
- **`README.md`** (هذا الملف) — نظرة عامة سريعة ومرجع مختصر لكل شيء، مع روابط للتفاصيل الكاملة في `docs/` و`info/`.

```
src/
├── app/
│   ├── page.tsx                  # صفحة هبوط/معلومات بسيطة
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── api/
│       ├── [...notfound]/        # معالج شامل -> يرجّع JSON 404 لأي مسار API غير موجود
│       └── games/[game]/
│           ├── random/route.ts          # GET عنصر عشوائي
│           ├── random-exclude/route.ts  # GET عنصر عشوائي مع استثناء ids معيّنة (anti-repeat)
│           ├── all/route.ts             # GET كل العناصر
│           ├── count/route.ts           # GET إجمالي عدد العناصر
│           └── [id]/route.ts            # GET عنصر واحد بواسطة id
│
├── modules/
│   └── games/
│       ├── registry.ts           # يربط اسم اللعبة (slug) بوحدتها (dispatcher)
│       ├── quiz/                 # وحدة لعبة الكويز (مستقلة بذاتها)
│       │   ├── quiz.service.ts   # getRandomQuestion / getRandomQuestionExcluding / getQuestionById / getAllQuestions / getQuestionCount
│       │   ├── quiz.types.ts     # نوع QuizQuestion (answers: string[])
│       │   ├── quiz.validation.ts# isValidQuizQuestion / validateQuizQuestion
│       │   └── index.ts          # نقطة الدخول العامة للوحدة
│       ├── true-false/           # وحدة لعبة "صح أو خطأ" (مستقلة بذاتها)
│       │   ├── true-false.service.ts    # نفس دوال quiz.service.ts بالضبط
│       │   ├── true-false.types.ts      # نوع TrueFalseQuestion (answer: boolean)
│       │   ├── true-false.validation.ts # isValidTrueFalseQuestion / validateTrueFalseQuestion
│       │   └── index.ts          # نقطة الدخول العامة للوحدة
│       ├── riddles/              # وحدة لعبة الألغاز (مستقلة بذاتها)
│       │   ├── riddles.service.ts    # getRandomRiddle / getRandomRiddleExcluding / getRiddleById / getAllRiddles / getRiddleCount
│       │   ├── riddles.types.ts      # نوع Riddle (answers: string[])
│       │   ├── riddles.validation.ts # isValidRiddle / validateRiddle
│       │   └── index.ts          # نقطة الدخول العامة للوحدة
│       └── eye/                  # وحدة لعبة "عين" (مستقلة بذاتها)
│           ├── eye.service.ts    # getRandomEyeItem / getRandomEyeItemExcluding / getEyeItemById / getAllEyeItems / getEyeItemCount
│           ├── eye.types.ts      # نوع EyeItem (img, name: string مفرد)
│           ├── eye.validation.ts # isValidEyeItem / validateEyeItem
│           └── index.ts          # نقطة الدخول العامة للوحدة
│
├── data/
│   ├── quiz/
│   │   └── questions.json        # محتوى الكويز الفعلي
│   ├── true-false/
│   │   └── questions.json        # محتوى "صح أو خطأ" الفعلي
│   ├── riddles/
│   │   └── questions.json        # محتوى الألغاز الفعلي (300 لغز)
│   └── eye/
│       └── questions.json        # محتوى "عين" الفعلي (130 عنصرًا)
│
├── lib/
│   ├── json-db.ts                # طبقة تخزين JSON عامة (تُستخدم من أي وحدة لعبة)
│   ├── response.ts                # ok() / notFound() / badRequest() / serverError()
│   └── validation.ts              # parseId() / parseIdsList()
│
├── types/
│   ├── api.ts                     # أنواع ApiResponse<T>
│   └── games.ts                   # GAME_REGISTRY (قائمة أسماء الألعاب المسجّلة)
│
└── config/
    └── app.ts                     # APP_CONFIG من متغيرات البيئة

docs/                              # دليل استخدام الـ API لكل لعبة (لمبرمجي البوتات)
├── quiz.md
├── true-false.md
├── riddles.md
└── eye.md

info/                              # شرح معماري تفصيلي (للمساهمين في الكود)
├── ARCHITECTURE_AR.md
├── PROJECT_GUIDE_AR.md
├── CHANGES.md
└── CHANGES_DOCS_PORTAL.md
```

---

## التثبيت

يتطلب Node.js 20.9+ (متطلب Next.js 16).

```bash
git clone <your-repo-url> raygumo-api
cd raygumo-api
npm install
```

لا حاجة لأي متغيرات بيئة لتشغيل المشروع — راجع [متغيرات البيئة](#متغيرات-البيئة) أدناه.

---

## التشغيل المحلي

```bash
npm run dev
```

الـ API هيكون متاح على `http://localhost:3000`. جرّبي:

```bash
curl http://localhost:3000/api/games/quiz/random
```

أوامر أخرى مفيدة:

```bash
npm run build   # بناء نسخة الإنتاج
npm run start   # تشغيل نسخة الإنتاج محليًا
npm run lint    # تشغيل ESLint
```

---

## متغيرات البيئة

| المتغيّر                | إلزامي؟ | الوصف                                                   |
|--------------------------|----------|-----------------------------------------------------------------|
| `NEXT_PUBLIC_API_NAME`   | لا       | الاسم الظاهر في صفحة الهبوط. القيمة الافتراضية `RayGumo API`. |
| `API_VERSION`            | لا       | نص رقم الإصدار، حاليًا معلوماتي فقط. القيمة الافتراضية `1.0.0`. |

هذا كل شيء — هذه النسخة الأولية بدون أي مصادقة (authentication)، بدون مفاتيح API خارجية، وبدون أي إعدادات إلزامية. انسخي `.env.example` إلى `.env.local` فقط لو عايزة تغيّري القيم الافتراضية فوق.

---

## شكل الاستجابة الموحّد

كل endpoint بيرجّع واحد من شكلين فقط.

**نجاح:**

```json
{
  "success": true,
  "data": { }
}
```

**خطأ:**

```json
{
  "success": false,
  "message": "Human readable error message",
  "code": "NOT_FOUND"
}
```

`code` اختياري لكنه موجود في كل الأخطاء اللي بتمر عبر دوال `lib/response.ts` المشتركة (`NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_ERROR`).

---

## مرجع الـ API

كل الـ endpoints الحالية تستخدم اسم اللعبة `[game]`. حاليًا `quiz` و`true-false` و`riddles` و`eye` هي الألعاب الأربع المسجّلة (راجعي `src/types/games.ts`). كل الأمثلة تحت مبنية على `quiz`، لكن نفس الروابط والشكل تنطبق حرفيًا على `true-false` و`riddles` و`eye` (فقط استبدلي `quiz` باسم اللعبة المطلوبة في المسار).

> 🔗 راجعي قسم [Riddles API (ألغاز)](#riddles-api-ألغاز) أو [Eye API (عين)](#eye-api-عين) بالأسفل للتفاصيل الكاملة عن كل endpoints هاتين اللعبتين.

| المسار (Endpoint) | Method | الوصف |
|---|---|---|
| `/api/games/:game/random` | GET | ترجّع عنصر عشوائي واحد من اللعبة المحددة |
| `/api/games/:game/random-exclude?ids=1,2,3` | GET | ترجّع عنصر عشوائي واحد مع استثناء الـ ids الممرّرة (anti-repeat) |
| `/api/games/:game/all` | GET | ترجّع كل عناصر اللعبة المحددة |
| `/api/games/:game/count` | GET | ترجّع العدد الإجمالي لعناصر اللعبة |
| `/api/games/:game/:id` | GET | ترجّع عنصر واحد بواسطة رقمه (id) |

### `GET /api/games/quiz/random`

```bash
curl http://localhost:3000/api/games/quiz/random
```

```json
{
  "success": true,
  "data": {
    "id": 3,
    "question": "ما عاصمة اليابان؟",
    "answers": ["طوكيو"],
    "category": "جغرافيا"
  }
}
```

### `GET /api/games/quiz/random-exclude`

ترجّع سؤال عشوائي واحد، مع استثناء أي ids ممرّرة في معامل الاستعلام `ids` (مفصولة بفواصل). الـ API نفسه بلا حالة (stateless) تمامًا ولا **يتذكر** أي أسئلة سبق تقديمها — بوت الواتساب هو المسؤول عن تتبّع أرقام الأسئلة المستخدمة لكل مجموعة/جلسة وتمريرها في كل طلب.

```bash
curl "http://localhost:3000/api/games/quiz/random-exclude?ids=1,2,3,4,5"
```

```json
{
  "success": true,
  "data": {
    "id": 42,
    "question": "من هو مخترع المصباح الكهربائي؟",
    "answers": ["توماس إديسون", "إديسون"],
    "category": "علوم"
  }
}
```

لو `ids` غير موجود أو فارغ، السلوك بيبقى مطابق تمامًا لـ `/random`. لو كل الأسئلة المتاحة استُثنيت (البوت استخدمها كلها)، الـ endpoint بيرجّع خطأ `404 NOT_FOUND` بدل ما يكرر سؤال بصمت — البوت المفروض يصفّر قائمة الأسئلة المستخدمة لتلك المجموعة عند رؤية هذا الخطأ ويحاول تاني.

```json
{
  "success": false,
  "message": "لا يوجد أي سؤال متبقٍ بعد استثناء كل الأسئلة المُمرَّرة (كل الأسئلة استُخدمت بالفعل)",
  "code": "NOT_FOUND"
}
```

### `GET /api/games/quiz/all`

```bash
curl http://localhost:3000/api/games/quiz/all
```

ترجّع مصفوفة `questions.json` كاملة (260 سؤال) داخل الشكل الموحّد.

### `GET /api/games/quiz/count`

```bash
curl http://localhost:3000/api/games/quiz/count
```

```json
{
  "success": true,
  "data": { "count": 260 }
}
```

### `GET /api/games/quiz/:id`

```bash
curl http://localhost:3000/api/games/quiz/2
```

```json
{
  "success": true,
  "data": {
    "id": 2,
    "question": "في أي قارة تقع البرازيل؟",
    "answers": ["أمريكا الجنوبية"],
    "category": "جغرافيا"
  }
}
```

أي `:game` غير مسجّل وأي `:id` مفقود/غير صالح، الاتنين بيرجّعوا خطأ في الشكل الموحّد (`404` و`400` على الترتيب).

### `GET /api/games/true-false/random`

نفس شكل ومنطق `/api/games/quiz/random` تمامًا، لكن كل عنصر بييجي بحقل `answer` منطقي (boolean) بدل `answers` كمصفوفة نصوص.

```bash
curl http://localhost:3000/api/games/true-false/random
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "question": "الأرض هي الكوكب الثالث من حيث البعد عن الشمس.",
    "answer": true,
    "category": "فضاء"
  }
}
```

نفس الأمر ينطبق حرفيًا على باقي endpoints اللعبة: `/api/games/true-false/random-exclude?ids=1,2,3`، `/api/games/true-false/all`، `/api/games/true-false/count`، و`/api/games/true-false/:id` — فقط استبدلي `quiz` بـ `true-false` في أي مثال أعلاه.

---

## بيانات الكويز

> للتوثيق الكامل والمفصّل لهذه اللعبة (كل الـ endpoints، أمثلة كاملة، تكامل Baileys جاهز، والتحقق من الإجابة) راجعي [`docs/quiz.md`](./docs/quiz.md).

محتوى الكويز موجود في ملف واحد:

```
src/data/quiz/questions.json
```

عبارة عن مصفوفة JSON فيها 260 سؤال كويز حقيقي بالعربي موزّعين على 10 تصنيفات (جغرافيا، تاريخ، علوم، فضاء، رياضة، أنمي، ألعاب فيديو، أفلام ومسلسلات، تكنولوجيا، ثقافة عامة). كل سؤال مطابق للـ schema ده:

```json
{
  "id": 1,
  "question": "ما عاصمة اليابان؟",
  "answers": ["طوكيو"],
  "category": "جغرافيا"
}
```

- `id` — رقم صحيح موجب فريد. **يتولّد تلقائيًا وقت التحميل** حسب ترتيب السؤال في الملف (السؤال الأول → `id: 1`، الثاني → `id: 2`، وهكذا). مش محتاجة تضيفي أو تديري ids يدويًا في ملف الـ JSON — فقط ضيفي أسئلة جديدة للملف وهيتحدد لها id تلقائيًا وبشكل ثابت في كل تحميل.
- `question` — نص السؤال. دعم كامل لـ UTF-8/العربي.
- `answers` — **مصفوفة نصوص**، مش نص واحد. السؤال ممكن يقبل أكتر من إجابة صحيحة (زي تهجئتين مختلفتين لنفس الاسم). دايمًا تعاملي معاها كمصفوفة في البوت، حتى لو السؤال ليه إجابة واحدة بس.
- `category` — تصنيف حر للموضوع (زي `"جغرافيا"`, `"علوم"`).

أي سجل ناقص فيه `question` أو `answers` (كمصفوفة غير فارغة من نصوص غير فارغة) أو `category` بيتجاهل تلقائيًا وقت التحميل ومش هيظهر في أي endpoint — مش هيكسر الـ API.

مجموعة البيانات دي هي المصدر الوحيد للحقيقة: مفيش أي أسئلة تجريبية/placeholder في المشروع دلوقتي. لتحديث المحتوى: عدّلي `src/data/quiz/questions.json`، اعملي commit، وارفعي (redeploy) — بدون أي تعديل كود.

### نمط مقترح لتكامل البوت (anti-repeat)

بما إن الـ API بلا حالة، استخدمي النمط ده في بوت الواتساب عشان تتفادي تكرار الأسئلة داخل نفس المجموعة:

1. احتفظي بقائمة لكل مجموعة لأرقام الأسئلة المستخدمة (في قاعدة بيانات/ذاكرة البوت نفسه).
2. نادي على `GET /api/games/quiz/random-exclude?ids=<الأرقام المستخدمة مفصولة بفواصل>` بدل `/random` العادي.
3. ضيفي `id` السؤال المُرجَع لقائمة الأرقام المستخدمة لتلك المجموعة.
4. لو الـ endpoint رجّع `404 NOT_FOUND` (كل الأسئلة اتستنفدت)، صفّري قائمة الأرقام المستخدمة لتلك المجموعة ونادي تاني.

أكواد جاهزة كاملة لهذا النمط (وباقي أمثلة التكامل مع Baileys) موجودة في [`docs/quiz.md`](./docs/quiz.md).

---

## بيانات صح أو خطأ

> للتوثيق الكامل والمفصّل لهذه اللعبة (كل الـ endpoints، أمثلة كاملة، نظام الـ id، وحالات الأخطاء) راجعي [`docs/true-false.md`](./docs/true-false.md).

محتوى لعبة "صح أو خطأ" موجود في ملف واحد:

```
src/data/true-false/questions.json
```

عبارة عن مصفوفة JSON فيها 420 سؤال "صح أو خطأ" حقيقي بالعربي موزّعين على عدة تصنيفات (علوم، تاريخ، فضاء، جغرافيا، حيوانات، نباتات، تقنية، رياضة، أنمي، ألعاب، ثقافة عامة، كيمياء، أفلام ومسلسلات، جيولوجيا، محيطات، اختراعات، أدب، فنون). كل سؤال مطابق للـ schema ده:

```json
{
  "id": 1,
  "question": "الأرض هي الكوكب الثالث من حيث البعد عن الشمس.",
  "answer": true,
  "category": "فضاء"
}
```

- `id` — رقم صحيح موجب فريد. **مخزَّن يدويًا داخل كل سؤال في الملف نفسه** (على عكس الكويز حيث يُولَّد تلقائيًا حسب الترتيب). عند إضافة أسئلة جديدة، لازم تديّي كل سؤال `id` فريدًا لم يُستخدم من قبل (عادة: أكبر `id` موجود حاليًا + 1). التفاصيل الكاملة وسبب هذا الاختيار في [`docs/true-false.md`](./docs/true-false.md#نظام-الـ-id).
- `question` — نص العبارة المطلوب تحديد صحتها. دعم كامل لـ UTF-8/العربي.
- `answer` — **قيمة منطقية (boolean) واحدة**: `true` (العبارة صحيحة) أو `false` (العبارة خاطئة). على عكس الكويز، هذا الحقل ليس مصفوفة.
- `category` — تصنيف حر للموضوع (زي `"فضاء"`, `"علوم"`).

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `question` أو `answer` (لازم يكون `true`/`false` فعليًا، مش نص "true" أو رقم) أو `category` بيتجاهل تلقائيًا وقت التحميل ومش هيظهر في أي endpoint — مش هيكسر الـ API. لو اتكرر نفس الـ `id` بين سؤالين، أول سؤال بيفوز والباقي بيتجاهل مع تحذير في الـ logs.

لتحديث المحتوى: عدّلي `src/data/true-false/questions.json`، اعملي commit، وارفعي (redeploy) — بدون أي تعديل كود.

### نظام منع التكرار (anti-repeat)

نفس نمط الكويز بالضبط — استخدمي `GET /api/games/true-false/random-exclude?ids=1,2,3` بدل `/random` العادي، وتتبّعي أرقام الأسئلة (`id`) المستخدمة لكل مجموعة في البوت نفسه. راجعي قسم [نمط مقترح لتكامل البوت](#نمط-مقترح-لتكامل-البوت-anti-repeat) أعلاه للتفاصيل الكاملة — نفس الخطوات تنطبق حرفيًا هنا.

---

## Riddles API (ألغاز)

> للتوثيق الكامل والمفصّل لهذه اللعبة (كل الـ endpoints، أمثلة كاملة، تكامل Baileys جاهز، وشرح `random-exclude`) راجعي [`docs/riddles.md`](./docs/riddles.md).

### وصف اللعبة

لعبة الألغاز (Riddles) تقدّم لغزًا نصيًا بالعربي، والمطلوب من اللاعب تخمين الإجابة الصحيحة (مثال: "شيء كلما أخذت منه كبر، ما هو؟" → "الحفرة"). كل لغز قد يقبل أكثر من صياغة صحيحة لنفس الإجابة (مثل "حفرة" و"الحفرة" معًا)، لذلك حقل الإجابات دائمًا مصفوفة نصوص، تمامًا مثل حقل `answers` في لعبة الكويز.

مصدر بيانات الألغاز موجود في ملف واحد:

```
src/data/riddles/questions.json
```

عبارة عن مصفوفة JSON فيها 300 لغز حقيقي بالعربي. كل لغز مطابق للـ schema ده:

```json
{
  "id": 1,
  "question": "شيء كلما أخذت منه كبر، ما هو؟",
  "answers": ["حفرة", "الحفرة"]
}
```

- `id` — رقم صحيح موجب فريد. **مخزَّن مسبقًا ومرقّم تسلسليًا (1، 2، 3...) داخل questions.json نفسه** (نفس أسلوب `true-false`)، وليس مولَّدًا وقت التحميل. هذا الحقل **أساسي جدًا** لأن بوت الواتساب يعتمد عليه في نظام منع التكرار (anti-repeat): البوت يرسل قائمة الـ id المستخدمة سابقًا إلى `random-exclude` مع كل طلب حتى لا يتكرر نفس اللغز على نفس المجموعة. عند إضافة ألغاز جديدة يدويًا للملف، لازم يُعطى كل لغز جديد `id` فريدًا لم يُستخدم من قبل (عادة: أكبر `id` موجود حاليًا + 1).
- `question` — نص اللغز. دعم كامل لـ UTF-8/العربي.
- `answers` — **مصفوفة نصوص**، مش نص واحد، حتى لو اللغز له إجابة واحدة بس مقبولة. لا يوجد حقل `category` أو `difficulty` في هذا الإصدار، لأن مصدر البيانات المزوَّد لا يحتوي هذه الحقول.

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `question` أو `answers` (كمصفوفة غير فارغة من نصوص غير فارغة) بيتجاهل تلقائيًا وقت التحميل ومش هيظهر في أي endpoint — مش هيكسر الـ API. لو اتكرر نفس الـ `id` بين لغزين، أول لغز بيفوز والباقي بيتجاهل مع تحذير في الـ logs (نفس سلوك `true-false` بالضبط).

### الـ Endpoints

لعبة الألغاز متاحة على نفس المسار العام المشترك بين كل الألعاب: `/api/games/riddles/...` (نفس نمط `quiz` و`true-false` تمامًا).

| المسار (Endpoint) | Method | الوصف |
|---|---|---|
| `/api/games/riddles/random` | GET | ترجّع لغزًا عشوائيًا واحدًا |
| `/api/games/riddles/random-exclude?ids=1,5,8,20` | GET | ترجّع لغزًا عشوائيًا واحدًا مع استثناء الـ ids الممرّرة (anti-repeat) |
| `/api/games/riddles/all` | GET | ترجّع كل الألغاز |
| `/api/games/riddles/count` | GET | ترجّع العدد الإجمالي للألغاز |
| `/api/games/riddles/:id` | GET | ترجّع لغزًا واحدًا بواسطة رقمه (id) |

#### `GET /api/games/riddles/random`

```bash
curl http://localhost:3000/api/games/riddles/random
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "question": "شيء كلما أخذت منه كبر، ما هو؟",
    "answers": ["حفرة", "الحفرة"]
  }
}
```

#### `GET /api/games/riddles/random-exclude`

ترجّع لغزًا عشوائيًا واحدًا، مع استثناء أي `id` ممرّرة في معامل الاستعلام `ids` (مفصولة بفواصل). الـ API نفسه بلا حالة (stateless) تمامًا ولا **يتذكر** أي ألغاز سبق تقديمها — بوت الواتساب هو المسؤول عن تتبّع أرقام الألغاز المستخدمة لكل مجموعة/جلسة وتمريرها في كل طلب. هذا هو نظام منع التكرار (anti-repeat) الذي تعتمد عليه البوتات: كل لغز له `id` فريد وثابت، فيرسل البوت قائمة كل الـ `id` المستخدمة سابقًا مع كل طلب جديد.

```bash
curl "http://localhost:3000/api/games/riddles/random-exclude?ids=1,5,8,20"
```

```json
{
  "success": true,
  "data": {
    "id": 125,
    "question": "شيء كلما أخذت منه كبر، ما هو؟",
    "answers": ["الحفرة", "حفرة"]
  }
}
```

لو `ids` غير موجود أو فارغ، السلوك بيبقى مطابق تمامًا لـ `/random`. لو كل الألغاز المتاحة استُثنيت (البوت استخدمها كلها)، الـ endpoint بيرجّع خطأ `404 NOT_FOUND` بدل ما يكرر لغزًا بصمت — البوت المفروض يصفّر قائمة الأرقام المستخدمة لتلك المجموعة عند رؤية هذا الخطأ ويحاول تاني:

```json
{
  "success": false,
  "message": "لا يوجد أي لغز متبقٍ بعد استثناء كل الألغاز المُمرَّرة (كل الألغاز استُخدمت بالفعل)",
  "code": "NOT_FOUND"
}
```

#### `GET /api/games/riddles/all`

```bash
curl http://localhost:3000/api/games/riddles/all
```

ترجّع مصفوفة `questions.json` كاملة (300 لغز) داخل الشكل الموحّد.

#### `GET /api/games/riddles/count`

```bash
curl http://localhost:3000/api/games/riddles/count
```

```json
{
  "success": true,
  "data": { "count": 300 }
}
```

#### `GET /api/games/riddles/:id`

```bash
curl http://localhost:3000/api/games/riddles/125
```

```json
{
  "success": true,
  "data": {
    "id": 125,
    "question": "شيء كلما أخذت منه كبر، ما هو؟",
    "answers": ["الحفرة", "حفرة"]
  }
}
```

أي `id` مفقود/غير صالح بيرجّع خطأ `400 BAD_REQUEST`، وأي `id` غير موجود بيرجّع `404 NOT_FOUND`، بنفس شكل الخطأ الموحّد المستخدم في باقي المشروع بالكامل.

### نظام منع التكرار (anti-repeat)

نفس نمط الكويز و"صح أو خطأ" بالضبط — استخدمي `GET /api/games/riddles/random-exclude?ids=1,2,3` بدل `/random` العادي، وتتبّعي أرقام الألغاز (`id`) المستخدمة لكل مجموعة في البوت نفسه:

1. احتفظي بقائمة لكل مجموعة لأرقام الألغاز المستخدمة (في قاعدة بيانات/ذاكرة البوت نفسه).
2. نادي على `GET /api/games/riddles/random-exclude?ids=<الأرقام المستخدمة مفصولة بفواصل>` بدل `/random` العادي.
3. ضيفي `id` اللغز المُرجَع لقائمة الأرقام المستخدمة لتلك المجموعة.
4. لو الـ endpoint رجّع `404 NOT_FOUND` (كل الألغاز اتستنفدت)، صفّري قائمة الأرقام المستخدمة لتلك المجموعة ونادي تاني.

أكواد جاهزة كاملة لهذا النمط (وباقي أمثلة التكامل مع Baileys) موجودة في [`docs/riddles.md`](./docs/riddles.md).

لتحديث المحتوى: عدّلي `src/data/riddles/questions.json`، اعملي commit، وارفعي (redeploy) — بدون أي تعديل كود.

---

## Eye API (عين)

> للتوثيق الكامل والمفصّل لهذه اللعبة (كل الـ endpoints، أمثلة كاملة، تكامل Baileys جاهز، وشرح `random-exclude`) راجعي [`docs/eye.md`](./docs/eye.md).

### وصف اللعبة

لعبة "عين" (Eye) تقدّم صورة واحدة (`img`)، والمطلوب من اللاعب تخمين اسم الشخصية أو العنصر الظاهر فيها (`name`). على عكس الكويز والألغاز، لا يوجد هنا مصفوفة إجابات متعددة الصياغات — كل عنصر له اسم واحد فقط يمثّل الإجابة الصحيحة.

مصدر بيانات "عين" موجود في ملف واحد:

```
src/data/eye/questions.json
```

عبارة عن مصفوفة JSON فيها 130 عنصرًا حقيقيًا (بعد إزالة التكرارات من المصدر الأصلي). كل عنصر مطابق للـ schema ده:

```json
{
  "id": 1,
  "img": "https://telegra.ph/file/fe1a351860083053b5f4b.jpg",
  "name": "لايت"
}
```

- `id` — رقم صحيح موجب فريد. **مخزَّن مسبقًا ومرقّم تسلسليًا (1، 2، 3...) داخل questions.json نفسه** (نفس أسلوب `riddles` و`true-false`)، وليس مولَّدًا وقت التحميل. هذا الحقل **أساسي جدًا** لأن بوت الواتساب يعتمد عليه في نظام منع التكرار (anti-repeat): البوت يرسل قائمة الـ id المستخدمة سابقًا إلى `random-exclude` مع كل طلب حتى لا تتكرر نفس الصورة على نفس المجموعة. عند إضافة عناصر جديدة يدويًا للملف، لازم يُعطى كل عنصر جديد `id` فريدًا لم يُستخدم من قبل (عادة: أكبر `id` موجود حاليًا + 1).
- `img` — رابط الصورة المعروضة على اللاعب.
- `name` — اسم الشخصية أو العنصر الظاهر في الصورة. **نص مفرد وليس مصفوفة**، على عكس `answers` في الكويز/الألغاز.

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `img` أو `name` (كلاهما نص غير فارغ) بيتجاهل تلقائيًا وقت التحميل ومش هيظهر في أي endpoint — مش هيكسر الـ API. لو اتكرر نفس الـ `id` بين عنصرين، أول عنصر بيفوز والباقي بيتجاهل مع تحذير في الـ logs (نفس سلوك `riddles` بالضبط).

قبل بناء هذه اللعبة، مصدر البيانات الأصلي احتوى على تكرارات (نفس رابط الصورة أو نفس الاسم مكرر). تمت إزالة كل التكرارات بحيث يبقى عنصر واحد فقط لكل صورة/اسم فريد (العنصر يُعتبر مكررًا لو تطابق `img` أو `name` مع عنصر آخر)، ثم أُضيف `id` تسلسليًا لكل عنصر متبقٍ.

### الـ Endpoints

لعبة "عين" متاحة على نفس المسار العام المشترك بين كل الألعاب: `/api/games/eye/...` (نفس نمط `quiz` و`true-false` و`riddles` تمامًا).

| المسار (Endpoint) | Method | الوصف |
|---|---|---|
| `/api/games/eye/random` | GET | ترجّع عنصر "عين" عشوائيًا واحدًا |
| `/api/games/eye/random-exclude?ids=1,5,8,20` | GET | ترجّع عنصرًا عشوائيًا واحدًا مع استثناء الـ ids الممرّرة (anti-repeat) |
| `/api/games/eye/all` | GET | ترجّع كل عناصر "عين" |
| `/api/games/eye/count` | GET | ترجّع العدد الإجمالي للعناصر |
| `/api/games/eye/:id` | GET | ترجّع عنصرًا واحدًا بواسطة رقمه (id) |

#### `GET /api/games/eye/random`

```bash
curl http://localhost:3000/api/games/eye/random
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "img": "https://telegra.ph/file/fe1a351860083053b5f4b.jpg",
    "name": "لايت"
  }
}
```

#### `GET /api/games/eye/random-exclude`

ترجّع عنصرًا عشوائيًا واحدًا، مع استثناء أي `id` ممرّرة في معامل الاستعلام `ids` (مفصولة بفواصل). الـ API نفسه بلا حالة (stateless) تمامًا ولا **يتذكر** أي عناصر سبق تقديمها — بوت الواتساب هو المسؤول عن تتبّع أرقام العناصر المستخدمة لكل مجموعة/جلسة وتمريرها في كل طلب.

```bash
curl "http://localhost:3000/api/games/eye/random-exclude?ids=1,5,8,20"
```

```json
{
  "success": true,
  "data": {
    "id": 42,
    "img": "https://telegra.ph/file/example42.jpg",
    "name": "رين"
  }
}
```

لو `ids` غير موجود أو فارغ، السلوك بيبقى مطابق تمامًا لـ `/random`. لو كل العناصر المتاحة استُثنيت (البوت استخدمها كلها)، الـ endpoint بيرجّع خطأ `404 NOT_FOUND` بدل ما يكرر عنصرًا بصمت:

```json
{
  "success": false,
  "message": "لا يوجد أي عنصر متبقٍ بعد استثناء كل العناصر المُمرَّرة (كل العناصر استُخدمت بالفعل)",
  "code": "NOT_FOUND"
}
```

#### `GET /api/games/eye/all`

```bash
curl http://localhost:3000/api/games/eye/all
```

ترجّع مصفوفة `questions.json` كاملة (130 عنصرًا) داخل الشكل الموحّد.

#### `GET /api/games/eye/count`

```bash
curl http://localhost:3000/api/games/eye/count
```

```json
{
  "success": true,
  "data": { "count": 130 }
}
```

#### `GET /api/games/eye/:id`

```bash
curl http://localhost:3000/api/games/eye/42
```

```json
{
  "success": true,
  "data": {
    "id": 42,
    "img": "https://telegra.ph/file/example42.jpg",
    "name": "رين"
  }
}
```

أي `id` مفقود/غير صالح بيرجّع خطأ `400 BAD_REQUEST`، وأي `id` غير موجود بيرجّع `404 NOT_FOUND`، بنفس شكل الخطأ الموحّد المستخدم في باقي المشروع بالكامل.

### نظام منع التكرار (anti-repeat)

نفس نمط الكويز و"صح أو خطأ" و"الألغاز" بالضبط — استخدمي `GET /api/games/eye/random-exclude?ids=1,2,3` بدل `/random` العادي، وتتبّعي أرقام العناصر (`id`) المستخدمة لكل مجموعة في البوت نفسه:

1. احتفظي بقائمة لكل مجموعة لأرقام العناصر المستخدمة (في قاعدة بيانات/ذاكرة البوت نفسه).
2. نادي على `GET /api/games/eye/random-exclude?ids=<الأرقام المستخدمة مفصولة بفواصل>` بدل `/random` العادي.
3. ضيفي `id` العنصر المُرجَع لقائمة الأرقام المستخدمة لتلك المجموعة.
4. لو الـ endpoint رجّع `404 NOT_FOUND` (كل العناصر اتستنفدت)، صفّري قائمة الأرقام المستخدمة لتلك المجموعة ونادي تاني.

أكواد جاهزة كاملة لهذا النمط (وباقي أمثلة التكامل مع Baileys) موجودة في [`docs/eye.md`](./docs/eye.md).

لتحديث المحتوى: عدّلي `src/data/eye/questions.json`، اعملي commit، وارفعي (redeploy) — بدون أي تعديل كود.

---

## إضافة لعبة جديدة

بنية الـ routes (`/api/games/[game]/...`) وطبقة التخزين (`lib/json-db.ts`) عامة (generic) بالفعل. ألعاب `true-false` (صح أو خطأ) و`riddles` (ألغاز) و`eye` (عين) مبنية بالضبط بهذا الأسلوب، ويمكن اعتبار أيّ منها مثالًا حيًا كاملًا لإضافة لعبة جديدة. لإضافة لعبة جديدة أخرى (مثلًا `anime`):

1. أنشئي مجلد وحدة جديد مستقل بذاته: `src/modules/games/anime/`، بنفس نمط `src/modules/games/quiz/` أو `src/modules/games/true-false/` أو `src/modules/games/riddles/` أو `src/modules/games/eye/` (ملف `*.types.ts`, ملف `*.service.ts`, اختياريًا `*.validation.ts`, و`index.ts`).
2. ضيفي ملف `src/data/anime/questions.json` بمحتواك.
3. سجّلي اسم اللعبة (slug) في `src/types/games.ts`:
   ```ts
   export const GAME_REGISTRY = ["quiz", "true-false", "riddles", "eye", "anime"] as const;
   ```
4. اربطي الوحدة الجديدة في `src/modules/games/registry.ts` — ضيفي حالة `"anime"` لكل دالة من الدوال الخمس (`getRandomItem`, `getRandomItemExcluding`, `getAllItems`, `getItemById`, `getItemCount`)، بحيث تنادي على دوال وحدتك الجديدة.

مفيش أي ملف route محتاج تعديل — `/api/games/anime/random`, `/random-exclude`, `/all`, `/count`, و`/:id` كلها هتشتغل تلقائيًا بمجرد ما الـ registry يعرف عن `"anime"`. لو حبيتِ رابطًا مختصرًا زي `/api/anime/...` (بدل `/api/games/anime/...`)، تقدري تضيفي قاعدة `rewrite` في `next.config.ts` تربطه بالمسار العام.

---

## التعامل مع الأخطاء

الـ API بيتعامل مع الحالات دي بشكل نظيف، ودايمًا بيرجّع الشكل الموحّد للخطأ في JSON:

- **ملف مفقود** — لو `questions.json` مش موجود، `lib/json-db.ts` بيرمي خطأ `NOT_FOUND`.
- **JSON غير صالح** — لو محتوى الملف مش JSON صحيح أو مش مصفوفة، بيتم رمي خطأ بكود `INVALID_JSON`.
- **id غير صالح** — قيم `:id` غير الرقمية أو غير الموجبة بترفض بـ `400 BAD_REQUEST` قبل حتى ما تلمس طبقة البيانات.
- **مجموعة بيانات فارغة** — `random` على مجموعة فارغة بترجّع `404 NOT_FOUND` بدل ما تكسر.
- **كل الأسئلة مستثناة** — `random-exclude` بترجّع `404 NOT_FOUND` لو كل الأسئلة المتاحة استُثنيت عبر `ids`، بدل ما تكرر واحدة بصمت.
- **اسم لعبة غير معروف** — أي `[game]` مش موجود في `GAME_REGISTRY` بيرجّع `404 NOT_FOUND`.
- **مسار غير معروف** — أي طلب تحت `/api/*` ملوش route معرّف بيرجّع `404` عبر المعالج الشامل، كـ JSON (مش صفحة 404 HTML الافتراضية من Next.js).

---

## النشر على Vercel

1. ارفعي المشروع على GitHub/GitLab/Bitbucket.
2. استوردي المشروع من [لوحة تحكم Vercel](https://vercel.com/new) — هيتعرّف تلقائيًا على إطار Next.js.
3. مفيش أي متغيرات بيئة إلزامية لهذه النسخة الأولية. اختياريًا حطي `NEXT_PUBLIC_API_NAME` / `API_VERSION` في **Project Settings → Environment Variables** لو عايزة قيم مخصّصة.
4. ديبلوي. Vercel بيشغّل `npm install` ثم `npm run build` تلقائيًا (راجعي `vercel.json`).
5. تأكدي بـ:
   ```bash
   curl https://raygumo-api.vercel.app/api/games/quiz/random
   ```

### ملاحظة مهمة عن تخزين JSON في بيئة الإنتاج

نظام ملفات دوال Vercel الخادمة (serverless) **للقراءة فقط** وقت التشغيل (باستثناء `/tmp`، وهو مؤقت ومش مشترك بين الاستدعاءات). هذا المشروع فقط *بيقرأ* `questions.json` وقت الطلب، وده بيشتغل تمام على Vercel.

لتحديث محتوى الكويز في الإنتاج: عدّلي `src/data/quiz/questions.json`، اعملي commit، وارفعي (redeploy). لا يوجد دعم للكتابة/CRUD وقت التشغيل بشكل مقصود — ده بيخلي المشروع بسيط ومتوافق تمامًا مع نظام ملفات Vercel للقراءة فقط في الإنتاج.
