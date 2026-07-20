# لعبة الكويز (Quiz) — توثيق كامل

هذا الملف يوثّق لعبة الكويز بالتفصيل: بنية البيانات، كل الـ endpoints المتاحة، أمثلة الطلبات والاستجابات، نظام الـ `id`، آلية منع التكرار (`random-exclude`)، تكامل جاهز مع بوتات واتساب (Baileys)، والتحقق من إجابة المستخدم، وحالات الأخطاء.

هذه اللعبة هي اللعبة الأصلية في المشروع (MVP)، ومنها اشتُقت بنية بقية الألعاب (مثل [`true-false`](./true-false.md)) — إذا كنت مطّلعًا على توثيق "صح أو خطأ"، هذا الملف سيبدو مألوفًا جدًا.

---

## جدول المحتويات

- [وصف اللعبة](#وصف-اللعبة)
- [بنية البيانات](#بنية-البيانات)
- [نظام الـ id](#نظام-الـ-id)
- [الـ Endpoints](#الـ-endpoints)
  - [GET /api/games/quiz/random](#get-apigamesquizrandom)
  - [GET /api/games/quiz/random-exclude](#get-apigamesquizrandom-exclude)
  - [GET /api/games/quiz/count](#get-apigamesquizcount)
  - [GET /api/games/quiz/:id](#get-apigamesquizid)
  - [GET /api/games/quiz/all](#get-apigamesquizall)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس السؤال (Anti-Repeat)](#منع-تكرار-نفس-السؤال-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [حالات الأخطاء](#حالات-الأخطاء)
- [إضافة/تحديث الأسئلة](#إضافةتحديث-الأسئلة)

---

## وصف اللعبة

الكويز لعبة أسئلة وأجوبة كلاسيكية: يُعرض على اللاعب سؤال (`question`)، وعليه معرفة الإجابة الصحيحة. على عكس لعبة "صح أو خطأ"، سؤال الكويز قد يقبل **أكتر من إجابة صحيحة واحدة** (مثلًا تهجئتين مختلفتين لنفس الاسم)، لذلك الإجابات تُمثَّل كمصفوفة نصوص (`answers: string[]`) وليس قيمة واحدة. لكل سؤال أيضًا تصنيف موضوعي (`category`) مثل "جغرافيا" أو "علوم" أو "تاريخ".

الـ API هنا **مزوّد محتوى فقط** — لا يتحقق من إجابة المستخدم ولا يحتفظ بأي حالة (state) عن تقدّم اللعبة أو نقاط الخبرة أو الترتيب؛ هذا كله مسؤولية البوت المستهلك للـ API. الـ API بلا حالة (stateless) تمامًا.

---

## بنية البيانات

مصدر البيانات الأساسي هو ملف:

```
src/data/quiz/questions.json
```

عبارة عن مصفوفة JSON تحتوي حاليًا **260 سؤال** حقيقي بالعربية، موزّعة على 10 تصنيفات (جغرافيا، تاريخ، علوم، فضاء، رياضة، أنمي، ألعاب فيديو، أفلام ومسلسلات، تكنولوجيا، ثقافة عامة).

شكل كل سؤال كما يظهر في استجابات الـ API:

```json
{
  "id": 1,
  "question": "ما عاصمة اليابان؟",
  "answers": ["طوكيو"],
  "category": "جغرافيا"
}
```

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `number` | معرّف فريد وثابت، **يُولَّد تلقائيًا وقت التحميل** (ليس مخزَّنًا في الملف). انظر [نظام الـ id](#نظام-الـ-id) بالأسفل. |
| `question` | `string` | نص السؤال. دعم كامل لـ UTF-8/العربي. |
| `answers` | `string[]` | **مصفوفة نصوص**، مش نص واحد. السؤال ممكن يقبل أكتر من إجابة صحيحة. دايمًا تعاملي معاها كمصفوفة في البوت، حتى لو السؤال ليه إجابة واحدة بس. |
| `category` | `string` | تصنيف موضوعي حر (مثل `"جغرافيا"`, `"علوم"`). |

> **ملاحظة:** مصدر البيانات الخام في `questions.json` لا يحتوي حقل `id` إطلاقًا — فقط `question`/`answers`/`category`. حقل `id` يُضاف تلقائيًا في طبقة الخدمة (`quiz.service.ts`) أثناء التحميل، وليس جزءًا من الملف الأصلي على القرص. هذا يختلف عن لعبة "صح أو خطأ" حيث `id` مخزَّن يدويًا داخل الملف — راجعي [نظام الـ id](#نظام-الـ-id) للتفاصيل والسبب.

أي سجل ناقص فيه `question` أو `answers` (كمصفوفة غير فارغة من نصوص غير فارغة) أو `category` يُتجاهل تلقائيًا وقت التحميل ولن يظهر في أي endpoint — دون أن يوقف الـ API بالكامل.

مجموعة البيانات هذه هي المصدر الوحيد للحقيقة: لا توجد أي أسئلة تجريبية/placeholder في المشروع حاليًا.

---

## نظام الـ id

- الـ `id` **رقم صحيح موجب**، يُولَّد تلقائيًا أثناء تحميل `questions.json`، بناءً على **ترتيب ظهور السؤال في الملف**: السؤال الأول يحصل على `id: 1`، الثاني `id: 2`، وهكذا.
- الـ `id` **ثابت بين الطلبات المختلفة** طالما ترتيب الأسئلة داخل `questions.json` لم يتغيّر. هذا يجعله موثوقًا للاستخدام في:
  - تتبّع الأسئلة التي عُرضت على مستخدم/مجموعة معيّنة (لمنع التكرار عبر البوت، انظر [منع تكرار نفس السؤال](#منع-تكرار-نفس-السؤال-anti-repeat)).
  - جلب نفس السؤال مرة أخرى بواسطة `GET /api/games/quiz/:id`.
- **لا تحتاجين لإضافة أو إدارة `id` يدويًا** في ملف الـ JSON — فقط أضيفي أسئلة جديدة للملف وسيُحدَّد لها `id` تلقائيًا وبشكل ثابت في كل تحميل.
- **تنبيه:** إذا أُعيد ترتيب الأسئلة داخل `questions.json` يدويًا (وليس فقط الإضافة في النهاية)، فإن الـ `id` المرتبط بكل سؤال قد يتغيّر تبعًا لموضعه الجديد، وهذا قد يكسر أي قائمة استثناء (`random-exclude`) محفوظة مسبقًا لدى بوت مستهلك. للحفاظ على استقرار الـ `id` عبر الزمن، يُفضَّل دائمًا إضافة أسئلة جديدة في **نهاية الملف** بدل إدراجها في المنتصف.

> **الفرق عن لعبة "صح أو خطأ":** في `true-false`، الـ `id` مخزَّن يدويًا وصراحة داخل كل سؤال في الملف نفسه (وليس مولَّدًا حسب الترتيب)، تحديدًا لتفادي مشكلة تغيّر الـ `id` عند الاستيراد في المنتصف. لو كنتِ بتخططي لاستيراد أسئلة كويز بكثافة أو بشكل متكرر مستقبلًا، هذا النمط (`id` صريح في الملف) يستحق التفكير فيه هنا أيضًا — راجعي [`docs/true-false.md`](./true-false.md#نظام-الـ-id) لتفاصيل هذا النمط البديل.

---

## الـ Endpoints

جميع الـ endpoints التالية تعمل عبر بنية المشروع العامة `/api/games/[game]/...` باستخدام `quiz` كاسم اللعبة (slug).

### `GET /api/games/quiz/random`

ترجع سؤال كويز عشوائيًا واحدًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/quiz/random
```

**مثال الاستجابة (200):**

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

---

### `GET /api/games/quiz/random-exclude`

ترجع سؤالًا عشوائيًا واحدًا، مع استثناء أي `id` موجود ضمن قائمة معامل الاستعلام `ids` (مفصولة بفواصل). هذا هو آلية منع التكرار (anti-repeat) في اللعبة.

`GET /api/games/quiz/random-exclude?ids=1,2,3`

**لماذا هذا الـ endpoint موجود:** الـ API بلا حالة تمامًا — لا يخزّن أي معلومة دائمة عن الأسئلة التي عُرضت سابقًا. البوت (مثلًا بوت واتساب) هو المسؤول عن تتبّع الأسئلة المستخدمة لكل مستخدم/مجموعة، ثم إرسال قائمة تلك الـ `id` مع كل طلب حتى لا يتكرر نفس السؤال.

**مثال الطلب:**

```bash
curl "https://raygumo-api.vercel.app/api/games/quiz/random-exclude?ids=1,2,3"
```

**مثال الاستجابة (200) — سؤال غير موجود ضمن `1,2,3`:**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "question": "من مؤلف رواية مئة عام من العزلة؟",
    "answers": ["غابرييل غارسيا ماركيز"],
    "category": "ثقافة عامة"
  }
}
```

**سلوكيات خاصة:**

- إذا كان معامل `ids` غير موجود أو فارغًا، يعمل هذا الـ endpoint تمامًا مثل `/random` العادي (استثناء لا شيء = كل الأسئلة متاحة).
- إذا استُثنيت **كل** الأسئلة المتاحة (لم يتبقَّ أي سؤال جديد)، يرجع الـ endpoint خطأ `404 NOT_FOUND` واضحًا بدل تكرار سؤال قديم بصمت. على البوت عندها تصفير قائمة الأسئلة المستخدمة والمحاولة من جديد.

راجعي قسم [منع تكرار نفس السؤال](#منع-تكرار-نفس-السؤال-anti-repeat) بالأسفل لنمط تكامل كامل جاهز للنسخ.

---

### `GET /api/games/quiz/count`

ترجع العدد الإجمالي لأسئلة الكويز المتاحة حاليًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/quiz/count
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "count": 260
  }
}
```

---

### `GET /api/games/quiz/:id`

ترجع سؤالًا واحدًا محددًا بالضبط عبر رقمه (`id`)، بدل سؤال عشوائي.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/quiz/2
```

**مثال الاستجابة (200):**

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

**مثال استجابة عند عدم وجود السؤال (404):**

```json
{
  "success": false,
  "message": "No item with id 999999 in \"quiz\"",
  "code": "NOT_FOUND"
}
```

**مثال استجابة عند `id` غير صالح (400):**

```json
{
  "success": false,
  "message": "Invalid id parameter: \"abc\"",
  "code": "BAD_REQUEST"
}
```

---

### `GET /api/games/quiz/all`

ترجع كل أسئلة الكويز كمصفوفة كاملة (260 سؤال حاليًا).

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/quiz/all
```

**مثال الاستجابة (200) — مختصرة:**

```json
{
  "success": true,
  "data": [
    { "id": 1, "question": "ما عاصمة اليابان؟", "answers": ["طوكيو"], "category": "جغرافيا" },
    { "id": 2, "question": "في أي قارة تقع البرازيل؟", "answers": ["أمريكا الجنوبية"], "category": "جغرافيا" }
  ]
}
```

---

## شكل الاستجابة الموحّد

كل endpoint في هذه اللعبة يتّبع نفس الشكل الموحّد المستخدم في كل أنحاء المشروع (راجعي `src/types/api.ts`):

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
  "message": "نص يشرح الخطأ",
  "code": "NOT_FOUND"
}
```

يعني كود البوت ممكن يعمل تحقّق واحد بس (`json.success`) يغطي كل الحالات.

---

## تكامل Baileys جاهز للنسخ

### أمر `!quiz` بسيط

```js
// commands/quiz.js
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getRandomQuiz() {
  const res = await fetch(`${API_BASE}/api/games/quiz/random`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data; // { id, question, answers, category }
}

module.exports = async function handleQuizCommand(sock, msg, chatId) {
  try {
    const question = await getRandomQuiz();
    await sock.sendMessage(chatId, {
      text: `📝 *${question.category}*\n\n${question.question}`,
    });
  } catch (err) {
    console.error("Quiz fetch failed:", err);
    await sock.sendMessage(chatId, { text: "⚠️ تعذر جلب سؤال الآن، حاول لاحقًا." });
  }
};
```

---

## منع تكرار نفس السؤال (Anti-Repeat)

الـ API بلا حالة (stateless) تمامًا — مش بيتذكر أي أسئلة اتقالت قبل كده. البوت هو المسؤول عن التتبّع.

### الخطوات

1. احتفظي بقائمة أرقام الأسئلة المستخدمة لكل مجموعة (في أي تخزين البوت بيستخدمه: `Map`, SQLite, ملف JSON...).
2. نادي على `/random-exclude?ids=...` بدل `/random` العادي، وابعتي فيها الأرقام المستخدمة.
3. لما يرجع سؤال، ضيفي `id`ه لقائمة المستخدم.
4. لو رجع `404` بكود `NOT_FOUND` (يعني الأسئلة خلصت)، صفّري القائمة ونادي تاني.

```js
// state/usedQuestions.js — استبدلي الـ Map بقاعدة بيانات حقيقية لو حابة
const usedQuestionsByGroup = new Map(); // groupId -> Set<number>

function getUsedIds(groupId) {
  return usedQuestionsByGroup.get(groupId) ?? new Set();
}
function markUsed(groupId, id) {
  const set = getUsedIds(groupId);
  set.add(id);
  usedQuestionsByGroup.set(groupId, set);
}
function resetUsed(groupId) {
  usedQuestionsByGroup.set(groupId, new Set());
}

module.exports = { getUsedIds, markUsed, resetUsed };
```

```js
// commands/quiz.js
const { getUsedIds, markUsed, resetUsed } = require("../state/usedQuestions");
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getNextQuiz(groupId) {
  const usedIds = [...getUsedIds(groupId)];
  const idsParam = usedIds.join(",");
  const url = `${API_BASE}/api/games/quiz/random-exclude${idsParam ? `?ids=${idsParam}` : ""}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    if (json.code === "NOT_FOUND") {
      resetUsed(groupId); // كل الأسئلة اتستخدمت — نبدأ من جديد
      return getNextQuiz(groupId);
    }
    throw new Error(json.message);
  }

  markUsed(groupId, json.data.id);
  return json.data;
}
```

---

## التحقق من إجابة المستخدم

مفيش endpoint للتحقق من الإجابة — التحقق بيتم عندك في البوت مباشرة بمقارنة رد المستخدم بمصفوفة `answers`:

```js
function isCorrectAnswer(userReply, question) {
  const normalize = (s) => s.trim().toLowerCase();
  const reply = normalize(userReply);
  return question.answers.some((a) => normalize(a) === reply);
}
```

---

## حالات الأخطاء

| الحالة | الكود (`code`) | حالة HTTP | متى تحدث |
|---|---|---|---|
| السؤال غير موجود | `NOT_FOUND` | 404 | `:id` رقمي صحيح لكن لا يوجد سؤال بهذا الرقم |
| مجموعة الأسئلة فارغة | `NOT_FOUND` | 404 | `questions.json` فارغ أو كل سجلاته غير صالحة |
| كل الأسئلة مستثناة | `NOT_FOUND` | 404 | `random-exclude` استُثنيت فيه كل الأسئلة المتاحة عبر `ids` |
| `id` غير صالح | `BAD_REQUEST` | 400 | قيمة `:id` ليست رقمًا صحيحًا موجبًا (مثل `"abc"` أو `"-1"`) |
| قيمة غير صالحة في `ids` | `BAD_REQUEST` | 400 | أحد عناصر معامل `ids` في `random-exclude` ليس رقمًا صحيحًا موجبًا |
| اسم لعبة غير معروف | `NOT_FOUND` | 404 | حدث فقط لو استُخدم اسم مختلف عن `quiz` في مسار غير متوقع |
| خطأ داخلي غير متوقع | `INTERNAL_ERROR` | 500 | مشكلة غير متوقعة في القراءة أو المعالجة |

نمط موحّد للتعامل مع أي رد من طرف البوت:

```js
async function callApi(path) {
  const res = await fetch(`https://raygumo-api.vercel.app${path}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(`[${json.code ?? "ERROR"}] ${json.message}`);
  }
  return json.data;
}
```

---

## إضافة/تحديث الأسئلة

لتحديث محتوى الكويز:

1. عدّلي `src/data/quiz/questions.json` مباشرة (أضيفي/عدّلي/احذفي عناصر في المصفوفة) — بدون الحاجة لكتابة `id` يدويًا، فهو يُولَّد تلقائيًا حسب ترتيب السؤال في الملف.
2. التزمي بنفس شكل السجل: `question` (نص غير فارغ)، `answers` (مصفوفة غير فارغة من نصوص غير فارغة)، `category` (نص غير فارغ).
3. لاستبدال كل الأسئلة بمجموعتك الخاصة: استبدلي محتوى `src/data/quiz/questions.json` بالكامل.
4. اعملي `commit` وارفعي (`redeploy`) — بدون أي تعديل كود مطلوب.

للحفاظ على استقرار الـ `id` بمرور الوقت، يُفضَّل إضافة الأسئلة الجديدة في **نهاية الملف** بدل إدراجها في المنتصف (راجعي [نظام الـ id](#نظام-الـ-id) أعلاه).
