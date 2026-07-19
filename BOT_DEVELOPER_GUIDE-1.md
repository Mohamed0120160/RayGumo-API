# دليل استخدام RayGumo API لمبرمجي بوتات الواتساب

هذا الملف موجّه بالكامل لأي حد بيبني بوت واتساب (Baileys أو غيره) وعايز يستهلك RayGumo API. مفيش هنا أي تفاصيل عن بنية المشروع الداخلية أو الكود — بس اللي محتاجاه عشان تنادي على الـ API وتستخدم الرد.

---

## جدول المحتويات

- [الرابط الأساسي](#الرابط-الأساسي)
- [شكل الرد (كل مرة)](#شكل-الرد-كل-مرة)
- [الـ Endpoints المتاحة](#الـ-endpoints-المتاحة)
- [شكل سؤال الكويز](#شكل-سؤال-الكويز)
- [تكامل Baileys جاهز للنسخ](#تكامل-baileys-جاهز-للنسخ)
- [منع تكرار نفس السؤال (Anti-Repeat)](#منع-تكرار-نفس-السؤال-anti-repeat)
- [التحقق من إجابة المستخدم](#التحقق-من-إجابة-المستخدم)
- [أكواد الأخطاء اللي ممكن تقابلك](#أكواد-الأخطاء-اللي-ممكن-تقابلك)

---

## الرابط الأساسي

```
https://raygumo-api.vercel.app
```

الرابط أعلاه هو رابط النشر الفعلي بتاع مشروع RayGumo API على Vercel. كل الأمثلة تحت مبنية على إن عندك متغيّر زي:

```js
const API_BASE = process.env.RAYGUMO_API_URL ?? "https://raygumo-api.vercel.app";
```

كل الـ endpoints من نوع **GET** فقط، ومفيش أي مصادقة (authentication) أو API key مطلوبة.

---

## شكل الرد (كل مرة)

أي endpoint هترجّع واحد من الشكلين دول بالظبط:

**نجاح:**
```json
{ "success": true, "data": { } }
```

**فشل:**
```json
{ "success": false, "message": "نص يشرح الخطأ", "code": "NOT_FOUND" }
```

يعني كود البوت ممكن يعمل تحقّق واحد بس (`json.success`) يغطي كل الحالات.

---

## الـ Endpoints المتاحة

| المسار | الاستخدام |
|---|---|
| `GET /api/games/quiz/random` | سؤال عشوائي واحد |
| `GET /api/games/quiz/random-exclude?ids=1,2,3` | سؤال عشوائي، يستثني الأرقام المُمرّرة (لمنع التكرار) |
| `GET /api/games/quiz/all` | كل الأسئلة (260 سؤال) دفعة واحدة |
| `GET /api/games/quiz/count` | إجمالي عدد الأسئلة المتاحة |
| `GET /api/games/quiz/:id` | سؤال واحد بواسطة رقمه |

### مثال: سؤال عشوائي
```bash
curl https://raygumo-api.vercel.app/api/games/quiz/random
```
```json
{
  "success": true,
  "data": { "id": 3, "question": "ما عاصمة اليابان؟", "answers": ["طوكيو"], "category": "جغرافيا" }
}
```

### مثال: عدد الأسئلة
```bash
curl https://raygumo-api.vercel.app/api/games/quiz/count
```
```json
{ "success": true, "data": { "count": 260 } }
```

---

## شكل سؤال الكويز

كل سؤال بيرجع بنفس الشكل ده دايمًا:

```json
{
  "id": 1,
  "question": "ما عاصمة اليابان؟",
  "answers": ["طوكيو"],
  "category": "جغرافيا"
}
```

- `answers` **دايمًا مصفوفة** حتى لو فيها عنصر واحد بس — ممكن يكون فيها أكتر من إجابة صحيحة مقبولة (زي تهجئتين مختلفتين). دايمًا تعاملي معاها كمصفوفة، متفترضيش إنها نص واحد.
- `id` رقم ثابت لكل سؤال، تقدري تستخدميه في `/random-exclude` أو `/:id`.

---

## تكامل Baileys جاهز للنسخ

### 1. أمر `!quiz` بسيط

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

## أكواد الأخطاء اللي ممكن تقابلك

| الكود | يعني إيه | ليه بتحصل |
|---|---|---|
| `NOT_FOUND` (404) | المورد مش موجود | id غلط، لعبة مش مسجّلة، أو كل الأسئلة اتستثنت في `/random-exclude` |
| `BAD_REQUEST` (400) | الطلب نفسه غلط | `:id` مش رقم صحيح موجب |
| `INTERNAL_ERROR` (500) | خطأ من السيرفر | مشكلة غير متوقعة، جرّبي تاني بعدين |

نمط موحّد للتعامل مع أي رد:

```js
async function callApi(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(`[${json.code ?? "ERROR"}] ${json.message}`);
  }
  return json.data;
}
```
