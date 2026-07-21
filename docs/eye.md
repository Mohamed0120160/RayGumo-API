# لعبة عين (Eye) — توثيق كامل

هذا الملف يوثّق لعبة "عين" بالتفصيل: بنية البيانات، كل الـ endpoints المتاحة، أمثلة الطلبات والاستجابات، نظام الـ `id`، آلية منع التكرار (`random-exclude`)، تكامل جاهز مع بوتات واتساب (Baileys)، والتحقق من إجابة المستخدم، وحالات الأخطاء.

هذه اللعبة مبنية بنفس بنية لعبة [الألغاز](./riddles.md) و[صح أو خطأ](./true-false.md) بالضبط (نفس الـ endpoints، نفس شكل الاستجابة، ونظام `id` مخزَّن مسبقًا في الملف). إذا كنتِ مطّلعة على أيّ من الوثيقتين، هذا الملف سيبدو مألوفًا جدًا.

---

## جدول المحتويات

- [وصف اللعبة](#وصف-اللعبة)
- [بنية البيانات](#بنية-البيانات)
- [نظام الـ id](#نظام-الـ-id)
- [الـ Endpoints](#الـ-endpoints)
  - [GET /api/games/eye/random](#get-apigameseyerandom)
  - [GET /api/games/eye/random-exclude](#get-apigameseyerandom-exclude)
  - [GET /api/games/eye/all](#get-apigameseyeall)
  - [GET /api/games/eye/count](#get-apigameseyecount)
  - [GET /api/games/eye/:id](#get-apigameseyeid)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس الصورة (Anti-Repeat)](#منع-تكرار-نفس-الصورة-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [حالات الأخطاء](#حالات-الأخطاء)
- [إضافة/تحديث عناصر عين](#إضافةتحديث-عناصر-عين)

---

## وصف اللعبة

"عين" لعبة تخمين بصرية: تُعرض على اللاعب صورة واحدة (`img`) تحتوي شخصية أو عنصرًا معينًا، وعليه تخمين اسم الشخصية أو العنصر الظاهر فيها (`name`). على عكس لعبة الألغاز والكويز، لا توجد هنا مصفوفة إجابات متعددة الصياغات — كل عنصر له اسم واحد فقط يمثّل الإجابة الصحيحة.

الـ API هنا **مزوّد محتوى فقط** — لا يتحقق من إجابة المستخدم ولا يحتفظ بأي حالة (state) عن تقدّم اللعبة أو نقاط الخبرة أو الترتيب؛ هذا كله مسؤولية البوت المستهلك للـ API. الـ API بلا حالة (stateless) تمامًا.

---

## بنية البيانات

مصدر البيانات الأساسي هو ملف:

```
src/data/eye/questions.json
```

عبارة عن مصفوفة JSON تحتوي حاليًا **130 عنصرًا** حقيقيًا (بعد إزالة التكرارات من المصدر الأصلي).

شكل كل عنصر كما يظهر في استجابات الـ API:

```json
{
  "id": 1,
  "img": "https://telegra.ph/file/fe1a351860083053b5f4b.jpg",
  "name": "لايت"
}
```

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `number` | معرّف فريد وثابت، **مخزَّن مسبقًا داخل questions.json نفسه** (وليس مولَّدًا وقت التحميل). انظر [نظام الـ id](#نظام-الـ-id) بالأسفل. |
| `img` | `string` | رابط الصورة المعروضة على اللاعب. |
| `name` | `string` | اسم الشخصية أو العنصر الظاهر في الصورة - وهو الإجابة الصحيحة المتوقعة من اللاعب. **نص مفرد وليس مصفوفة** (على عكس `answers` في لعبة الألغاز/الكويز). |

> **ملاحظة:** حقل `id` مخزَّن صراحة داخل الملف نفسه لكل عنصر، مرقّم تسلسليًا (1، 2، 3...) — بنفس أسلوب لعبتَي "الألغاز" و"صح أو خطأ" تمامًا. راجعي [نظام الـ id](#نظام-الـ-id) للتفاصيل والسبب.

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `img` أو `name` (كلاهما نص غير فارغ) يُتجاهل تلقائيًا وقت التحميل ولن يظهر في أي endpoint - دون أن يوقف الـ API بالكامل. لو اتكرر نفس الـ `id` بين عنصرين، أول عنصر بيفوز والباقي بيتجاهل مع تحذير في الـ logs.

**ملاحظة عن إعداد البيانات:** مجموعة البيانات المصدرية الأصلية احتوت على تكرارات (نفس رابط الصورة أو نفس الاسم مكرر أكثر من مرة). قبل بناء هذه اللعبة، تمت إزالة كل التكرارات بحيث يبقى عنصر واحد فقط لكل صورة/اسم فريد، ثم أُضيف حقل `id` تسلسليًا لكل عنصر متبقٍ.

---

## نظام الـ id

- الـ `id` **رقم صحيح موجب فريد**، **مخزَّن مسبقًا وصراحة داخل كل عنصر في `questions.json` نفسه** - على عكس الكويز حيث يُولَّد تلقائيًا حسب الترتيب وقت التحميل.
- عند إضافة عناصر جديدة يدويًا للملف، **لازم تدي كل عنصر جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1). الـ API يتحقق فقط أن كل `id` رقم صحيح موجب وفريد؛ لا يولّد أي `id` بنفسه.
- **لماذا `id` مخزَّن يدويًا هنا وليس مولَّدًا بالترتيب (كما في الكويز):** هذا يضمن أن `id` أي عنصر يبقى **ثابتًا تمامًا** حتى لو أُعيد ترتيب الملف أو أُدرجت عناصر جديدة في المنتصف مستقبلًا. هذا الاستقرار أساسي جدًا لأن `id` هو المعرّف الذي تعتمد عليه بوتات الواتساب في نظام منع التكرار (anti-repeat عبر `random-exclude`).
- لو اتكرر نفس الـ `id` بين عنصرين في الملف بالخطأ، أول عنصر بترتيب الظهور يفوز، والباقي يُتجاهل مع تحذير في الـ logs (`console.warn`) يساعد وقت مراجعة عملية استيراد عناصر جديدة.

---

## الـ Endpoints

جميع الـ endpoints التالية متاحة على المسار العام المشترك بين كل الألعاب: `/api/games/eye/...` (نفس نمط `quiz` و`true-false` و`riddles` تمامًا).

### `GET /api/games/eye/random`

ترجع عنصر "عين" عشوائيًا واحدًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/eye/random
```

**مثال الاستجابة (200):**

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

---

### `GET /api/games/eye/random-exclude`

ترجع عنصرًا عشوائيًا واحدًا، مع استثناء أي `id` موجود ضمن قائمة معامل الاستعلام `ids` (مفصولة بفواصل). هذا هو آلية منع التكرار (anti-repeat) في اللعبة.

`GET /api/games/eye/random-exclude?ids=1,5,8,20`

**لماذا هذا الـ endpoint موجود:** الـ API بلا حالة تمامًا - لا يخزّن أي معلومة دائمة عن الصور التي عُرضت سابقًا. البوت (مثلًا بوت واتساب) هو المسؤول عن تتبّع العناصر المستخدمة لكل مستخدم/مجموعة، ثم إرسال قائمة تلك الـ `id` مع كل طلب حتى لا تتكرر نفس الصورة.

**مثال الطلب:**

```bash
curl "https://raygumo-api.vercel.app/api/games/eye/random-exclude?ids=1,5,8,20"
```

**مثال الاستجابة (200) — عنصر غير موجود ضمن `1,5,8,20`:**

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

**سلوكيات خاصة:**

- إذا كان معامل `ids` غير موجود أو فارغًا، يعمل هذا الـ endpoint تمامًا مثل `/random` العادي (استثناء لا شيء = كل العناصر متاحة).
- إذا استُثنيت **كل** العناصر المتاحة (لم يتبقَّ أي عنصر جديد)، يرجع الـ endpoint خطأ `404 NOT_FOUND` واضحًا بدل تكرار صورة قديمة بصمت. على البوت عندها تصفير قائمة العناصر المستخدمة والمحاولة من جديد.

راجعي قسم [منع تكرار نفس الصورة](#منع-تكرار-نفس-الصورة-anti-repeat) بالأسفل لنمط تكامل كامل جاهز للنسخ.

---

### `GET /api/games/eye/all`

ترجع كل عناصر "عين" كمصفوفة كاملة (130 عنصرًا حاليًا).

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/eye/all
```

**مثال الاستجابة (200) — مختصرة:**

```json
{
  "success": true,
  "data": [
    { "id": 1, "img": "https://telegra.ph/file/fe1a351860083053b5f4b.jpg", "name": "لايت" },
    { "id": 2, "img": "https://telegra.ph/file/c07e6cab9a529b1339f58.jpg", "name": "رين" }
  ]
}
```

---

### `GET /api/games/eye/count`

ترجع العدد الإجمالي لعناصر "عين" المتاحة حاليًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/eye/count
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "count": 130
  }
}
```

---

### `GET /api/games/eye/:id`

ترجع عنصرًا واحدًا محددًا بالضبط عبر رقمه (`id`)، بدل عنصر عشوائي.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/eye/15
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "img": "https://telegra.ph/file/example15.jpg",
    "name": "روبين"
  }
}
```

**مثال استجابة عند عدم وجود العنصر (404):**

```json
{
  "success": false,
  "message": "No item with id 999999 in \"eye\"",
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

### أمر `!عين` بسيط

```js
// commands/eye.js
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getRandomEyeItem() {
  const res = await fetch(`${API_BASE}/api/games/eye/random`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data; // { id, img, name }
}

module.exports = async function handleEyeCommand(sock, msg, chatId) {
  try {
    const item = await getRandomEyeItem();
    await sock.sendMessage(chatId, {
      image: { url: item.img },
      caption: "👁️ *عين*\n\nمين الشخصية دي؟",
    });
  } catch (err) {
    console.error("Eye fetch failed:", err);
    await sock.sendMessage(chatId, { text: "⚠️ تعذر جلب صورة الآن، حاول لاحقًا." });
  }
};
```

---

## منع تكرار نفس الصورة (Anti-Repeat)

الـ API بلا حالة (stateless) تمامًا - مش بيتذكر أي صور اتعرضت قبل كده. البوت هو المسؤول عن التتبّع.

### الخطوات

1. احتفظي بقائمة أرقام العناصر المستخدمة لكل مجموعة (في أي تخزين البوت بيستخدمه: `Map`, SQLite, ملف JSON...).
2. نادي على `/random-exclude?ids=...` بدل `/random` العادي، وابعتي فيها الأرقام المستخدمة.
3. لما ترجع صورة، ضيفي `id`ها لقائمة المستخدم.
4. لو رجع `404` بكود `NOT_FOUND` (يعني الصور خلصت)، صفّري القائمة ونادي تاني.

```js
// state/usedEyeItems.js — استبدلي الـ Map بقاعدة بيانات حقيقية لو حابة
const usedEyeItemsByGroup = new Map(); // groupId -> Set<number>

function getUsedIds(groupId) {
  return usedEyeItemsByGroup.get(groupId) ?? new Set();
}
function markUsed(groupId, id) {
  const set = getUsedIds(groupId);
  set.add(id);
  usedEyeItemsByGroup.set(groupId, set);
}
function resetUsed(groupId) {
  usedEyeItemsByGroup.set(groupId, new Set());
}

module.exports = { getUsedIds, markUsed, resetUsed };
```

```js
// commands/eye.js
const { getUsedIds, markUsed, resetUsed } = require("../state/usedEyeItems");
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getNextEyeItem(groupId) {
  const usedIds = [...getUsedIds(groupId)];
  const idsParam = usedIds.join(",");
  const url = `${API_BASE}/api/games/eye/random-exclude${idsParam ? `?ids=${idsParam}` : ""}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    if (json.code === "NOT_FOUND") {
      resetUsed(groupId); // كل الصور اتستخدمت — نبدأ من جديد
      return getNextEyeItem(groupId);
    }
    throw new Error(json.message);
  }

  markUsed(groupId, json.data.id);
  return json.data;
}
```

---

## التحقق من إجابة المستخدم

مفيش endpoint للتحقق من الإجابة - التحقق بيتم عندك في البوت مباشرة بمقارنة رد المستخدم بحقل `name`:

```js
function isCorrectAnswer(userReply, item) {
  const normalize = (s) => s.trim().toLowerCase();
  return normalize(userReply) === normalize(item.name);
}
```

> ملاحظة: على عكس لعبة الألغاز والكويز، لا توجد هنا صياغات إجابة بديلة (`answers[]`) - المقارنة تكون مع القيمة الواحدة في `name` فقط. لو حبيتي دعم تشابه تقريبي (زي حروف زيادة أو نقصان)، ممكن تستخدمي مكتبة مسافة تحرير (Levenshtein) من طرف البوت.

---

## حالات الأخطاء

| الحالة | الكود (`code`) | حالة HTTP | متى تحدث |
|---|---|---|---|
| العنصر غير موجود | `NOT_FOUND` | 404 | `:id` رقمي صحيح لكن لا يوجد عنصر بهذا الرقم |
| مجموعة العناصر فارغة | `NOT_FOUND` | 404 | `questions.json` فارغ أو كل سجلاته غير صالحة |
| كل العناصر مستثناة | `NOT_FOUND` | 404 | `random-exclude` استُثنيت فيه كل العناصر المتاحة عبر `ids` |
| `id` غير صالح | `BAD_REQUEST` | 400 | قيمة `:id` ليست رقمًا صحيحًا موجبًا (مثل `"abc"` أو `"-1"`) |
| قيمة غير صالحة في `ids` | `BAD_REQUEST` | 400 | أحد عناصر معامل `ids` في `random-exclude` ليس رقمًا صحيحًا موجبًا |
| اسم لعبة غير معروف | `NOT_FOUND` | 404 | حدث فقط لو استُخدم اسم مختلف عن `eye` في مسار غير متوقع |
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

## إضافة/تحديث عناصر عين

لتحديث محتوى "عين":

1. عدّلي `src/data/eye/questions.json` مباشرة (أضيفي/عدّلي/احذفي عناصر في المصفوفة).
2. **لازم تديّي كل عنصر جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1) - الـ `id` هنا لا يُولَّد تلقائيًا.
3. التزمي بنفس شكل السجل: `id` (رقم صحيح موجب فريد)، `img` (نص غير فارغ - رابط صورة صالح)، `name` (نص غير فارغ).
4. تأكدي أنه لا يوجد رابط صورة (`img`) أو اسم (`name`) مكرر بين عنصرين مختلفين - العنصر يُعتبر مكررًا لو تطابق أي من الحقلين، حتى لو الحقل الآخر مختلفًا.
5. لاستبدال كل العناصر بمجموعتك الخاصة: استبدلي محتوى `src/data/eye/questions.json` بالكامل (تأكدي أن كل `id` فريد في المجموعة الجديدة، وأنه لا يوجد `img` أو `name` مكرر).
6. اعملي `commit` وارفعي (`redeploy`) - بدون أي تعديل كود مطلوب.
