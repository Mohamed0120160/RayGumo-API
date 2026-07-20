# لعبة الألغاز (Riddles) — توثيق كامل

هذا الملف يوثّق لعبة الألغاز بالتفصيل: بنية البيانات، كل الـ endpoints المتاحة، أمثلة الطلبات والاستجابات، نظام الـ `id`، آلية منع التكرار (`random-exclude`)، تكامل جاهز مع بوتات واتساب (Baileys)، والتحقق من إجابة المستخدم، وحالات الأخطاء.

هذه اللعبة مبنية بنفس بنية لعبة [الكويز](./quiz.md) بالضبط (نفس الـ endpoints، نفس شكل الاستجابة)، لكن بنظام `id` مخزَّن مسبقًا في الملف — تمامًا مثل لعبة [صح أو خطأ](./true-false.md). إذا كنتِ مطّلعة على أيّ من الوثيقتين، هذا الملف سيبدو مألوفًا جدًا.

---

## جدول المحتويات

- [وصف اللعبة](#وصف-اللعبة)
- [بنية البيانات](#بنية-البيانات)
- [نظام الـ id](#نظام-الـ-id)
- [الـ Endpoints](#الـ-endpoints)
  - [GET /api/games/riddles/random](#get-apigamesriddlesrandom)
  - [GET /api/games/riddles/random-exclude](#get-apigamesriddlesrandom-exclude)
  - [GET /api/games/riddles/all](#get-apigamesriddlesall)
  - [GET /api/games/riddles/count](#get-apigamesriddlescount)
  - [GET /api/games/riddles/:id](#get-apigamesriddlesid)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس اللغز (Anti-Repeat)](#منع-تكرار-نفس-اللغز-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [حالات الأخطاء](#حالات-الأخطاء)
- [إضافة/تحديث الألغاز](#إضافةتحديث-الألغاز)

---

## وصف اللعبة

الألغاز لعبة كلاسيكية: يُعرض على اللاعب نص لغز (`question`) في شكل جملة أو سؤال غير مباشر (مثل "شيء كلما أخذت منه كبر، ما هو؟")، وعليه تخمين الإجابة الصحيحة. بالضبط مثل لعبة الكويز، لغز واحد قد يقبل **أكتر من صياغة صحيحة للإجابة نفسها** (مثلًا "حفرة" و"الحفرة" معًا)، لذلك الإجابات تُمثَّل كمصفوفة نصوص (`answers: string[]`) وليس قيمة واحدة.

على عكس لعبة الكويز، لا يوجد حقل `category` (تصنيف) في هذا الإصدار من لعبة الألغاز — مصدر البيانات الحالي لا يحتوي تصنيفات موضوعية للألغاز.

الـ API هنا **مزوّد محتوى فقط** — لا يتحقق من إجابة المستخدم ولا يحتفظ بأي حالة (state) عن تقدّم اللعبة أو نقاط الخبرة أو الترتيب؛ هذا كله مسؤولية البوت المستهلك للـ API. الـ API بلا حالة (stateless) تمامًا.

---

## بنية البيانات

مصدر البيانات الأساسي هو ملف:

```
src/data/riddles/questions.json
```

عبارة عن مصفوفة JSON تحتوي حاليًا **300 لغز** حقيقي بالعربية.

شكل كل لغز كما يظهر في استجابات الـ API:

```json
{
  "id": 1,
  "question": "شيء كلما أخذت منه كبر، ما هو؟",
  "answers": ["حفرة", "الحفرة"]
}
```

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `number` | معرّف فريد وثابت، **مخزَّن مسبقًا داخل questions.json نفسه** (وليس مولَّدًا وقت التحميل). انظر [نظام الـ id](#نظام-الـ-id) بالأسفل. |
| `question` | `string` | نص اللغز. دعم كامل لـ UTF-8/العربي. |
| `answers` | `string[]` | **مصفوفة نصوص**، مش نص واحد. اللغز ممكن يقبل أكتر من صياغة صحيحة للإجابة. دايمًا تعاملي معاها كمصفوفة في البوت، حتى لو اللغز ليه إجابة واحدة بس. |

> **ملاحظة:** على عكس لعبة الكويز (حيث يُولَّد `id` تلقائيًا حسب ترتيب السؤال وقت التحميل)، حقل `id` هنا **مخزَّن صراحة داخل الملف نفسه** لكل لغز، مرقّم تسلسليًا (1، 2، 3...) — بنفس أسلوب لعبة "صح أو خطأ" تمامًا. راجعي [نظام الـ id](#نظام-الـ-id) للتفاصيل والسبب.

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `question` أو `answers` (كمصفوفة غير فارغة من نصوص غير فارغة) يُتجاهل تلقائيًا وقت التحميل ولن يظهر في أي endpoint — دون أن يوقف الـ API بالكامل. لو اتكرر نفس الـ `id` بين لغزين، أول لغز بيفوز والباقي بيتجاهل مع تحذير في الـ logs.

مجموعة البيانات هذه هي المصدر الوحيد للحقيقة: لا توجد أي ألغاز تجريبية/placeholder في المشروع حاليًا.

---

## نظام الـ id

- الـ `id` **رقم صحيح موجب فريد**، **مخزَّن مسبقًا وصراحة داخل كل لغز في `questions.json` نفسه** — على عكس الكويز حيث يُولَّد تلقائيًا حسب الترتيب وقت التحميل.
- عند إضافة ألغاز جديدة يدويًا للملف، **لازم تدي كل لغز جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1). الـ API يتحقق فقط أن كل `id` رقم صحيح موجب وفريد؛ لا يولّد أي `id` بنفسه.
- **لماذا `id` مخزَّن يدويًا هنا وليس مولَّدًا بالترتيب (كما في الكويز):** هذا يضمن أن `id` أي لغز يبقى **ثابتًا تمامًا** حتى لو أُعيد ترتيب الملف أو أُدرجت ألغاز جديدة في المنتصف مستقبلًا — عكس نظام الكويز حيث إدراج سؤال في المنتصف يغيّر `id` كل ما بعده. هذا الاستقرار أساسي جدًا لأن `id` هو المعرّف الذي تعتمد عليه بوتات الواتساب في نظام منع التكرار (anti-repeat عبر `random-exclude`).
- لو اتكرر نفس الـ `id` بين لغزين في الملف بالخطأ، أول لغز بترتيب الظهور يفوز، والباقي يُتجاهل مع تحذير في الـ logs (`console.warn`) يساعد وقت مراجعة عملية استيراد ألغاز جديدة.

---

## الـ Endpoints

جميع الـ endpoints التالية متاحة على المسار العام المشترك بين كل الألعاب: `/api/games/riddles/...` (نفس نمط `quiz` و`true-false` تمامًا).

### `GET /api/games/riddles/random`

ترجع لغزًا عشوائيًا واحدًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/riddles/random
```

**مثال الاستجابة (200):**

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

---

### `GET /api/games/riddles/random-exclude`

ترجع لغزًا عشوائيًا واحدًا، مع استثناء أي `id` موجود ضمن قائمة معامل الاستعلام `ids` (مفصولة بفواصل). هذا هو آلية منع التكرار (anti-repeat) في اللعبة.

`GET /api/games/riddles/random-exclude?ids=1,5,8,20`

**لماذا هذا الـ endpoint موجود:** الـ API بلا حالة تمامًا — لا يخزّن أي معلومة دائمة عن الألغاز التي عُرضت سابقًا. البوت (مثلًا بوت واتساب) هو المسؤول عن تتبّع الألغاز المستخدمة لكل مستخدم/مجموعة، ثم إرسال قائمة تلك الـ `id` مع كل طلب حتى لا يتكرر نفس اللغز.

**مثال الطلب:**

```bash
curl "https://raygumo-api.vercel.app/api/games/riddles/random-exclude?ids=1,5,8,20"
```

**مثال الاستجابة (200) — لغز غير موجود ضمن `1,5,8,20`:**

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

**سلوكيات خاصة:**

- إذا كان معامل `ids` غير موجود أو فارغًا، يعمل هذا الـ endpoint تمامًا مثل `/random` العادي (استثناء لا شيء = كل الألغاز متاحة).
- إذا استُثنيت **كل** الألغاز المتاحة (لم يتبقَّ أي لغز جديد)، يرجع الـ endpoint خطأ `404 NOT_FOUND` واضحًا بدل تكرار لغز قديم بصمت. على البوت عندها تصفير قائمة الألغاز المستخدمة والمحاولة من جديد.

راجعي قسم [منع تكرار نفس اللغز](#منع-تكرار-نفس-اللغز-anti-repeat) بالأسفل لنمط تكامل كامل جاهز للنسخ.

---

### `GET /api/games/riddles/all`

ترجع كل الألغاز كمصفوفة كاملة (300 لغز حاليًا).

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/riddles/all
```

**مثال الاستجابة (200) — مختصرة:**

```json
{
  "success": true,
  "data": [
    { "id": 1, "question": "شيء كلما أخذت منه كبر، ما هو؟", "answers": ["حفرة", "الحفرة"] },
    { "id": 2, "question": "ما الشيء الذي له أسنان ولا يعض؟", "answers": ["المشط", "مشط"] }
  ]
}
```

---

### `GET /api/games/riddles/count`

ترجع العدد الإجمالي للألغاز المتاحة حاليًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/riddles/count
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "count": 300
  }
}
```

---

### `GET /api/games/riddles/:id`

ترجع لغزًا واحدًا محددًا بالضبط عبر رقمه (`id`)، بدل لغز عشوائي.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/riddles/125
```

**مثال الاستجابة (200):**

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

**مثال استجابة عند عدم وجود اللغز (404):**

```json
{
  "success": false,
  "message": "No item with id 999999 in \"riddles\"",
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

### أمر `!لغز` بسيط

```js
// commands/riddle.js
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getRandomRiddle() {
  const res = await fetch(`${API_BASE}/api/games/riddles/random`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data; // { id, question, answers }
}

module.exports = async function handleRiddleCommand(sock, msg, chatId) {
  try {
    const riddle = await getRandomRiddle();
    await sock.sendMessage(chatId, {
      text: `🧩 *لغز*\n\n${riddle.question}`,
    });
  } catch (err) {
    console.error("Riddle fetch failed:", err);
    await sock.sendMessage(chatId, { text: "⚠️ تعذر جلب لغز الآن، حاول لاحقًا." });
  }
};
```

---

## منع تكرار نفس اللغز (Anti-Repeat)

الـ API بلا حالة (stateless) تمامًا — مش بيتذكر أي ألغاز اتقالت قبل كده. البوت هو المسؤول عن التتبّع.

### الخطوات

1. احتفظي بقائمة أرقام الألغاز المستخدمة لكل مجموعة (في أي تخزين البوت بيستخدمه: `Map`, SQLite, ملف JSON...).
2. نادي على `/random-exclude?ids=...` بدل `/random` العادي، وابعتي فيها الأرقام المستخدمة.
3. لما يرجع لغز، ضيفي `id`ه لقائمة المستخدم.
4. لو رجع `404` بكود `NOT_FOUND` (يعني الألغاز خلصت)، صفّري القائمة ونادي تاني.

```js
// state/usedRiddles.js — استبدلي الـ Map بقاعدة بيانات حقيقية لو حابة
const usedRiddlesByGroup = new Map(); // groupId -> Set<number>

function getUsedIds(groupId) {
  return usedRiddlesByGroup.get(groupId) ?? new Set();
}
function markUsed(groupId, id) {
  const set = getUsedIds(groupId);
  set.add(id);
  usedRiddlesByGroup.set(groupId, set);
}
function resetUsed(groupId) {
  usedRiddlesByGroup.set(groupId, new Set());
}

module.exports = { getUsedIds, markUsed, resetUsed };
```

```js
// commands/riddle.js
const { getUsedIds, markUsed, resetUsed } = require("../state/usedRiddles");
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getNextRiddle(groupId) {
  const usedIds = [...getUsedIds(groupId)];
  const idsParam = usedIds.join(",");
  const url = `${API_BASE}/api/games/riddles/random-exclude${idsParam ? `?ids=${idsParam}` : ""}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    if (json.code === "NOT_FOUND") {
      resetUsed(groupId); // كل الألغاز اتستخدمت — نبدأ من جديد
      return getNextRiddle(groupId);
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
function isCorrectAnswer(userReply, riddle) {
  const normalize = (s) => s.trim().toLowerCase();
  const reply = normalize(userReply);
  return riddle.answers.some((a) => normalize(a) === reply);
}
```

---

## حالات الأخطاء

| الحالة | الكود (`code`) | حالة HTTP | متى تحدث |
|---|---|---|---|
| اللغز غير موجود | `NOT_FOUND` | 404 | `:id` رقمي صحيح لكن لا يوجد لغز بهذا الرقم |
| مجموعة الألغاز فارغة | `NOT_FOUND` | 404 | `questions.json` فارغ أو كل سجلاته غير صالحة |
| كل الألغاز مستثناة | `NOT_FOUND` | 404 | `random-exclude` استُثنيت فيه كل الألغاز المتاحة عبر `ids` |
| `id` غير صالح | `BAD_REQUEST` | 400 | قيمة `:id` ليست رقمًا صحيحًا موجبًا (مثل `"abc"` أو `"-1"`) |
| قيمة غير صالحة في `ids` | `BAD_REQUEST` | 400 | أحد عناصر معامل `ids` في `random-exclude` ليس رقمًا صحيحًا موجبًا |
| اسم لعبة غير معروف | `NOT_FOUND` | 404 | حدث فقط لو استُخدم اسم مختلف عن `riddles` في مسار غير متوقع |
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

## إضافة/تحديث الألغاز

لتحديث محتوى الألغاز:

1. عدّلي `src/data/riddles/questions.json` مباشرة (أضيفي/عدّلي/احذفي عناصر في المصفوفة).
2. **لازم تديّي كل لغز جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1) — على عكس الكويز، الـ `id` هنا لا يُولَّد تلقائيًا.
3. التزمي بنفس شكل السجل: `id` (رقم صحيح موجب فريد)، `question` (نص غير فارغ)، `answers` (مصفوفة غير فارغة من نصوص غير فارغة).
4. لاستبدال كل الألغاز بمجموعتك الخاصة: استبدلي محتوى `src/data/riddles/questions.json` بالكامل (تأكدي أن كل `id` فريد في المجموعة الجديدة).
5. اعملي `commit` وارفعي (`redeploy`) — بدون أي تعديل كود مطلوب.
