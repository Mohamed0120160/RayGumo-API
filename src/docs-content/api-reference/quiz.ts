/**
 * ملف: quiz.ts (بيانات توثيق Quiz API)
 * الغرض: يصف كل نقاط الوصول الخاصة بـ Quiz API كبيانات بنية (structured
 * data) بدل نص حر مكتوب داخل الصفحة مباشرة. هذا هو "قالب التوثيق"
 * الذي يجب أن يتبعه أي API مستقبلي (anime.ts، riddles.ts...) بنفس
 * الشكل بالضبط - فقط انسخ هذا الملف وغيّر القيم.
 *
 * لماذا هذا النمط: صفحة الـ API (src/app/docs/api-reference/quiz/page.tsx)
 * لا تحتوي أي تفاصيل عن الحقول أو الأمثلة مباشرة، بل تستورد هذه
 * القائمة وتعرضها. هذا يعني أن توثيق أي API مستقبلي هو فقط "بيانات
 * جديدة + صفحة عرض قصيرة تستوردها"، وليس إعادة بناء تصميم الصفحة.
 */

export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface EndpointDoc {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  description: string;
  params?: EndpointParam[];
  exampleRequest: string;
  exampleResponse: string;
  errorResponse?: string;
  notes?: string[];
}

export const QUIZ_ENDPOINTS: EndpointDoc[] = [
  {
    method: "GET",
    path: "/api/games/quiz/random",
    title: "سؤال عشوائي",
    description: "ترجع سؤال كويز واحد عشوائي من إجمالي مجموعة الأسئلة المتاحة.",
    exampleRequest: "GET https://your-domain.vercel.app/api/games/quiz/random",
    exampleResponse: `{
  "success": true,
  "data": {
    "id": 1,
    "question": "ما عاصمة النرويج؟",
    "answers": ["أوسلو", "اوسلو"],
    "category": "جغرافيا"
  }
}`,
    errorResponse: `{
  "success": false,
  "message": "Collection \\"quiz\\" is empty",
  "code": "NOT_FOUND"
}`,
    notes: [
      "الاختيار العشوائي يعتمد على crypto.getRandomValues، وليس Math.random العادية، لضمان توزيع أكثر انتظامًا.",
      "لا حالة (state) محفوظة بين الطلبات — كل استدعاء مستقل تمامًا.",
    ],
  },
  {
    method: "GET",
    path: "/api/games/quiz/random-exclude",
    title: "سؤال عشوائي مع استثناء",
    description:
      "ترجع سؤالًا عشوائيًا واحدًا، مع استثناء كل الـ id المذكورة في معامل الاستعلام ids (مفصولة بفواصل). أهم نقطة وصول لبناء تجربة \"عدم تكرار السؤال\" في بوت الواتساب.",
    params: [
      {
        name: "ids",
        type: "string (أرقام مفصولة بفواصل)",
        required: false,
        description: "مثال: ids=1,2,3,4. إذا حُذف المعامل أو تُرك فارغًا، يعمل الرابط تمامًا مثل /random العادي.",
      },
    ],
    exampleRequest: "GET https://your-domain.vercel.app/api/games/quiz/random-exclude?ids=1,2,3,4,5",
    exampleResponse: `{
  "success": true,
  "data": {
    "id": 12,
    "question": "من مؤلف رواية مئة عام من العزلة؟",
    "answers": ["غابرييل غارثيا ماركيز", "ماركيز"],
    "category": "أدب"
  }
}`,
    errorResponse: `{
  "success": false,
  "message": "لا يوجد أي سؤال متبقٍ بعد استثناء كل الأسئلة الممرَّرة (كل الأسئلة استُخدمت بالفعل)",
  "code": "NOT_FOUND"
}`,
    notes: [
      "إذا استُثنيت كل الأسئلة المتاحة، يرجع الرابط خطأ 404 واضحًا بدل تكرار سؤال قديم بصمت.",
      "الـ API بلا حالة (stateless) تمامًا — البوت هو المسؤول عن تخزين قائمة الـ id المستخدمة لكل مجموعة على حدة، وإرسالها مع كل طلب.",
      "قيمة id غير صالحة داخل ids (مثل نص غير رقمي) ترجع خطأ 400 BAD_REQUEST.",
    ],
  },
  {
    method: "GET",
    path: "/api/games/quiz/count",
    title: "إجمالي عدد الأسئلة",
    description: "ترجع العدد الإجمالي لأسئلة الكويز المتاحة حاليًا في قاعدة البيانات.",
    exampleRequest: "GET https://your-domain.vercel.app/api/games/quiz/count",
    exampleResponse: `{
  "success": true,
  "data": { "count": 260 }
}`,
    notes: ["مفيدة لعرض إحصائية في البوت (مثل \"إجمالي الأسئلة: 260\") أو للتحقق بعد تحديث ملف البيانات."],
  },
  {
    method: "GET",
    path: "/api/games/quiz/all",
    title: "كل الأسئلة",
    description: "ترجع كل أسئلة الكويز كمصفوفة كاملة دفعة واحدة.",
    exampleRequest: "GET https://your-domain.vercel.app/api/games/quiz/all",
    exampleResponse: `{
  "success": true,
  "data": [
    { "id": 1, "question": "ما عاصمة النرويج؟", "answers": ["أوسلو", "اوسلو"], "category": "جغرافيا" },
    { "id": 2, "question": "ما عاصمة تشيلي؟", "answers": ["سانتياغو", "سانتياجو"], "category": "جغرافيا" }
  ]
}`,
    notes: [
      "يُنصح باستخدامها لأغراض الإدارة والاختبار، وليس كأول اختيار للبوت في كل رسالة — استخدم /random أو /random-exclude لذلك.",
    ],
  },
  {
    method: "GET",
    path: "/api/games/quiz/{id}",
    title: "سؤال محدد بالرقم",
    description: "ترجع سؤالًا واحدًا محددًا بالضبط عبر رقمه (id)، بدل سؤال عشوائي.",
    params: [
      { name: "id", type: "integer > 0", required: true, description: "رقم السؤال المطلوب (جزء من المسار نفسه)." },
    ],
    exampleRequest: "GET https://your-domain.vercel.app/api/games/quiz/2",
    exampleResponse: `{
  "success": true,
  "data": {
    "id": 2,
    "question": "ما عاصمة تشيلي؟",
    "answers": ["سانتياغو", "سانتياجو"],
    "category": "جغرافيا"
  }
}`,
    errorResponse: `{
  "success": false,
  "message": "No item with id 9999 in \\"quiz\\"",
  "code": "NOT_FOUND"
}`,
    notes: [
      "مفيدة لإعادة عرض نفس السؤال (مثلًا بعد إجابة خاطئة) أو لبناء تصفح تسلسلي للأسئلة.",
      "id غير رقمي أو صفر أو سالب يرجع خطأ 400 BAD_REQUEST بدل 404.",
    ],
  },
];
