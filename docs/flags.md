# لعبة أعلام (Flags) — توثيق كامل

هذا الملف يوثّق لعبة "أعلام" بالتفصيل: بنية البيانات، كل الـ endpoints المتاحة، أمثلة الطلبات والاستجابات، نظام الـ `id`، آلية منع التكرار (`random-exclude`)، تكامل جاهز مع بوتات واتساب (Baileys)، والتحقق من إجابة المستخدم، وحالات الأخطاء.

هذه اللعبة مبنية بنفس بنية لعبة [عين](./eye.md) في نظام الـ `id` (مخزَّن مسبقًا في الملف)، ونفس بنية لعبة [الألغاز](./riddles.md) و[الكويز](./quiz.md) في شكل الإجابات (`answers[]` مصفوفة صياغات متعددة). إذا كنتِ مطّلعة على أيّ من هذه الوثائق، هذا الملف سيبدو مألوفًا جدًا.

---

## جدول المحتويات

- [وصف اللعبة](#وصف-اللعبة)
- [بنية البيانات](#بنية-البيانات)
- [نظام الـ id](#نظام-الـ-id)
- [الـ Endpoints](#الـ-endpoints)
  - [GET /api/games/flags/random](#get-apigamesflagsrandom)
  - [GET /api/games/flags/random-exclude](#get-apigamesflagsrandom-exclude)
  - [GET /api/games/flags/all](#get-apigamesflagsall)
  - [GET /api/games/flags/count](#get-apigamesflagscount)
  - [GET /api/games/flags/:id](#get-apigamesflagsid)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس العلم (Anti-Repeat)](#منع-تكرار-نفس-العلم-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [حالات الأخطاء](#حالات-الأخطاء)
- [إضافة/تحديث عناصر أعلام](#إضافةتحديث-عناصر-أعلام)

---

## وصف اللعبة

"أعلام" لعبة تخمين بصرية: تُعرض على اللاعب صورة علم دولة (`flag`) أو إيموجي العلم (`emoji`)، وعليه تخمين اسم الدولة. كل دولة قد يكون لها أكثر من صياغة مقبولة للاسم (مثل "أفغانستان" و"افغانستان" و"جمهورية أفغانستان الإسلامية")، لذلك حقل الإجابة هنا مصفوفة (`answers[]`) - بنفس أسلوب لعبتَي الألغاز والكويز، وليس نصًا مفردًا كما في لعبة عين.

الـ API هنا **مزوّد محتوى فقط** — لا يتحقق من إجابة المستخدم ولا يحتفظ بأي حالة (state) عن تقدّم اللعبة أو نقاط الخبرة أو الترتيب؛ هذا كله مسؤولية البوت المستهلك للـ API. الـ API بلا حالة (stateless) تمامًا.

---

## بنية البيانات

مصدر البيانات الأساسي هو ملف:

```
src/data/flags/questions.json
```

عبارة عن مصفوفة JSON تحتوي حاليًا **195 دولة**.

شكل كل عنصر كما يظهر في استجابات الـ API:

```json
{
  "id": 1,
  "flag": "https://flagcdn.com/w1280/af.png",
  "emoji": "🇦🇫",
  "answers": ["أفغانستان", "افغانستان", "جمهورية أفغانستان الإسلامية"]
}
```

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `number` | معرّف فريد وثابت، **مخزَّن مسبقًا داخل questions.json نفسه** (وليس مولَّدًا وقت التحميل). انظر [نظام الـ id](#نظام-الـ-id) بالأسفل. |
| `flag` | `string` | رابط صورة علم الدولة المعروضة على اللاعب. |
| `emoji` | `string` | إيموجي علم الدولة - مفيد للبوتات التي تريد إرسال رسالة نصية فقط بدون صورة. |
| `answers` | `string[]` | مصفوفة صياغات الاسم الصحيحة المقبولة لهذه الدولة. **مصفوفة نصوص دائمًا، وليست نصًا مفردًا** (على عكس `name` في لعبة عين). |

> **ملاحظة:** حقل `id` مخزَّن صراحة داخل الملف نفسه لكل عنصر، مرقّم تسلسليًا (1، 2، 3...) — بنفس أسلوب لعبة "عين" تمامًا. راجعي [نظام الـ id](#نظام-الـ-id) للتفاصيل والسبب.

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `flag` أو `emoji` (كلاهما نص غير فارغ) أو `answers` (مصفوفة غير فارغة من نصوص غير فارغة) يُتجاهل تلقائيًا وقت التحميل ولن يظهر في أي endpoint - دون أن يوقف الـ API بالكامل. لو اتكرر نفس الـ `id` بين عنصرين، أول عنصر بيفوز والباقي بيتجاهل مع تحذير في الـ logs.

---

## نظام الـ id

- الـ `id` **رقم صحيح موجب فريد**، **مخزَّن مسبقًا وصراحة داخل كل عنصر في `questions.json` نفسه** - على عكس الكويز حيث يُولَّد تلقائيًا حسب الترتيب وقت التحميل.
- عند إضافة عناصر جديدة يدويًا للملف، **لازم تدي كل عنصر جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1). الـ API يتحقق فقط أن كل `id` رقم صحيح موجب وفريد؛ لا يولّد أي `id` بنفسه.
- **لماذا `id` مخزَّن يدويًا هنا وليس مولَّدًا بالترتيب (كما في الكويز):** هذا يضمن أن `id` أي عنصر يبقى **ثابتًا تمامًا** حتى لو أُعيد ترتيب الملف أو أُدرجت عناصر جديدة في المنتصف مستقبلًا. هذا الاستقرار أساسي جدًا لأن `id` هو المعرّف الذي تعتمد عليه بوتات الواتساب في نظام منع التكرار (anti-repeat عبر `random-exclude`).
- لو اتكرر نفس الـ `id` بين عنصرين في الملف بالخطأ، أول عنصر بترتيب الظهور يفوز، والباقي يُتجاهل مع تحذير في الـ logs (`console.warn`) يساعد وقت مراجعة عملية استيراد عناصر جديدة.

---

## الـ Endpoints

جميع الـ endpoints التالية متاحة على المسار العام المشترك بين كل الألعاب: `/api/games/flags/...` (نفس نمط `quiz` و`eye` و`riddles` تمامًا).

### `GET /api/games/flags/random`

ترجع عنصر "أعلام" عشوائيًا واحدًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/flags/random
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "flag": "https://flagcdn.com/w1280/af.png",
    "emoji": "🇦🇫",
    "answers": ["أفغانستان", "افغانستان", "جمهورية أفغانستان الإسلامية"]
  }
}
```

---

### `GET /api/games/flags/random-exclude`

ترجع عنصرًا عشوائيًا واحدًا، مع استثناء أي `id` موجود ضمن قائمة معامل الاستعلام `ids` (مفصولة بفواصل). هذا هو آلية منع التكرار (anti-repeat) في اللعبة.

`GET /api/games/flags/random-exclude?ids=1,5,8,20`

**لماذا هذا الـ endpoint موجود:** الـ API بلا حالة تمامًا - لا يخزّن أي معلومة دائمة عن الأعلام التي عُرضت سابقًا. البوت (مثلًا بوت واتساب) هو المسؤول عن تتبّع العناصر المستخدمة لكل مستخدم/مجموعة، ثم إرسال قائمة تلك الـ `id` مع كل طلب حتى لا يتكرر نفس العلم.

**مثال الطلب:**

```bash
curl "https://raygumo-api.vercel.app/api/games/flags/random-exclude?ids=1,5,8,20"
```

**سلوكيات خاصة:**

- إذا كان معامل `ids` غير موجود أو فارغًا، يعمل هذا الـ endpoint تمامًا مثل `/random` العادي (استثناء لا شيء = كل العناصر متاحة).
- إذا استُثنيت **كل** العناصر المتاحة (لم يتبقَّ أي عنصر جديد)، يرجع الـ endpoint خطأ `404 NOT_FOUND` واضحًا بدل تكرار علم قديم بصمت. على البوت عندها تصفير قائمة العناصر المستخدمة والمحاولة من جديد.

راجعي قسم [منع تكرار نفس العلم](#منع-تكرار-نفس-العلم-anti-repeat) بالأسفل لنمط تكامل كامل جاهز للنسخ.

---

### `GET /api/games/flags/all`

ترجع كل عناصر "أعلام" كمصفوفة كاملة (195 دولة حاليًا).

```bash
curl https://raygumo-api.vercel.app/api/games/flags/all
```

---

### `GET /api/games/flags/count`

ترجع العدد الإجمالي لعناصر "أعلام" المتاحة حاليًا.

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": { "count": 195 }
}
```

---

### `GET /api/games/flags/:id`

ترجع عنصرًا واحدًا محددًا بالضبط عبر رقمه (`id`)، بدل عنصر عشوائي.

```bash
curl https://raygumo-api.vercel.app/api/games/flags/1
```

**مثال استجابة عند عدم وجود العنصر (404):**

```json
{
  "success": false,
  "message": "No item with id 999999 in \"flags\"",
  "code": "NOT_FOUND"
}
```

---

## شكل الاستجابة الموحّد

كل endpoint في هذه اللعبة يتّبع نفس الشكل الموحّد المستخدم في كل أنحاء المشروع (راجعي `src/types/api.ts`):

**نجاح:**

```json
{ "success": true, "data": { } }
```

**خطأ:**

```json
{ "success": false, "message": "نص يشرح الخطأ", "code": "NOT_FOUND" }
```

---

## تكامل Baileys جاهز للنسخ

### أمر `!علم` بسيط

```js
// commands/flags.js
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getRandomFlagItem() {
  const res = await fetch(`${API_BASE}/api/games/flags/random`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data; // { id, flag, emoji, answers }
}

module.exports = async function handleFlagsCommand(sock, msg, chatId) {
  try {
    const item = await getRandomFlagItem();
    await sock.sendMessage(chatId, {
      image: { url: item.flag },
      caption: `🚩 *أعلام*\n\nإيه اسم الدولة دي؟ ${item.emoji}`,
    });
  } catch (err) {
    console.error("Flags fetch failed:", err);
    await sock.sendMessage(chatId, { text: "⚠️ تعذر جلب علم الآن، حاول لاحقًا." });
  }
};
```

---

## منع تكرار نفس العلم (Anti-Repeat)

الـ API بلا حالة (stateless) تمامًا - مش بيتذكر أي أعلام اتعرضت قبل كده. البوت هو المسؤول عن التتبّع.

### الخطوات

1. احتفظي بقائمة أرقام العناصر المستخدمة لكل مجموعة.
2. نادي على `/random-exclude?ids=...` بدل `/random` العادي.
3. لما يرجع علم، ضيفي `id`ه لقائمة المستخدم.
4. لو رجع `404` بكود `NOT_FOUND` (يعني الأعلام خلصت)، صفّري القائمة ونادي تاني.

```js
// state/usedFlagItems.js
const usedFlagItemsByGroup = new Map(); // groupId -> Set<number>

function getUsedIds(groupId) {
  return usedFlagItemsByGroup.get(groupId) ?? new Set();
}
function markUsed(groupId, id) {
  const set = getUsedIds(groupId);
  set.add(id);
  usedFlagItemsByGroup.set(groupId, set);
}
function resetUsed(groupId) {
  usedFlagItemsByGroup.set(groupId, new Set());
}

module.exports = { getUsedIds, markUsed, resetUsed };
```

```js
// commands/flags.js
const { getUsedIds, markUsed, resetUsed } = require("../state/usedFlagItems");
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getNextFlagItem(groupId) {
  const usedIds = [...getUsedIds(groupId)];
  const idsParam = usedIds.join(",");
  const url = `${API_BASE}/api/games/flags/random-exclude${idsParam ? `?ids=${idsParam}` : ""}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    if (json.code === "NOT_FOUND") {
      resetUsed(groupId); // كل الأعلام اتستخدمت — نبدأ من جديد
      return getNextFlagItem(groupId);
    }
    throw new Error(json.message);
  }

  markUsed(groupId, json.data.id);
  return json.data;
}
```

---

## التحقق من إجابة المستخدم

مفيش endpoint للتحقق من الإجابة - التحقق بيتم عندك في البوت مباشرة بمقارنة رد المستخدم بأي عنصر من `answers[]`:

```js
function isCorrectAnswer(userReply, item) {
  const normalize = (s) => s.trim().toLowerCase();
  const reply = normalize(userReply);
  return item.answers.some((a) => normalize(a) === reply);
}
```

---

## حالات الأخطاء

| الحالة | الكود (`code`) | حالة HTTP | متى تحدث |
|---|---|---|---|
| العنصر غير موجود | `NOT_FOUND` | 404 | `:id` رقمي صحيح لكن لا يوجد عنصر بهذا الرقم |
| مجموعة العناصر فارغة | `NOT_FOUND` | 404 | `questions.json` فارغ أو كل سجلاته غير صالحة |
| كل العناصر مستثناة | `NOT_FOUND` | 404 | `random-exclude` استُثنيت فيه كل العناصر المتاحة عبر `ids` |
| `id` غير صالح | `BAD_REQUEST` | 400 | قيمة `:id` ليست رقمًا صحيحًا موجبًا (مثل `"abc"` أو `"-1"`) |
| قيمة غير صالحة في `ids` | `BAD_REQUEST` | 400 | أحد عناصر معامل `ids` في `random-exclude` ليس رقمًا صحيحًا موجبًا |
| اسم لعبة غير معروف | `NOT_FOUND` | 404 | حدث فقط لو استُخدم اسم مختلف عن `flags` في مسار غير متوقع |
| خطأ داخلي غير متوقع | `INTERNAL_ERROR` | 500 | مشكلة غير متوقعة في القراءة أو المعالجة |

---

## إضافة/تحديث عناصر أعلام

1. عدّلي `src/data/flags/questions.json` مباشرة (أضيفي/عدّلي/احذفي عناصر في المصفوفة).
2. **لازم تديّي كل عنصر جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1) - الـ `id` هنا لا يُولَّد تلقائيًا.
3. التزمي بنفس شكل السجل: `id` (رقم صحيح موجب فريد)، `flag` (نص غير فارغ - رابط صورة صالح)، `emoji` (نص غير فارغ)، `answers` (مصفوفة غير فارغة من نصوص غير فارغة).
4. اعملي `commit` وارفعي (`redeploy`) - بدون أي تعديل كود مطلوب.
