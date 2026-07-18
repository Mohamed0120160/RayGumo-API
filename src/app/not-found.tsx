/**
 * صفحة 404 العامة (Global Not Found) لأي مسار غير API لا يوجد.
 * (مسارات /api/* لها معالج منفصل يرجع JSON - انظر
 * src/app/api/[...notfound]/route.ts)
 */
export default function NotFound() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>404 - Not Found</h1>
      <p>
        This route does not exist. If you were calling the API, check the endpoint path against the
        README and make sure you&apos;re using the correct HTTP method.
      </p>
    </main>
  );
}
