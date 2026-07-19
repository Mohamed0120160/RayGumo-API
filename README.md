# RayGumo API

**API خفيف وقابل للتوسّع لمحتوى الألعاب (Game Content API)**، مبني بـ **Next.js 16 (App Router) + TypeScript**، مصمَّم لتقديم محتوى الألعاب لبوتات الواتساب (المبنية على Baileys) وأي مواقع مستقبلية من نشر واحد فقط.

هذا المشروع في مرحلة **MVP (نسخة أولية قابلة للاستخدام)**. حاليًا يقدّم لعبة واحدة فقط — **Quiz (كويز)** — لكن البنية المعمارية مصمَّمة عمدًا بحيث إضافة ألعاب جديدة مستقبلًا (تخمين أنمي، ألغاز، صح وخطأ، تخمين شخصيات...) لا تتطلب أي تعديل في بنية routes الـ API، بل فقط وحدات ألعاب جديدة مستقلة بذاتها.

RayGumo API هو **مزوّد محتوى فقط** — هو **لا** يدير حسابات اللاعبين، نقاط الخبرة (XP)، المستويات، الترتيب (rankings)، أو المواسم. هذا المنطق مسؤولية كل بوت على حدة.

لا حاجة لقاعدة بيانات. كل المحتوى موجود في ملف JSON داخل المشروع نفسه.

> 🤖 **مبرمج بوت واتساب وعايز تستخدم الـ API بسرعة؟**
> روحي مباشرة لملف [`BOT_DEVELOPER_GUIDE.md`](./BOT_DEVELOPER_GUIDE.md) — فيه بس الـ endpoints وأمثلة Baileys الجاهزة للنسخ، من غير أي تفاصيل معمارية داخلية. هذا الملف (`README.md`) للمطوّرين اللي بيشتغلوا على المشروع نفسه.

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
│       └── quiz/                 # وحدة لعبة الكويز (مستقلة بذاتها)
│           ├── quiz.service.ts   # getRandomQuestion / getRandomQuestionExcluding / getQuestionById / getAllQuestions / getQuestionCount
│           ├── quiz.types.ts     # نوع QuizQuestion (answers: string[])
│           ├── quiz.validation.ts# isValidQuizQuestion / validateQuizQuestion
│           └── index.ts          # نقطة الدخول العامة للوحدة
│
├── data/
│   └── quiz/
│       └── questions.json        # محتوى الكويز الفعلي
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

كل الـ endpoints الحالية تستخدم اسم اللعبة `[game]`. حاليًا `quiz` هي اللعبة الوحيدة المسجّلة (راجعي `src/types/games.ts`).

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

---

## بيانات الكويز

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

أكواد جاهزة كاملة لهذا النمط (وباقي أمثلة التكامل مع Baileys) موجودة في [`BOT_DEVELOPER_GUIDE.md`](./BOT_DEVELOPER_GUIDE.md).

---

## إضافة لعبة جديدة

بنية الـ routes (`/api/games/[game]/...`) وطبقة التخزين (`lib/json-db.ts`) عامة (generic) بالفعل. لإضافة لعبة جديدة (مثلًا `riddles`):

1. أنشئي مجلد وحدة جديد مستقل بذاته: `src/modules/games/riddles/`، بنفس نمط `src/modules/games/quiz/` (ملف `*.types.ts`, ملف `*.service.ts`, اختياريًا `*.validation.ts`, و`index.ts`).
2. ضيفي ملف `src/data/riddles/questions.json` بمحتواك.
3. سجّلي اسم اللعبة (slug) في `src/types/games.ts`:
   ```ts
   export const GAME_REGISTRY = ["quiz", "riddles"] as const;
   ```
4. اربطي الوحدة الجديدة في `src/modules/games/registry.ts` — ضيفي حالة `"riddles"` لكل دالة من الدوال الخمس (`getRandomItem`, `getRandomItemExcluding`, `getAllItems`, `getItemById`, `getItemCount`)، بحيث تنادي على دوال وحدتك الجديدة.

مفيش أي ملف route محتاج تعديل — `/api/games/riddles/random`, `/random-exclude`, `/all`, `/count`, و`/:id` كلها هتشتغل تلقائيًا بمجرد ما الـ registry يعرف عن `"riddles"`.

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
