import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    setIsLoading(true);
    const result = await login(username, password, rememberMe);
    setIsLoading(false);

    if (result.success) {
      navigate("/", { replace: true });
    } else if (result.message) {
      setError(result.message);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-white text-slate-800 flex flex-col lg:flex-row overflow-hidden select-none text-right font-sans"
    >
      {/* ================= ستون اول: فرم لاگین خلوت با اینپوت‌های انیمیشنی ================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 sm:p-14 lg:p-20 bg-white relative z-10">
        {/* لوگو و نام کوچک بالای صفحه */}
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="گروه صنعتی پیمان"
              className="w-10 h-10 object-contain mix-blend-multiply"
            />
            <span className="font-bold text-slate-800 text-base">
              گروه صنعتی پیمان
            </span>
          </div>
        </div>

        {/* باکس اصلی فرم در مرکز */}
        <div className="w-full max-w-sm mx-auto my-auto">
          {/* هدر مخصوص موبایل */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <img
              src="/logo.png"
              alt="گروه صنعتی پیمان"
              className="w-24 h-24 object-contain mix-blend-multiply mb-2"
            />
            <h1 className="text-xl font-black text-slate-900">
              گروه صنعتی پیمان «حسنی»
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              سامانه انبار و صدور فاکتور
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              خوش آمدید
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              برای ورود به سامانه انبار و حسابداری، مشخصات خود را وارد کنید.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/80 flex items-center gap-2.5 text-rose-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* اینپوت ۱: نام کاربری */}
            <div className="relative group">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                autoComplete="username"
                className="peer w-full pr-11 pl-4 pt-6 pb-2.5 bg-slate-50/70 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
              />
              <User className="w-5 h-5 text-slate-400 peer-focus:text-blue-600 peer-focus:scale-110 transition-all duration-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

              <label
                htmlFor="username"
                className="absolute right-11 top-2 text-[11px] font-bold text-blue-600 transition-all duration-200 pointer-events-none
                           peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-medium
                           peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-blue-600 peer-focus:font-bold"
              >
                نام کاربری
              </label>

              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-blue-600 rounded-full transition-all duration-300 peer-focus:w-4/5" />
            </div>

            {/* اینپوت ۲: رمز عبور */}
            <div className="relative group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                autoComplete="current-password"
                className="peer w-full pr-11 pl-11 pt-6 pb-2.5 bg-slate-50/70 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
              />
              <Lock className="w-5 h-5 text-slate-400 peer-focus:text-blue-600 peer-focus:scale-110 transition-all duration-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

              <label
                htmlFor="password"
                className="absolute right-11 top-2 text-[11px] font-bold text-blue-600 transition-all duration-200 pointer-events-none
                           peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-medium
                           peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-blue-600 peer-focus:font-bold"
              >
                رمز عبور
              </label>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-blue-600 rounded-full transition-all duration-300 peer-focus:w-4/5" />
            </div>

            {/* تیک مرا به خاطر بسپار */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-500">
                  مرا به خاطر بسپار
                </span>
              </label>
            </div>

            {/* دکمه ورود */}
            <button
              type="submit"
              disabled={isLoading}
              className="group w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>ورود به حساب</span>
                  <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* فوتر */}
        <div className="text-xs text-slate-400 text-center sm:text-right">
          سامانه یکپارچه انبار و مالی • گروه صنعتی پیمان
        </div>
      </div>

      {/* ================= ستون دوم: پنل آبی ساده و شیک ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 items-center justify-center p-12 text-white">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-950/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div className="w-36 h-36 rounded-3xl bg-white shadow-2xl shadow-blue-950/30 flex items-center justify-center p-4 mb-8 transition-transform duration-500 hover:scale-105">
            <img
              src="/logo.png"
              alt="گروه صنعتی پیمان"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>

          <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white mb-2">
            گروه صنعتی پیمان
          </h1>
          <span className="text-base font-bold text-sky-200 mb-6">«حسنی»</span>

          <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
            تولید کننده انواع قطعات لاستیکی خودرو و صنعتی
            <br />
            به سامانه مدیریت موجودی انبار، صدور فاکتور و حسابرسی خوش آمدید.
          </p>
        </div>
      </div>
    </div>
  );
};
