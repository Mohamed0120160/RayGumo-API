# CHANGES.md — إضافة Character Guess API (خمّن الشخصية من الوصف)

هذا الملف يوثّق التغييرات التي تمت في هذه الدفعة فقط. انسخي كل ملف إلى
نفس المسار النسبي بالضبط في مشروعك الحالي (استبدال أو إضافة حسب النوع
المذكور). **لم يتم لمس أي كود خاص بـ Quiz أو True/False أو Riddles أو
Eye أو Emoji إطلاقًا.**

---

## ملخص التغيير

تمت إضافة لعبة جديدة كاملة **Character Guess (خمّن الشخصية من الوصف)**
للمشروع، بنفس أسلوب وتنظيم الألعاب الموجودة فعليًا (خصوصًا `eye`)،
بدون إنشاء مشروع جديد وبدون تعديل أي كود خاص بالألعاب الأخرى.

- **400 سؤال** حقيقي (من ملف `data.json` الذي رفعتِه، بعد إصلاحه — انظر
  [تقرير إصلاح البيانات](#تقرير-إصلاح-البيانات) بالأسفل)، كل سؤال بحقل
  `question` (بدل `description` — انظر [قرار مهم](#قرار-مهم-استبدال-description-بـ-question)
  بالأسفل) و`answers` كمصفوفة إجابات مقبولة (عربي/إنجليزي معًا)، مع `id`
  فريد **مأخوذ كما هو من ملف JSON الأصلي (1 إلى 400)**، وليس مولَّدًا
  وقت التشغيل — تمامًا كما طلبتِ.
- اللعبة متاحة على **نفس المسار العام المشترك بين كل الألعاب**:
  `/api/games/character-guess/...` — بنفس نمط `quiz` و`riddles` و`eye`
  و`emoji` تمامًا، بدون أي مسار مختصر إضافي وبدون أي تعديل على
  `next.config.ts`.
- **منع الغش:** `random` و`random-exclude` يرجعان `{ id, question }`
  فقط بدون `answers` (تمامًا كما طلبتِ)، بينما `:id` و`all` يرجعان
  السؤال كاملًا مع `answers` — راجعي قسم منع الغش في `docs/character-guess.md`
  للتفاصيل.

---

## قرار مهم: استبدال `description` بـ `question`

طلبك الأصلي حدّد اسم الحقل `description` لوصف الشخصية. لكن بما أن كل
الألعاب النصية الأخرى في المشروع (`quiz`, `riddles`, `true-false`)
تستخدم اسم الحقل `question` لنفس الغرض (نص السؤال/الوصف المطلوب
تخمينه)، وبما أنكِ طلبتِ صراحة **الالتزام الكامل ببنية المشروع
الحالية**، تم استبدال `description` بـ `question` في كل مكان (ملف
البيانات، الأنواع، التحقق، التوثيق) حتى تبقى تسمية الحقول متسقة عبر كل
ألعاب المشروع النصية. الشكل النهائي للسؤال:

```json
{
  "id": 1,
  "question": "يحلم بأن يصبح ملك القراصنة...",
  "answers": ["لوفي", "مونكي دي لوفي", "luffy", "monkey d luffy"]
}
```

---

## قرار مهم: بنية المسارات العامة `/api/games/[game]/...`

طلبك الأصلي افترض مسارات مستقلة بالشكل `/api/character-description/random`.
لكن مشروع RayGumo API الحالي **لا يستخدم مسارات مستقلة لكل لعبة**. بدل
ذلك، البنية الفعلية تعتمد **مسارًا عامًا واحدًا مشتركًا بين كل
الألعاب**: `/api/games/[game]/...`، مع "سجلّ ألعاب" مركزي
(`registry.ts`) يوجّه كل طلب حسب اسم اللعبة في الرابط. هذا هو نفس
الأسلوب المستخدم بالضبط في `quiz` و`true-false` و`riddles` و`eye`
و`emoji`.

بناءً على طلبك الصريح باتباع نفس أسلوب Quiz API والالتزام الكامل ببنية
المشروع الحالية، تم اتّباع البنية العامة الفعلية بدل المسارات المستقلة.
النتيجة العملية (اسم الموديول أصبح `character-guess` بدل
`character-description` ليطابق أسلوب تسمية بقية الألعاب بكلمة واحدة
مركّبة بشرطة):

| في طلبك | البنية الفعلية المطبّقة |
|---|---|
| `GET /api/character-description/random` | `GET /api/games/character-guess/random` |
| `GET /api/character-description/random-exclude?ids=1,2,3` | `GET /api/games/character-guess/random-exclude?ids=1,2,3` |
| `GET /api/character-description/[id]` | `GET /api/games/character-guess/:id` |
| `GET /api/character-description/all` | `GET /api/games/character-guess/all` |
| `GET /api/character-description/count` | `GET /api/games/character-guess/count` |

شكل الاستجابة (`{ success, data }` و`{ success: false, message, code }`)
وكل رسائل/أكواد الأخطاء (`NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_ERROR`)
**مطابقة تمامًا** لما طلبتِه ولما هو مستخدم فعليًا في المشروع.

---

## تقرير إصلاح البيانات

ملف `data.json` المرفوع كان **تالفًا وغير قابل للقراءة كـ JSON صالح**.
السبب: الملف كان عبارة عن **5 مصفوفات JSON منفصلة ملصوقة ببعضها مباشرة**
(بدون فاصلة أو أي رابط بينها)، بالشكل:

```
[ ...100 سؤال... ][ ...100 سؤال... ][ ...100 سؤال... ]...
```

بدل مصفوفة واحدة صحيحة `[ ...400 سؤال... ]`. تم اكتشاف 4 نقاط التصاق
بين المصفوفات (عند الأسطر 252 و503 و1004 و1505 من الملف الأصلي) وإصلاحها
بدمج المصفوفات الخمس في مصفوفة واحدة صالحة.

**بعد الإصلاح:**

- العدد الإجمالي: **400 سؤال**.
- كل الـ `id` من 1 إلى 400 **فريدة تمامًا** بدون أي تكرار.
- لا يوجد أي سجل ناقص الحقول (`id`/`description`/`answers` كلها موجودة
  في كل سجل، و`answers` مصفوفة غير فارغة في كل السجلات).
- تم بعدها استبدال `description` بـ `question` في كل سجل (انظر
  القرار أعلاه).

لم تكن هناك حاجة لحذف أي سجل أو تجاهله — البيانات بعد إصلاح الالتصاق
كانت سليمة الشكل بالكامل.

---

## الملفات الجديدة

```
src/data/character-guess/questions.json                         (جديد - 400 سؤال)
src/modules/games/character-guess/character-guess.types.ts       (جديد)
src/modules/games/character-guess/character-guess.validation.ts  (جديد)
src/modules/games/character-guess/character-guess.service.ts     (جديد)
src/modules/games/character-guess/index.ts                       (جديد)
docs/character-guess.md                                          (جديد - توثيق كامل)
```

## الملفات المعدَّلة (إضافة فقط، بدون حذف أي سطر قديم)

```
src/types/games.ts               (إضافة "character-guess" في GAME_REGISTRY)
src/modules/games/registry.ts    (إضافة حالة "character-guess" في كل دالة موزِّع)
src/app/page.tsx                 (إضافة روابط character-guess في الصفحة الرئيسية)
```

لم يُلمس أي سطر آخر في هذه الملفات الثلاثة — فقط إضافات جديدة بنفس
النمط المستخدم لبقية الألعاب.

---

## بنية الموديول الجديد (نفس نمط `eye` بالضبط)

- `character-guess.types.ts`: يعرّف `CharacterGuessQuestion` (الشكل
  الكامل مع `answers`) و`PublicCharacterGuessQuestion` (بدون `answers`،
  مستخدَم فقط في استجابات `random`/`random-exclude`).
- `character-guess.validation.ts`: يتحقق أن `id` رقم صحيح موجب،
  و`question` نص غير فارغ، و`answers` مصفوفة نصوص غير فارغة. أي سجل لا
  يجتاز التحقق يُتجاهل بأمان.
- `character-guess.service.ts`: يحمّل البيانات، يتحقق من فرادة الـ
  `id` (أول ظهور يفوز عند التكرار)، ويخزّنها في cache داخل الذاكرة.
  يحتوي 5 دوال: `getRandomQuestion` و`getRandomQuestionExcluding`
  (كلاهما يرجعان النسخة العامة بدون `answers`)، و`getQuestionById`
  و`getAllQuestions` (يرجعان النسخة الكاملة مع `answers`)،
  و`getQuestionCount`.
- `index.ts`: نقطة تصدير موحّدة لكل ما سبق، بنفس نمط بقية الألعاب.

هذا الفصل بين "نسخة عامة" و"نسخة كاملة" هو الاختلاف الوحيد عن نمط `eye`
— ومطلوب لتنفيذ متطلب منع الغش المذكور صراحة في طلبك.
