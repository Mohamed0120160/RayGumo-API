# لعبة خمّن الشخصية من الإيموجي (Emoji Game) — توثيق كامل

هذا الملف يوثّق لعبة "إيموجي" بالتفصيل: بنية البيانات، كل الـ endpoints المتاحة، أمثلة الطلبات والاستجابات، نظام الـ `id`، آلية منع التكرار (`random-exclude`)، وتكامل جاهز مع بوتات واتساب (Baileys).

هذه اللعبة مبنية بنفس بنية لعبة [الألغاز](./docs/riddles.md) بالضبط (نفس الـ endpoints، نفس شكل الاستجابة، ونفس فكرة `answers` كمصفوفة)، لكن مع حقل إضافي هو `category`. إذا كنتِ مطّلعة على أيّ من وثائق الألعاب الأخرى في `docs/`، هذا الملف سيبدو مألوفًا جدًا.

---

## جدول المحتويات

- [وصف اللعبة](#وصف-اللعبة)
- [بنية البيانات](#بنية-البيانات)
- [نظام الـ id](#نظام-الـ-id)
- [الـ Endpoints](#الـ-endpoints)
  - [GET /api/games/emoji/random](#get-apigamesemojirandom)
  - [GET /api/games/emoji/random-exclude](#get-apigamesemojirandom-exclude)
  - [GET /api/games/emoji/all](#get-apigamesemojiall)
  - [GET /api/games/emoji/count](#get-apigamesemojicount)
  - [GET /api/games/emoji/:id](#get-apigamesemojiid)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس السؤال (Anti-Repeat)](#منع-تكرار-نفس-السؤال-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [حالات الأخطاء](#حالات-الأخطاء)
- [إضافة/تحديث الأسئلة](#إضافةتحديث-الأسئلة)

---

## وصف اللعبة

لعبة "إيموجي" تعرض على اللاعب مجموعة إيموجيات تمثّل شخصية أنمي أو شخصية عامة (مثل `🍖 👒 🏴‍☠️`)، وعليه تخمين اسم هذه الشخصية. سؤال واحد قد يقبل **أكثر من صياغة صحيحة للإجابة نفسها** (عربي وإنجليزي معًا، أو أكثر من اسم للشخصية)، لذلك الإجابات تُمثَّل كمصفوفة نصوص (`answers: string[]`)، تمامًا مثل لعبة الألغاز والكويز.

الـ API هنا **مزوّد محتوى فقط** — لا يتحقق من إجابة المستخدم ولا يحتفظ بأي حالة (state) عن تقدّم اللعبة أو نقاط الخبرة أو الترتيب؛ هذا كله مسؤولية البوت المستهلك للـ API. الـ API بلا حالة (stateless) تمامًا.

**ملاحظة مهمة حول شكل المسار الفعلي:** بنية المشروع تعتمد مسارات عامة مشتركة بين كل الألعاب بالشكل `/api/games/[game]/...` (وليس مسار مخصّص منفصل مثل `/api/emoji/...`). لعبة "إيموجي" مسجّلة داخل هذه البنية العامة تحت الاسم (slug) `emoji`، فتصبح كل الروابط بالشكل `/api/games/emoji/...`، بنفس أسلوب `quiz` و`riddles` و`eye` تمامًا، وبدون أي تعديل على بنية الـ routes نفسها.

---

## بنية البيانات

مصدر البيانات الأساسي هو ملف:

```
src/data/emoji/questions.json
```

عبارة عن مصفوفة JSON تحتوي حاليًا **500 سؤال** حقيقي.

شكل كل سؤال كما يظهر في استجابات الـ API:

```json
{
  "id": 1,
  "emoji": "🍖 👒 🏴‍☠️",
  "category": "One Piece",
  "answers": ["لوفي", "مونكي دي لوفي", "luffy", "monkey d luffy"]
}
```

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `number` | معرّف فريد وثابت، **مخزَّن مسبقًا داخل questions.json نفسه** (وليس مولَّدًا وقت التحميل). انظر [نظام الـ id](#نظام-الـ-id) بالأسفل. |
| `emoji` | `string` | نص يحتوي الإيموجيات التي تمثّل الشخصية. دعم كامل لـ UTF-8 وتسلسلات الإيموجي المركّبة. |
| `category` | `string` | تصنيف السؤال (حاليًا اسم الأنمي في كل البيانات المزوَّدة)، ويمكن استخدامه لاحقًا لتصنيفات أخرى غير الأنمي. |
| `answers` | `string[]` | **مصفوفة نصوص**، مش نص واحد. تدعم العربية والإنجليزية وأي مرادفات مطلوبة لنفس الشخصية. تعاملي معاها دايمًا كمصفوفة في البوت، حتى لو السؤال ليه إجابة واحدة بس. |

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `emoji` أو `category` أو `answers` (كمصفوفة غير فارغة من نصوص غير فارغة) يُتجاهل تلقائيًا وقت التحميل ولن يظهر في أي endpoint — دون أن يوقف الـ API بالكامل. لو اتكرر نفس الـ `id` بين سؤالين، أول سؤال بيفوز والباقي بيتجاهل مع تحذير في الـ logs.

---

## نظام الـ id

- الـ `id` **رقم صحيح موجب فريد**، **مخزَّن مسبقًا وصراحة داخل كل سؤال في `questions.json` نفسه** (نفس أسلوب `riddles` و`eye`)، وليس مولَّدًا تلقائيًا حسب الترتيب وقت التحميل.
- عند إضافة أسئلة جديدة يدويًا للملف، **لازم تدي كل سؤال جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1). الـ API يتحقق فقط أن كل `id` رقم صحيح موجب وفريد؛ لا يولّد أي `id` بنفسه.
- هذا الاستقرار أساسي جدًا لأن `id` هو المعرّف الذي تعتمد عليه بوتات الواتساب في نظام منع التكرار (anti-repeat عبر `random-exclude`).
- لو اتكرر نفس الـ `id` بين سؤالين في الملف بالخطأ، أول سؤال بترتيب الظهور يفوز، والباقي يُتجاهل مع تحذير في الـ logs (`console.warn`).

---

## الـ Endpoints

جميع الـ endpoints التالية متاحة على المسار العام المشترك بين كل الألعاب: `/api/games/emoji/...` (نفس نمط `quiz` و`riddles` و`eye` تمامًا).

### `GET /api/games/emoji/random`

ترجع سؤالًا عشوائيًا واحدًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/emoji/random
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "emoji": "🍖 👒 🏴‍☠️",
    "category": "One Piece",
    "answers": ["لوفي", "مونكي دي لوفي", "luffy", "monkey d luffy"]
  }
}
```

---

### `GET /api/games/emoji/random-exclude`

ترجع سؤالًا عشوائيًا واحدًا، مع استثناء أي `id` موجود ضمن قائمة معامل الاستعلام `ids` (مفصولة بفواصل). هذا هو آلية منع التكرار (anti-repeat) في اللعبة.

> **ملاحظة على اسم المعامل:** بنية المشروع العامة تستخدم اسم المعامل `ids` (وليس `exclude`) في كل الألعاب، حفاظًا على نفس الاتفاقية الموحّدة المستخدمة في `quiz` و`riddles` و`eye`.

`GET /api/games/emoji/random-exclude?ids=1,5,8,20`

**مثال الطلب:**

```bash
curl "https://raygumo-api.vercel.app/api/games/emoji/random-exclude?ids=1,5,8,20"
```

**مثال الاستجابة (200) — سؤال غير موجود ضمن `1,5,8,20`:**

```json
{
  "success": true,
  "data": {
    "id": 125,
    "emoji": "🗡️ 👁️ ⚔️",
    "category": "One Piece",
    "answers": ["زورو", "رورونوا زورو", "zoro", "roronoa zoro"]
  }
}
```

**سلوكيات خاصة:**

- إذا كان معامل `ids` غير موجود أو فارغًا، يعمل هذا الـ endpoint تمامًا مثل `/random` العادي (استثناء لا شيء = كل الأسئلة متاحة).
- إذا استُثنيت **كل** الأسئلة المتاحة (لم يتبقَّ أي سؤال جديد)، يرجع الـ endpoint خطأ `404 NOT_FOUND` واضحًا بدل تكرار سؤال قديم بصمت:

```json
{
  "success": false,
  "message": "لا يوجد أي سؤال متبقٍ بعد استثناء كل الأسئلة المُمرَّرة (كل الأسئلة استُخدمت بالفعل)",
  "code": "NOT_FOUND"
}
```

عندها على البوت أن يعيد تصفير قائمة الأسئلة المستخدمة لتلك المجموعة والبدء من جديد.

---

### `GET /api/games/emoji/all`

ترجع كل الأسئلة كمصفوفة كاملة (500 سؤال حاليًا).

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/emoji/all
```

**مثال الاستجابة (200) — مختصرة:**

```json
{
  "success": true,
  "data": [
    { "id": 1, "emoji": "🍖 👒 🏴‍☠️", "category": "One Piece", "answers": ["لوفي", "luffy"] },
    { "id": 2, "emoji": "🗡️ 👁️ ⚔️", "category": "One Piece", "answers": ["زورو", "zoro"] }
  ]
}
```

---

### `GET /api/games/emoji/count`

ترجع العدد الإجمالي للأسئلة المتاحة حاليًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/emoji/count
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "count": 500
  }
}
```

---

### `GET /api/games/emoji/:id`

ترجع سؤالًا واحدًا محددًا بالضبط عبر رقمه (`id`)، بدل سؤال عشوائي.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/emoji/15
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "emoji": "🐉 ⚡ 👦",
    "category": "Dragon Ball",
    "answers": ["غوكو", "goku", "son goku"]
  }
}
```

**مثال استجابة عند عدم وجود السؤال (404):**

```json
{
  "success": false,
  "message": "No item with id 999999 in \"emoji\"",
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

### أمر `!ايموجي` بسيط

```js
// commands/emoji.js
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getRandomEmojiQuestion() {
  const res = await fetch(`${API_BASE}/api/games/emoji/random`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data; // { id, emoji, category, answers }
}

module.exports = async function handleEmojiCommand(sock, msg, chatId) {
  try {
    const question = await getRandomEmojiQuestion();
    await sock.sendMessage(chatId, {
      text: `🎭 *خمّن الشخصية من الإيموجي*\n\n${question.emoji}`,
    });
  } catch (err) {
    console.error("Emoji question fetch failed:", err);
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
// state/usedEmojiQuestions.js — استبدلي الـ Map بقاعدة بيانات حقيقية لو حابة
const usedByGroup = new Map(); // groupId -> Set<number>

function getUsedIds(groupId) {
  return usedByGroup.get(groupId) ?? new Set();
}
function markUsed(groupId, id) {
  const set = getUsedIds(groupId);
  set.add(id);
  usedByGroup.set(groupId, set);
}
function resetUsed(groupId) {
  usedByGroup.set(groupId, new Set());
}

module.exports = { getUsedIds, markUsed, resetUsed };
```

```js
// commands/emoji.js
const { getUsedIds, markUsed, resetUsed } = require("../state/usedEmojiQuestions");
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getNextEmojiQuestion(groupId) {
  const usedIds = [...getUsedIds(groupId)];
  const idsParam = usedIds.join(",");
  const url = `${API_BASE}/api/games/emoji/random-exclude${idsParam ? `?ids=${idsParam}` : ""}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    if (json.code === "NOT_FOUND") {
      resetUsed(groupId); // كل الأسئلة اتستخدمت — نبدأ من جديد
      return getNextEmojiQuestion(groupId);
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

لتحديث محتوى الأسئلة:

1. عدّلي `src/data/emoji/questions.json` مباشرة (أضيفي/عدّلي/احذفي عناصر في المصفوفة).
2. **لازم تدي كل سؤال جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1) — الـ `id` هنا لا يُولَّد تلقائيًا.
3. التزمي بنفس شكل السجل: `id` (رقم صحيح موجب فريد)، `emoji` (نص غير فارغ)، `category` (نص غير فارغ)، `answers` (مصفوفة غير فارغة من نصوص غير فارغة).
4. لاستبدال كل الأسئلة بمجموعتك الخاصة: استبدلي محتوى `src/data/emoji/questions.json` بالكامل (تأكدي أن كل `id` فريد في المجموعة الجديدة).
5. اعملي `commit` وارفعي (`redeploy`) — بدون أي تعديل كود مطلوب.
