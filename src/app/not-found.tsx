import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-[#172334]">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mt-4">الصفحة غير موجودة</p>
        <p className="text-gray-500 mt-2">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-[#e97825] text-white rounded-lg font-semibold hover:bg-[#d4691a] transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
