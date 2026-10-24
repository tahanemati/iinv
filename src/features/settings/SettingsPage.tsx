import React, { useState, useEffect } from "react";
import {
  UserCog,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldCheck,
  BadgeCheck,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

export const SettingsPage: React.FC = () => {
  const { user, updateCredentials, fetchProfileFromServer } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "admin");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [status, setStatus] = useState<{
    type: "SUCCESS" | "ERROR";
    text: string;
  } | null>(null);

  // دریافت آخرین اطلاعات کاربری از سرور هنگام باز شدن صفحه تنظیمات
  useEffect(() => {
    fetchProfileFromServer();
  }, [fetchProfileFromServer]);

  // بروزرسانی فیلدها وقتی اطلاعات کاربر از سرور یا استور تغییر کرد
  useEffect(() => {
    if (user) {
      setUsername(user.username || "admin");
      setFullName(user.fullName || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!username.trim()) {
      setStatus({
        type: "ERROR",
        text: "نام کاربری نمی‌تواند خالی باشد.",
      });
      return;
    }

    if (!currentPassword) {
      setStatus({
        type: "ERROR",
        text: "لطفاً برای تایید هویت و ذخیره تغییرات، رمز عبور فعلی خود را وارد کنید.",
      });
      return;
    }

    if (newPassword && newPassword.length < 3) {
      setStatus({
        type: "ERROR",
        text: "رمز عبور جدید باید حداقل ۳ کاراکتر باشد.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({
        type: "ERROR",
        text: "رمز عبور جدید و تکرار آن با هم مطابقت ندارند!",
      });
      return;
    }

    setIsSubmitting(true);

    const res = await updateCredentials({
      currentPassword,
      newUsername: username.trim(),
      newFullName: fullName.trim(),
      newPassword: newPassword.trim() ? newPassword.trim() : undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setStatus({ type: "ERROR", text: res.message });
      return;
    }

    setStatus({ type: "SUCCESS", text: res.message });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* هدر */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <UserCog className="w-7 h-7 text-blue-600" />
            <span>تنظیمات حساب کاربری و امنیت</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ویرایش نام کاربری ورود به سامانه، نام نمایشی مدیریت و تغییر رمز عبور
            (متصل به دیتابیس سرور)
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 self-start sm:self-auto">
          <BadgeCheck className="w-4 h-4 shrink-0" />
          <span>نام کاربری فعلی: {user?.username}</span>
        </div>
      </div>

      {/* پیام خطا یا موفقیت */}
      {status && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold ${
            status.type === "SUCCESS"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {status.type === "SUCCESS" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{status.text}</span>
        </div>
      )}

      {/* فرم ویرایش نام کاربری و رمز عبور */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* بخش ۱: مشخصات کاربری */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-black text-slate-800 text-base">
              ۱. مشخصات حساب مدیریت
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                نام کاربری جدید (جهت ورود به سیستم) *
              </label>
              <input
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black font-mono text-left text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                عنوان / نام نمایشی مدیر در پنل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مدیریت گروه صنعتی پیمان"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* بخش ۲: تغییر رمز عبور */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-blue-600" />
            <h2 className="font-black text-slate-800 text-base">
              ۲. تایید هویت و تغییر رمز عبور
            </h2>
          </div>

          {/* رمز عبور فعلی */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              رمز عبور فعلی (برای ذخیره هرگونه تغییر الزامی است — پیش‌فرض: 123)
              *
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? "text" : "password"}
                dir="ltr"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز عبور فعلی را وارد کنید..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-left text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* رمز عبور جدید و تکرار آن */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                رمز عبور جدید (در صورت تمایل به تغییر رمز)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="رمز جدید..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-left text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                تکرار رمز عبور جدید
              </label>
              <input
                type={showNewPass ? "text" : "password"}
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار رمز جدید..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-left text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              نکته: اگر فقط قصد تغییر «نام کاربری» یا «نام نمایشی» را دارید،
              می‌توانید فیلدهای رمز عبور جدید را خالی بگذارید.
            </span>
          </p>
        </div>

        {/* دکمه ذخیره */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال ذخیره در سرور...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات در سرور</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
