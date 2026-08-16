# لعبة كويز موبايل ليجندز (MLBB Quiz) — توثيق كامل

هذا الملف يوثّق لعبة "كويز موبايل ليجندز" بالتفصيل: بنية البيانات، كل الـ endpoints المتاحة، أمثلة الطلبات والاستجابات، نظام الـ `id`، آلية منع التكرار (`random-exclude`)، تكامل جاهز مع بوتات واتساب (Baileys)، والتحقق من إجابة المستخدم، وحالات الأخطاء.

هذه اللعبة مبنية بنفس بنية لعبة [أعلام](./flags.md) في نظام الـ `id` (مخزَّن مسبقًا في الملف)، لكنها تختلف عن [الألغاز](./riddles.md) و[الكويز](./quiz.md) في شكل الإجابة: هنا `answer` نص شارح واحد (`string`)، وليس مصفوفة صياغات (`answers[]`). إذا كنتِ مطّلعة على أيّ من هذه الوثائق، هذا الملف سيبدو مألوفًا جدًا.

---

## جدول المحتويات

- [وصف اللعبة](#وصف-اللعبة)
- [بنية البيانات](#بنية-البيانات)
- [نظام الـ id](#نظام-الـ-id)
- [الـ Endpoints](#الـ-endpoints)
  - [GET /api/games/mlbb-quiz/random](#get-apigamesmlbb-quizrandom)
  - [GET /api/games/mlbb-quiz/random-exclude](#get-apigamesmlbb-quizrandom-exclude)
  - [GET /api/games/mlbb-quiz/all](#get-apigamesmlbb-quizall)
  - [GET /api/games/mlbb-quiz/count](#get-apigamesmlbb-quizcount)
  - [GET /api/games/mlbb-quiz/:id](#get-apigamesmlbb-quizid)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس السؤال (Anti-Repeat)](#منع-تكرار-نفس-السؤال-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [حالات الأخطاء](#حالات-الأخطاء)
- [إضافة/تحديث أسئلة](#إضافةتحديث-أسئلة)

---

## وصف اللعبة

"كويز موبايل ليجندز" لعبة أسئلة وأجوبة نصية عن لعبة Mobile Legends: Bang Bang - المراكز، الأبطال، القدرات، وغيرها من تفاصيل اللعبة. تُعرض على اللاعب سؤال (`question`)، وعليه كتابة إجابة نصية حرة.

على عكس لعبتَي الألغاز والكويز العادي، الإجابة هنا (`answer`) **نص شارح واحد وليست مصفوفة صياغات**: كل سؤال له إجابة واحدة تحمل المعلومة الصحيحة، وغالبًا مصحوبة بجملة شرح إضافية توضّح المضمون المطلوب. التحقق من إجابة اللاعب هنا يُقصد به **مطابقة المعنى/المضمون**، وليس المطابقة الحرفية الدقيقة لنص `answer` كاملًا - راجعي [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم) بالأسفل.

الـ API هنا **مزوّد محتوى فقط** — لا يتحقق من إجابة المستخدم ولا يحتفظ بأي حالة (state) عن تقدّم اللعبة أو نقاط الخبرة أو الترتيب؛ هذا كله مسؤولية البوت المستهلك للـ API. الـ API بلا حالة (stateless) تمامًا.

---

## بنية البيانات

مصدر البيانات الأساسي هو ملف:

```
src/data/mlbb-quiz/questions.json
```

عبارة عن مصفوفة JSON تحتوي حاليًا **3000 سؤال**.

شكل كل عنصر كما يظهر في استجابات الـ API:

```json
{
  "id": 1,
  "question": "اذكر المراكز المصنفة لـLukas.",
  "answer": "EXP Lane. هذه هي الفكرة أو المعلومة الأساسية التي يجب أن تعبر عنها إجابة اللاعب. لا يشترط أن يستخدم اللاعب نفس الكلمات حرفيًا؛ المهم أن يكون مضمون إجابته متوافقًا مع هذه المعلومة، وأن يظل المعنى الأساسي صحيحًا وألا يضيف ادعاءً يناقضه."
}
```

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `number` | معرّف فريد وثابت، **مخزَّن مسبقًا داخل questions.json نفسه** (وليس مولَّدًا وقت التحميل). انظر [نظام الـ id](#نظام-الـ-id) بالأسفل. |
| `question` | `string` | نص السؤال عن لعبة Mobile Legends: Bang Bang. |
| `answer` | `string` | نص إجابة واحد يحمل المعلومة الصحيحة، غالبًا مصحوبًا بجملة شرح إضافية. **نص مفرد دائمًا، وليس مصفوفة** (على عكس `answers[]` في لعبتَي الكويز والألغاز). |

> **ملاحظة:** حقل `id` مخزَّن صراحة داخل الملف نفسه لكل عنصر، مرقّم تسلسليًا (1، 2، 3...) — بنفس أسلوب لعبة "أعلام" تمامًا. راجعي [نظام الـ id](#نظام-الـ-id) للتفاصيل والسبب.

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `question` أو `answer` (كلاهما نص غير فارغ) يُتجاهل تلقائيًا وقت التحميل ولن يظهر في أي endpoint - دون أن يوقف الـ API بالكامل. لو اتكرر نفس الـ `id` بين عنصرين، أول عنصر بيفوز والباقي بيتجاهل مع تحذير في الـ logs.

---

## نظام الـ id

- الـ `id` **رقم صحيح موجب فريد**، **مخزَّن مسبقًا وصراحة داخل كل عنصر في `questions.json` نفسه** - على عكس الكويز العادي حيث يُولَّد تلقائيًا حسب الترتيب وقت التحميل.
- عند إضافة أسئلة جديدة يدويًا للملف، **لازم تدي كل عنصر جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1، أي أكبر من 3000). الـ API يتحقق فقط أن كل `id` رقم صحيح موجب وفريد؛ لا يولّد أي `id` بنفسه.
- **لماذا `id` مخزَّن يدويًا هنا وليس مولَّدًا بالترتيب:** هذا يضمن أن `id` أي عنصر يبقى **ثابتًا تمامًا** حتى لو أُعيد ترتيب الملف أو أُدرجت عناصر جديدة في المنتصف مستقبلًا. هذا الاستقرار أساسي جدًا لأن `id` هو المعرّف الذي تعتمد عليه بوتات الواتساب في نظام منع التكرار (anti-repeat عبر `random-exclude`).
- لو اتكرر نفس الـ `id` بين عنصرين في الملف بالخطأ، أول عنصر بترتيب الظهور يفوز، والباقي يُتجاهل مع تحذير في الـ logs (`console.warn`) يساعد وقت مراجعة عملية استيراد عناصر جديدة.

---

## الـ Endpoints

جميع الـ endpoints التالية متاحة على المسار العام المشترك بين كل الألعاب: `/api/games/mlbb-quiz/...` (نفس نمط `quiz` و`flags` و`riddles` تمامًا).

### `GET /api/games/mlbb-quiz/random`

ترجع سؤال "كويز موبايل ليجندز" عشوائيًا واحدًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/mlbb-quiz/random
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "question": "اذكر المراكز المصنفة لـLukas.",
    "answer": "EXP Lane. هذه هي الفكرة أو المعلومة الأساسية التي يجب أن تعبر عنها إجابة اللاعب. لا يشترط أن يستخدم اللاعب نفس الكلمات حرفيًا؛ المهم أن يكون مضمون إجابته متوافقًا مع هذه المعلومة، وأن يظل المعنى الأساسي صحيحًا وألا يضيف ادعاءً يناقضه."
  }
}
```

---

### `GET /api/games/mlbb-quiz/random-exclude`

ترجع سؤالًا عشوائيًا واحدًا، مع استثناء أي `id` موجود ضمن قائمة معامل الاستعلام `ids` (مفصولة بفواصل). هذا هو آلية منع التكرار (anti-repeat) في اللعبة.

`GET /api/games/mlbb-quiz/random-exclude?ids=1,5,8,20`

**لماذا هذا الـ endpoint موجود:** الـ API بلا حالة تمامًا - لا يخزّن أي معلومة دائمة عن الأسئلة التي عُرضت سابقًا. البوت (مثلًا بوت واتساب) هو المسؤول عن تتبّع العناصر المستخدمة لكل مستخدم/مجموعة، ثم إرسال قائمة تلك الـ `id` مع كل طلب حتى لا يتكرر نفس السؤال.

**مثال الطلب:**

```bash
curl "https://raygumo-api.vercel.app/api/games/mlbb-quiz/random-exclude?ids=1,5,8,20"
```

**سلوكيات خاصة:**

- إذا كان معامل `ids` غير موجود أو فارغًا، يعمل هذا الـ endpoint تمامًا مثل `/random` العادي (استثناء لا شيء = كل العناصر متاحة).
- إذا استُثنيت **كل** العناصر المتاحة (لم يتبقَّ أي عنصر جديد)، يرجع الـ endpoint خطأ `404 NOT_FOUND` واضحًا بدل تكرار سؤال قديم بصمت. على البوت عندها تصفير قائمة العناصر المستخدمة والمحاولة من جديد.

راجعي قسم [منع تكرار نفس السؤال](#منع-تكرار-نفس-السؤال-anti-repeat) بالأسفل لنمط تكامل كامل جاهز للنسخ.

---

### `GET /api/games/mlbb-quiz/all`

ترجع كل أسئلة "كويز موبايل ليجندز" كمصفوفة كاملة (3000 سؤال حاليًا).

```bash
curl https://raygumo-api.vercel.app/api/games/mlbb-quiz/all
```

> **تنبيه:** الاستجابة هنا كبيرة نسبيًا (3000 سؤال). فضّلي استخدام `/random` أو `/random-exclude` في تدفّق اللعبة الفعلي داخل البوت، واستخدمي `/all` فقط لأغراض إدارية أو استيراد/تصدير أو تحقق من طرف المطوّر.

---

### `GET /api/games/mlbb-quiz/count`

ترجع العدد الإجمالي لأسئلة "كويز موبايل ليجندز" المتاحة حاليًا.

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": { "count": 3000 }
}
```

---

### `GET /api/games/mlbb-quiz/:id`

ترجع سؤالًا واحدًا محددًا بالضبط عبر رقمه (`id`)، بدل سؤال عشوائي.

```bash
curl https://raygumo-api.vercel.app/api/games/mlbb-quiz/1
```

**مثال استجابة عند عدم وجود العنصر (404):**

```json
{
  "success": false,
  "message": "No item with id 999999 in \"mlbb-quiz\"",
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

### أمر `!ml_كويز` بسيط

```js
// commands/mlbbQuiz.js
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getRandomMlbbQuizQuestion() {
  const res = await fetch(`${API_BASE}/api/games/mlbb-quiz/random`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data; // { id, question, answer }
}

module.exports = async function handleMlbbQuizCommand(sock, msg, chatId) {
  try {
    const item = await getRandomMlbbQuizQuestion();
    await sock.sendMessage(chatId, {
      text: `🎮 *كويز موبايل ليجندز*\n\n${item.question}`,
    });
  } catch (err) {
    console.error("MLBB quiz fetch failed:", err);
    await sock.sendMessage(chatId, { text: "⚠️ تعذر جلب سؤال الآن، حاول لاحقًا." });
  }
};
```

---

## منع تكرار نفس السؤال (Anti-Repeat)

الـ API بلا حالة (stateless) تمامًا - مش بيتذكر أي أسئلة اتعرضت قبل كده. البوت هو المسؤول عن التتبّع.

### الخطوات

1. احتفظي بقائمة أرقام الأسئلة المستخدمة لكل مجموعة.
2. نادي على `/random-exclude?ids=...` بدل `/random` العادي.
3. لما يرجع سؤال، ضيفي `id`ه لقائمة المستخدم.
4. لو رجع `404` بكود `NOT_FOUND` (يعني الأسئلة خلصت)، صفّري القائمة ونادي تاني.

```js
// state/usedMlbbQuizQuestions.js
const usedMlbbQuizQuestionsByGroup = new Map(); // groupId -> Set<number>

function getUsedIds(groupId) {
  return usedMlbbQuizQuestionsByGroup.get(groupId) ?? new Set();
}
function markUsed(groupId, id) {
  const set = getUsedIds(groupId);
  set.add(id);
  usedMlbbQuizQuestionsByGroup.set(groupId, set);
}
function resetUsed(groupId) {
  usedMlbbQuizQuestionsByGroup.set(groupId, new Set());
}

module.exports = { getUsedIds, markUsed, resetUsed };
```

```js
// commands/mlbbQuiz.js
const { getUsedIds, markUsed, resetUsed } = require("../state/usedMlbbQuizQuestions");
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";

async function getNextMlbbQuizQuestion(groupId) {
  const usedIds = [...getUsedIds(groupId)];
  const idsParam = usedIds.join(",");
  const url = `${API_BASE}/api/games/mlbb-quiz/random-exclude${idsParam ? `?ids=${idsParam}` : ""}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    if (json.code === "NOT_FOUND") {
      resetUsed(groupId); // كل الأسئلة اتستخدمت — نبدأ من جديد
      return getNextMlbbQuizQuestion(groupId);
    }
    throw new Error(json.message);
  }

  markUsed(groupId, json.data.id);
  return json.data;
}
```

---

## التحقق من إجابة المستخدم

مفيش endpoint للتحقق من الإجابة - التحقق بيتم عندك في البوت مباشرة. لكن على عكس لعبتَي الألغاز والأعلام، `answer` هنا **نص شارح واحد وليس مصفوفة صياغات مختصرة**، فمقارنة نصية حرفية (`===`) غير عملية غالبًا.

**مقترح بسيط:** استخرجي أول جملة أو أول عبارة قبل أول نقطة من `answer` كـ"الإجابة الجوهرية المختصرة"، وقارني رد اللاعب بيها بشكل متساهل (تجاهل حالة الأحرف، المسافات الزائدة، والتشكيل):

```js
function extractCoreAnswer(answer) {
  // نأخذ الجزء قبل أول نقطة كإجابة مختصرة (مثال: "EXP Lane" من
  // "EXP Lane. هذه هي الفكرة الأساسية...")
  return answer.split(".")[0].trim();
}

function isLikelyCorrect(userReply, item) {
  const normalize = (s) => s.trim().toLowerCase();
  const core = normalize(extractCoreAnswer(item.answer));
  const reply = normalize(userReply);
  return reply.length > 0 && (reply.includes(core) || core.includes(reply));
}
```

هذا تحقق **تقريبي** فقط (يفيد لتلميح "قريب من الصح؟")، وليس تحققًا دقيقًا. للتحقق الدقيق من صحة إجابة حرة نصيًا بمعنى/مضمون، البوت يحتاج منطقًا أذكى (مقارنة عبر نموذج لغوي مثلًا) أو عرض `answer` الكامل للاعب كشرح بعد محاولته، بدل الاعتماد على مطابقة نصية بسيطة.

---

## حالات الأخطاء

| الحالة | الكود (`code`) | حالة HTTP | متى تحدث |
|---|---|---|---|
| العنصر غير موجود | `NOT_FOUND` | 404 | `:id` رقمي صحيح لكن لا يوجد عنصر بهذا الرقم |
| مجموعة العناصر فارغة | `NOT_FOUND` | 404 | `questions.json` فارغ أو كل سجلاته غير صالحة |
| كل العناصر مستثناة | `NOT_FOUND` | 404 | `random-exclude` استُثنيت فيه كل العناصر المتاحة عبر `ids` |
| `id` غير صالح | `BAD_REQUEST` | 400 | قيمة `:id` ليست رقمًا صحيحًا موجبًا (مثل `"abc"` أو `"-1"`) |
| قيمة غير صالحة في `ids` | `BAD_REQUEST` | 400 | أحد عناصر معامل `ids` في `random-exclude` ليس رقمًا صحيحًا موجبًا |
| اسم لعبة غير معروف | `NOT_FOUND` | 404 | حدث فقط لو استُخدم اسم مختلف عن `mlbb-quiz` في مسار غير متوقع |
| خطأ داخلي غير متوقع | `INTERNAL_ERROR` | 500 | مشكلة غير متوقعة في القراءة أو المعالجة |

---

## إضافة/تحديث أسئلة

1. عدّلي `src/data/mlbb-quiz/questions.json` مباشرة (أضيفي/عدّلي/احذفي عناصر في المصفوفة).
2. **لازم تديّي كل عنصر جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1) - الـ `id` هنا لا يُولَّد تلقائيًا.
3. التزمي بنفس شكل السجل: `id` (رقم صحيح موجب فريد)، `question` (نص غير فارغ)، `answer` (نص غير فارغ - إجابة شارحة واحدة، وليست مصفوفة).
4. اعملي `commit` وارفعي (`redeploy`) - بدون أي تعديل كود مطلوب.
