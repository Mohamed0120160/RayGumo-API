# لعبة خمن البطل من الصوت (Hero Audio) — توثيق كامل

هذا الملف يوثّق لعبة "خمن البطل من الصوت" بالتفصيل: بنية البيانات، كل الـ endpoints المتاحة، أمثلة الطلبات والاستجابات، نظام الـ `id`، آلية منع التكرار (`random-exclude`)، تكامل جاهز مع بوتات واتساب (Baileys)، والتحقق من إجابة المستخدم، وحالات الأخطاء.

هذه اللعبة مبنية بنفس بنية لعبة [خمن الشخصية](./character-guess.md) بالضبط: نفس الـ endpoints، نفس شكل الاستجابة، ونظام `id` مخزَّن مسبقًا في الملف (وليس مولَّدًا بالترتيب كما في الكويز)، وترجع `answer` كاملة في كل endpoint بدون استثناء - إذا كنتِ مطّلعة على توثيق "خمن الشخصية" أو "عين"، هذا الملف سيبدو مألوفًا جدًا.

---

## جدول المحتويات

- [وصف اللعبة](#وصف-اللعبة)
- [بنية البيانات](#بنية-البيانات)
- [نظام الـ id](#نظام-الـ-id)
- [الـ Endpoints](#الـ-endpoints)
  - [GET /api/games/hero-audio/random](#get-apigameshero-audiorandom)
  - [GET /api/games/hero-audio/random-exclude](#get-apigameshero-audiorandom-exclude)
  - [GET /api/games/hero-audio/count](#get-apigameshero-audiocount)
  - [GET /api/games/hero-audio/:id](#get-apigameshero-audioid)
  - [GET /api/games/hero-audio/all](#get-apigameshero-audioall)
- [شكل الاستجابة الموحّد](#شكل-الاستجابة-الموحد)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس البطل (Anti-Repeat)](#منع-تكرار-نفس-البطل-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [حالات الأخطاء](#حالات-الأخطاء)
- [إضافة/تحديث الأبطال](#إضافةتحديث-الأبطال)

---

## وصف اللعبة

"خمن البطل من الصوت" لعبة تخمين صوتية: يشغّل البوت للاعبين مقطعًا صوتيًا واحدًا عشوائيًا (`audioUrl`) من أصوات/حوارات أحد أبطال Mobile Legends، وعلى اللاعب معرفة اسم البطل الصحيح من الصوت وحده بدون رؤية أي صورة أو تلميح نصي. البطل الواحد قد يقبل **أكثر من إجابة صحيحة** (الاسم بالإنجليزية والعربية غالبًا)، لذلك الإجابات مصفوفة نصوص (`answer: string[]`).

كل بطل له أيضًا **مصفوفة روابط صوتية متعددة** (`audioUrl: string[]`) بدل رابط واحد فقط - يختار البوت رابطًا عشوائيًا واحدًا من المصفوفة في كل مرة يبدأ فيها جولة جديدة لنفس البطل، مما يمنع حفظ اللاعبين للإجابة اعتمادًا على نفس المقطع الصوتي بالتحديد في كل مرة.

الـ API هنا **مزوّد محتوى فقط** — لا يتحقق من إجابة المستخدم، ولا يشغّل الصوت بنفسه، ولا يحتفظ بأي حالة (state) عن تقدّم اللعبة أو نقاط الخبرة أو الترتيب؛ هذا كله مسؤولية البوت المستهلك للـ API. الـ API بلا حالة (stateless) تمامًا.

---

## بنية البيانات

مصدر البيانات الأساسي هو ملف:

```
src/data/hero-audio/questions.json
```

عبارة عن مصفوفة JSON تحتوي حاليًا **127 بطلًا** من Mobile Legends.

شكل كل عنصر كما يظهر في **كل** استجابات الـ API (بدون أي استثناء):

```json
{
  "id": 1,
  "audioUrl": [
    "https://static.wikia.nocookie.net/mobile-legends/images/.../Aamon.move01.ogg/revision/latest",
    "https://static.wikia.nocookie.net/mobile-legends/images/.../Aamon.select.ogg/revision/latest",
    "https://static.wikia.nocookie.net/mobile-legends/images/.../Aamon.talk01.ogg/revision/latest"
  ],
  "answer": ["Aamon", "امون"]
}
```

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `number` | معرّف فريد وثابت، **مخزَّن مسبقًا داخل questions.json نفسه** (وليس مولَّدًا وقت التحميل). انظر [نظام الـ id](#نظام-الـ-id) بالأسفل. |
| `audioUrl` | `string[]` | مصفوفة روابط مقاطع صوتية (حركة، اختيار، قتل، حوار...إلخ) خاصة بالبطل. مصفوفة نصوص دائمًا، وليست رابطًا مفردًا. **تُرجَع كاملة في كل endpoint** بما فيها `random` و`random-exclude` - البوت هو من يختار رابطًا واحدًا عشوائيًا منها وقت الإرسال الفعلي. |
| `answer` | `string[]` | كل الإجابات المقبولة لاسم هذا البطل. مصفوفة نصوص دائمًا، وليست نصًا مفردًا. **تُرجَع في كل endpoint** بما فيها `random` و`random-exclude` - على عكس بعض ألعاب التخمين الأخرى، لا يوجد إخفاء للإجابات هنا. |

أي سجل ناقص فيه `id` (رقم صحيح موجب فريد) أو `audioUrl` (مصفوفة نصوص غير فارغة) أو `answer` (مصفوفة نصوص غير فارغة) يُتجاهل تلقائيًا وقت التحميل ولن يظهر في أي endpoint - دون أن يوقف الـ API بالكامل. لو اتكرر نفس الـ `id` بين عنصرين، أول عنصر بيفوز والباقي بيتجاهل مع تحذير في الـ logs.

---

## نظام الـ id

- الـ `id` **رقم صحيح موجب فريد**، **مخزَّن مسبقًا وصراحة داخل كل عنصر في `questions.json` نفسه** - تمامًا مثل لعبة [خمن الشخصية](./character-guess.md)، وعلى عكس الكويز حيث يُولَّد تلقائيًا حسب الترتيب وقت التحميل.
- الأبطال الحاليون مرقّمون تسلسليًا من `1` إلى `127` بدون أي فجوات أو تكرار.
- عند إضافة أبطال جدد يدويًا للملف، **لازم تدي كل عنصر جديد `id` فريدًا لم يُستخدم من قبل** (عادة: أكبر `id` موجود حاليًا + 1، أي `128` فما فوق). الـ API يتحقق فقط أن كل `id` رقم صحيح موجب وفريد؛ لا يولّد أي `id` بنفسه.
- هذا الاستقرار أساسي لأن `id` هو المعرّف الذي تعتمد عليه بوتات الواتساب في نظام منع التكرار (anti-repeat عبر `random-exclude`).
- لو اتكرر نفس الـ `id` بين عنصرين في الملف بالخطأ، أول عنصر بترتيب الظهور يفوز، والباقي يُتجاهل مع تحذير في الـ logs (`console.warn`).

---

## الـ Endpoints

### `GET /api/games/hero-audio/random`

ترجع بطلًا عشوائيًا واحدًا **مع audioUrl وanswer كاملتين**.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/hero-audio/random
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "audioUrl": [
      "https://static.wikia.nocookie.net/mobile-legends/images/.../Alucard.select.ogg/revision/latest",
      "https://static.wikia.nocookie.net/mobile-legends/images/.../Alucard.move03.ogg/revision/latest"
    ],
    "answer": ["Alucard", "الوكارد"]
  }
}
```

---

### `GET /api/games/hero-audio/random-exclude`

ترجع بطلًا عشوائيًا واحدًا **مع audioUrl وanswer كاملتين**، مع استثناء أي `id` موجود ضمن قائمة معامل الاستعلام `ids` (مفصولة بفواصل). هذا هو آلية منع التكرار (anti-repeat) في اللعبة.

`GET /api/games/hero-audio/random-exclude?ids=1,2,3`

**مثال الطلب:**

```bash
curl "https://raygumo-api.vercel.app/api/games/hero-audio/random-exclude?ids=1,2,3"
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 90,
    "audioUrl": ["..."],
    "answer": ["..."]
  }
}
```

**حالة خاصة:** إذا استُثني كل الأبطال المتاحين، يرجع المسار خطأ 404 واضحًا بدل تكرار بطل قديم بصمت. عندها على البوت أن يعيد تصفير قائمة الأبطال المستخدمين لتلك المجموعة والبدء من جديد.

---

### `GET /api/games/hero-audio/count`

ترجع العدد الإجمالي للأبطال المتاحين حاليًا.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/hero-audio/count
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": { "count": 127 }
}
```

---

### `GET /api/games/hero-audio/:id`

ترجع بطلًا واحدًا محددًا بالضبط عبر رقمه (`id`)، مع `audioUrl` و`answer` كاملتين.

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/hero-audio/15
```

**مثال الاستجابة (200):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "audioUrl": ["..."],
    "answer": ["..."]
  }
}
```

**مثال استجابة الخطأ (404 - id غير موجود):**

```json
{
  "success": false,
  "message": "No item with id 99999 in \"hero-audio\"",
  "code": "NOT_FOUND"
}
```

---

### `GET /api/games/hero-audio/all`

ترجع كل الأبطال مع `audioUrl` و`answer` كاملتين كمصفوفة واحدة (127 عنصرًا حاليًا).

**مثال الطلب:**

```bash
curl https://raygumo-api.vercel.app/api/games/hero-audio/all
```

**مثال الاستجابة (200) — مختصرة:**

```json
{
  "success": true,
  "data": [
    { "id": 1, "audioUrl": ["..."], "answer": ["Aamon", "امون"] },
    { "id": 2, "audioUrl": ["..."], "answer": ["Akai", "أكاي"] }
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

مثال لأمر بوت واتساب (Baileys) بسيط للعبة "خمن البطل من الصوت" مع تتبّع الأبطال المستخدمين لكل مجموعة، وإرسال مقطع صوتي عشوائي من `audioUrl`:

```javascript
// حالة داخل الذاكرة لكل مجموعة: قائمة id الأبطال المستخدمين + البطل الحالي
const usedIdsByGroup = new Map(); // groupId -> number[]
const activeHeroByGroup = new Map(); // groupId -> { id, answer }

const API_BASE = "https://raygumo-api.vercel.app/api/games/hero-audio";

async function startHeroAudioGame(sock, groupId) {
  const usedIds = usedIdsByGroup.get(groupId) ?? [];
  const url = `${API_BASE}/random-exclude?ids=${usedIds.join(",")}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    // كل الأبطال استُخدموا، نصفّر القائمة ونبدأ من جديد
    usedIdsByGroup.set(groupId, []);
    return startHeroAudioGame(sock, groupId);
  }

  const { id, audioUrl, answer } = json.data;
  usedIdsByGroup.set(groupId, [...usedIds, id]);
  activeHeroByGroup.set(groupId, { id, answer });

  // اختيار رابط صوتي عشوائي واحد من مصفوفة audioUrl للإرسال الفعلي
  const chosenUrl = audioUrl[Math.floor(Math.random() * audioUrl.length)];
  const audioRes = await fetch(chosenUrl);
  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

  await sock.sendMessage(groupId, {
    audio: audioBuffer,
    mimetype: "audio/ogg",
    ptt: true,
  });

  return "خمن البطل من الصوت 🎧";
}

function checkAnswer(groupId, playerAnswer) {
  const active = activeHeroByGroup.get(groupId);
  if (!active) return null;

  const normalized = playerAnswer.trim().toLowerCase();
  return active.answer.some((a) => a.trim().toLowerCase() === normalized);
}
```

---

## منع تكرار نفس البطل (Anti-Repeat)

الـ API بلا حالة تمامًا - لا يخزّن أي معلومة دائمة عن الأبطال الذين عُرضوا سابقًا. البوت هو المسؤول عن:

1. الاحتفاظ بقائمة `id` الأبطال المستخدمين لكل مجموعة/مستخدم في ذاكرته الخاصة.
2. إرسال تلك القائمة مع كل طلب `random-exclude?ids=...`.
3. عند استلام 404 (كل الأبطال استُخدموا)، تصفير القائمة والبدء من جديد.

---

## التحقق من إجابة المستخدم

الـ API لا يتحقق من إجابة اللاعب - هذا كله مسؤولية البوت. بما أن `answer` ترجع كاملة مع كل استجابة، يمكن للبوت الاحتفاظ بها محليًا فور استلام البطل (لا حاجة لطلب إضافي عند التحقق):

1. البوت يطلب `/random` أو `/random-exclude` ويحصل على `{ id, audioUrl, answer }` كاملة، ويحفظ `answer` في حالته الخاصة بالمجموعة/المستخدم، ويشغّل رابطًا واحدًا عشوائيًا من `audioUrl`.
2. عند استلام إجابة اللاعب، يُقارن نصها (بعد `trim()` وتحويله لحروف صغيرة) مع كل عنصر في `answer` المحفوظة محليًا (بعد نفس المعالجة) للتحقق من التطابق.

---

## حالات الأخطاء

| الحالة | كود HTTP | `code` |
|---|---|---|
| لعبة (slug) غير مسجّلة | 404 | `NOT_FOUND` |
| `id` غير موجود | 404 | `NOT_FOUND` |
| كل الأبطال مستثنون في `random-exclude` | 404 | `NOT_FOUND` |
| قيمة `id` أو `ids` غير صالحة (نص غير رقمي) | 400 | `BAD_REQUEST` |
| خطأ غير متوقع في الخادم | 500 | `INTERNAL_ERROR` |

---

## إضافة/تحديث الأبطال

1. افتحي `src/data/hero-audio/questions.json`.
2. أضيفي عنصرًا جديدًا بنفس الشكل: `{ "id": ..., "audioUrl": [...], "answer": [...] }`.
3. تأكدي أن الـ `id` الجديد **فريد** ولم يُستخدم من قبل (عادة: أكبر `id` موجود حاليًا + 1، أي `128` فما فوق حاليًا).
4. تأكدي أن `audioUrl` و`answer` كلاهما مصفوفة نصوص غير فارغة.
5. لا حاجة لأي تعديل في الكود - التغييرات تُقرأ مباشرة من الملف عند إعادة تشغيل الخادم (أو نشر جديد على Vercel).
