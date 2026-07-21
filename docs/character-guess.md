# لعبة خمن الشخصية (Character Guess) — توثيق كامل

هذا الملف يوثّق لعبة "خمن الشخصية" بالتفصيل: بنية البيانات، كل الـ endpoints المتاحة، أمثلة الطلبات والاستجابات، نظام الـ `id`، آلية منع التكرار (`random-exclude`)، آلية منع الغش في `random`، تكامل جاهز مع بوتات واتساب (Baileys)، والتحقق من إجابة المستخدم، وحالات الأخطاء.

هذه اللعبة مبنية بنفس بنية لعبة [عين](./eye.md) في نظام الـ `id` (مخزَّن مسبقًا في الملف، وليس مولَّدًا بالترتيب كما في الكويز)، لكنها **تختلف عن كل الألعاب الأخرى في نقطة واحدة مهمة جدًا**: استجابة `/random` و`/random-exclude` **لا ترجعان `answers` إطلاقًا** لمنع الغش (راجع [منع الغش](#منع-الغش-في-random) بالأسفل).

---

## جدول المحتويات

- [وصف اللعبة](#وصف-اللعبة)
- [بنية البيانات](#بنية-البيانات)
- [نظام الـ id](#نظام-الـ-id)
- [منع الغش في random](#منع-الغش-في-random)
- [الـ Endpoints](#الـ-endpoints)
  - [GET /api/games/character-guess/random](#get-apigamescharacter-guessrandom)
  - [GET /api/games/character-guess/random-exclude](#get-apigamescharacter-guessrandom-exclude)
  - [GET /api/games/character-guess/count](#get-apigamescharacter-guesscount)
  - [GET /api/games/character-guess/:id](#get-apigamescharacter-guessid)
  - [GET /api/games/character-guess/all](#get-apigamescharacter-guessall)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس السؤال (Anti-Repeat)](#منع-تكرار-نفس-السؤال-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [حالات الأخطاء](#حالات-الأخطاء)
- [إضافة/تحديث الأسئلة](#إضافةتحديث-الأسئلة)

---

## وصف اللعبة

"خمن الشخصية" لعبة تخمين نصية: يُعرض على اللاعب وصف (`question`) لشخصية مشهورة (أنمي، ألعاب، أفلام، مسلسلات، شخصيات تاريخية...) بدون ذكر اسمها، وعلى اللاعب معرفة اسم الشخصية الصحيح. سؤال واحد قد يقبل **أكثر من إجابة صحيحة** (مثل الاسم بالعربية والإنجليزية أو أكثر من تهجئة)، لذلك الإجابات مصفوفة نصوص (`answers: string[]`).

الـ API هنا **مزوّد محتوى فقط** — لا يتحقق من إجابة المستخدم ولا يحتفظ بأي حالة (state) عن تقدّم اللعبة أو نقاط الخبرة أو الترتيب؛ هذا كله مسؤولية البوت المستهلك للـ API. الـ API بلا حالة (stateless) تمامًا.

---

## بنية البيانات

مصدر البيانات الأساسي هو ملف:

```
src/data/character-guess/questions.json
```

عبارة عن مصفوفة JSON تحتوي حاليًا **400 سؤال**.

شكل كل سؤال **كاملًا** (كما يظهر في استجابتي `/all` و`/:id`):

```json
{
  "id": 1,
  "question": "يحلم بأن يصبح ملك القراصنة، يمتلك جسدًا مطاطيًا ويخوض أخطر المغامرات لحماية أصدقائه وتحقيق وعده القديم.",
  "answers": ["لوفي", "مونكي دي لوفي", "luffy", "monkey d luffy"]
}
```

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `number` | معرّف فريد وثابت، **مخزَّن مسبقًا داخل questions.json نفسه** (وليس مولَّدًا وقت التحميل). انظر [نظام الـ id](#نظام-الـ-id) بالأسفل. |
| `question` | `string` | وصف الشخصية المطلوب تخمينها (يدعم العربية وUTF-8 بالكامل). |
| `answers` | `string[]` | كل الإجابات المقبولة لهذا الوصف. مصفوفة نصوص دائمًا، وليست نصًا مفردًا. |

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `question` أو `answers` (مصفوفة نصوص غير فارغة) يُتجاهل تلقائيًا وقت التحميل ولن يظهر في أي endpoint - دون أن يوقف الـ API بالكامل. لو اتكرر نفس الـ `id` بين سؤالين، أول سؤال بيفوز والباقي بيتجاهل مع تحذير في الـ logs.

---

## نظام الـ id

- الـ `id` **رقم صحيح موجب فريد**، **مخزَّن مسبقًا وصراحة داخل كل سؤال في `questions.json` نفسه** - تمامًا مثل لعبة [عين](./eye.md)، وعلى عكس الكويز حيث يُولَّد تلقائيًا حسب الترتيب وقت التحميل.
- عند إضافة أسئلة جديدة يدويًا للملف، **لازم تدي كل سؤال جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1). الـ API يتحقق فقط أن كل `id` رقم صحيح موجب وفريد؛ لا يولّد أي `id` بنفسه.
- هذا الاستقرار أساسي لأن `id` هو المعرّف الذي تعتمد عليه بوتات الواتساب في نظام منع التكرار (anti-repeat عبر `random-exclude`)، وأيضًا للتحقق من إجابة اللاعب عبر `/:id` بعد استلام سؤال من `/random`.
- لو اتكرر نفس الـ `id` بين سؤالين في الملف بالخطأ، أول سؤال بترتيب الظهور يفوز، والباقي يُتجاهل مع تحذير في الـ logs (`console.warn`).

---

## منع الغش في random

هذه اللعبة **الوحيدة في المشروع حاليًا** التي تُخفي `answers` عمدًا من استجابتي `/random` و`/random-exclude`. السبب: لو رجعت الإجابات الصحيحة مع نفس الاستجابة التي يعرضها البوت للاعب، سيكون بإمكان أي لاعب فضولي فتح رابط الـ API مباشرة ورؤية الحل قبل التخمين.

لذلك:

- `GET /random` و`GET /random-exclude` يرجعان فقط `{ id, question }` **بدون** `answers`.
- `GET /:id` و`GET /all` يرجعان السؤال **كاملًا مع answers** - هذان الـ endpoint مخصَّصان للبوت نفسه (وليس للاعب)، ليستخدمهما في التحقق من إجابة اللاعب بعد إرسالها.

**سير العمل الصحيح للبوت:**

1. البوت يطلب `GET /random-exclude?ids=...` ويحصل على `{ id, question }` فقط.
2. البوت يعرض `question` للاعب ويطلب إجابته.
3. عند استلام إجابة اللاعب، البوت يطلب `GET /:id` (بنفس الـ `id` الذي حصل عليه في الخطوة 1) للحصول على `answers` الكاملة، ثم يقارن إجابة اللاعب معها محليًا.

---

## الـ Endpoints

### `GET /api/games/character-guess/random`

ترجع سؤالًا عشوائيًا واحدًا **بدون answers** (لمنع الغش).

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/character-guess/random
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 52,
    "question": "أمير شعب محارب فخور، بدأ كعدو ثم أصبح من أعظم المدافعين عن الأرض."
  }
}
```

---

### `GET /api/games/character-guess/random-exclude`

ترجع سؤالًا عشوائيًا واحدًا **بدون answers**، مع استثناء أي `id` موجود ضمن قائمة معامل الاستعلام `ids` (مفصولة بفواصل). هذا هو آلية منع التكرار (anti-repeat) في اللعبة.

`GET /api/games/character-guess/random-exclude?ids=1,2,3`

**مثال الطلب:**

```bash
curl "https://raygumo-api.vercel.app/api/games/character-guess/random-exclude?ids=1,2,3"
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 90,
    "question": "..."
  }
}
```

**حالة خاصة:** إذا استُثنيت كل الأسئلة المتاحة، يرجع المسار خطأ 404 واضحًا بدل تكرار سؤال قديم بصمت. عندها على البوت أن يعيد تصفير قائمة الأسئلة المستخدمة لتلك المجموعة والبدء من جديد.

---

### `GET /api/games/character-guess/count`

ترجع العدد الإجمالي للأسئلة المتاحة حاليًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/character-guess/count
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": { "count": 400 }
}
```

---

### `GET /api/games/character-guess/:id`

ترجع سؤالًا واحدًا محددًا بالضبط عبر رقمه (`id`)، **مع answers كاملة**. يستخدمه البوت للتحقق من إجابة اللاعب بعد إرسالها.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/character-guess/15
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "question": "...",
    "answers": ["..."]
  }
}
```

**مثال استجابة الخطأ (404 - id غير موجود):**

```json
{
  "success": false,
  "message": "No item with id 99999 in \"character-guess\"",
  "code": "NOT_FOUND"
}
```

---

### `GET /api/games/character-guess/all`

ترجع كل الأسئلة **مع answers كاملة** كمصفوفة واحدة. مفيدة لأدوات إدارة المحتوى أو اختبارات المطوّر - غير مخصَّصة للاستخدام المباشر من اللاعب.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/character-guess/all
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": [
    { "id": 1, "question": "...", "answers": ["..."] },
    { "id": 2, "question": "...", "answers": ["..."] }
  ]
}
```

---

## شكل الاستجابة الموحّد

كل استجابات المشروع (بما فيها هذه اللعبة) تتبع نفس الشكل:

**نجاح:**

```json
{
  "success": true,
  "data": {}
}
```

**خطأ:**

```json
{
  "success": false,
  "message": "نص يشرح الخطأ",
  "code": "NOT_FOUND"
}
```

---

## تكامل Baileys جاهز للنسخ

مثال لأمر بوت واتساب (Baileys) بسيط للعبة "خمن الشخصية" مع تتبّع الأسئلة المستخدمة لكل مجموعة ومنع الغش:

```javascript
// حالة داخل الذاكرة لكل مجموعة: قائمة id الأسئلة المستخدمة + السؤال الحالي
const usedIdsByGroup = new Map(); // groupId -> number[]
const activeQuestionByGroup = new Map(); // groupId -> { id, question }

const API_BASE = "https://raygumo-api.vercel.app/api/games/character-guess";

async function startCharacterGuess(groupId) {
  const usedIds = usedIdsByGroup.get(groupId) ?? [];
  const url = `${API_BASE}/random-exclude?ids=${usedIds.join(",")}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    // كل الأسئلة استُخدمت، نصفّر القائمة ونبدأ من جديد
    usedIdsByGroup.set(groupId, []);
    return startCharacterGuess(groupId);
  }

  const { id, question } = json.data;
  usedIdsByGroup.set(groupId, [...usedIds, id]);
  activeQuestionByGroup.set(groupId, { id, question });

  return `خمن الشخصية:\n\n${question}`;
}

async function checkAnswer(groupId, playerAnswer) {
  const active = activeQuestionByGroup.get(groupId);
  if (!active) return null;

  const res = await fetch(`${API_BASE}/${active.id}`);
  const json = await res.json();
  if (!json.success) return null;

  const normalized = playerAnswer.trim().toLowerCase();
  const isCorrect = json.data.answers.some(
    (a) => a.trim().toLowerCase() === normalized
  );

  return isCorrect;
}
```

---

## منع تكرار نفس السؤال (Anti-Repeat)

الـ API بلا حالة تمامًا - لا يخزّن أي معلومة دائمة عن الأسئلة التي عُرضت سابقًا. البوت هو المسؤول عن:

1. الاحتفاظ بقائمة `id` الأسئلة المستخدمة لكل مجموعة/مستخدم في ذاكرته الخاصة.
2. إرسال تلك القائمة مع كل طلب `random-exclude?ids=...`.
3. عند استلام 404 (كل الأسئلة استُخدمت)، تصفير القائمة والبدء من جديد.

---

## التحقق من إجابة المستخدم

الـ API لا يتحقق من إجابة اللاعب - هذا كله مسؤولية البوت. الخطوات المقترحة:

1. البوت يطلب `/random` أو `/random-exclude` ويحصل على `{ id, question }` فقط (بدون `answers`).
2. عند استلام إجابة اللاعب، البوت يطلب `/:id` بنفس الـ `id` للحصول على `answers` الكاملة.
3. يُقارن نص إجابة اللاعب (بعد `trim()` وتحويله لحروف صغيرة) مع كل عنصر في `answers` (بعد نفس المعالجة) للتحقق من التطابق.

---

## حالات الأخطاء

| الحالة | كود HTTP | `code` |
|---|---|---|
| لعبة (slug) غير مسجّلة | 404 | `NOT_FOUND` |
| `id` غير موجود | 404 | `NOT_FOUND` |
| كل الأسئلة مستثناة في `random-exclude` | 404 | `NOT_FOUND` |
| قيمة `id` أو `ids` غير صالحة (نص غير رقمي) | 400 | `BAD_REQUEST` |
| خطأ غير متوقع في الخادم | 500 | `INTERNAL_ERROR` |

---

## إضافة/تحديث الأسئلة

1. افتحي `src/data/character-guess/questions.json`.
2. أضيفي سؤالًا جديدًا بنفس الشكل: `{ "id": ..., "question": "...", "answers": [...] }`.
3. تأكدي أن الـ `id` الجديد **فريد** ولم يُستخدم من قبل (عادة: أكبر `id` موجود حاليًا + 1).
4. تأكدي أن `answers` مصفوفة نصوص غير فارغة.
5. لا حاجة لأي تعديل في الكود - التغييرات تُقرأ مباشرة من الملف عند إعادة تشغيل الخادم (أو نشر جديد على Vercel).
