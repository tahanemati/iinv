import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

export const PagePreloader: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    setVisible(true);
    setFadeOut(false);
    setProgress(15);

    // در صفحه لاگین یا اولین باز شدن سایت، بیشتر روی صفحه می‌ماند (۲.۳ ثانیه)
    // در جابه‌جایی بین منوهای داخلی، سریع‌تر رد می‌شود (۰.۸۵ ثانیه)
    const isLoginOrFirst =
      location.pathname === "/login" || isFirstLoad.current;
    const duration = isLoginOrFirst ? 2200 : 750;
    isFirstLoad.current = false;

    const p1 = setTimeout(() => setProgress(65), duration * 0.35);
    const p2 = setTimeout(() => setProgress(100), duration * 0.8);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, duration + 450);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 transition-all duration-500 select-none ${
        fadeOut
          ? "opacity-0 pointer-events-none scale-105"
          : "opacity-100 scale-100"
      }`}
    >
      {/* هاله‌های نوری ملایم در پس‌زمینه برای عمق دادن به رنگ آبی */}
      <div className="absolute w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* قاب سفید شیک دور لوگو */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/90 backdrop-blur-md shadow-xl shadow-blue-900/10 border border-white flex items-center justify-center p-4 mb-6">
          <img
            src="/logo.png"
            alt="گروه صنعتی پیمان"
            className="w-full h-full object-contain mix-blend-multiply animate-pulse"
            draggable={false}
          />
        </div>

        {/* نام شرکت و شعار */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          گروه صنعتی پیمان
        </h1>
        <span className="text-sm font-bold text-blue-600 mt-1">«حسنی»</span>
        <p className="text-xs font-medium text-slate-500 mt-2">
          تولید کننده انواع قطعات لاستیکی خودرو و صنعتی
        </p>

        {/* نوار پیشرفت (Progress Bar) نرم و واقعی */}
        <div className="w-48 h-1.5 bg-blue-200/60 rounded-full overflow-hidden mt-7 p-0.5">
          <div
            className="h-full bg-gradient-to-l from-blue-600 to-sky-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
