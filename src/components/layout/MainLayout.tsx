import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FilePlus2,
  Users,
  CreditCard,
  ShoppingBag,
  Landmark,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  CalendarDays,
  Clock,
  ChevronLeft,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useInventoryStore } from "../../store/useInventoryStore";
import { useCustomerStore } from "../../store/useCustomerStore";

const navGroups = [
  {
    groupTitle: "بخش عملیاتی و فروش",
    items: [
      {
        name: "پیشخوان مدیریت",
        subtitle: "خلاصه وضعیت کل کارخانه",
        path: "/",
        icon: LayoutDashboard,
      },
      {
        name: "انبار قطعات",
        subtitle: "موجودی، قیمت و کاردکس",
        path: "/inventory",
        icon: Package,
        badgeType: "inventory",
      },
      {
        name: "صدور فاکتور فروش",
        subtitle: "چاپ رسمی A4 و A5",
        path: "/invoices/new",
        icon: FilePlus2,
      },
      {
        name: "مشتریان و مانده حساب",
        subtitle: "بدهکاران و صورتحساب",
        path: "/customers",
        icon: Users,
      },
    ],
  },
  {
    groupTitle: "امور مالی و حسابداری",
    items: [
      {
        name: "چک‌های صیادی و سررسید",
        subtitle: "وصول و هشدار چک‌ها",
        path: "/checks",
        icon: CreditCard,
        badgeType: "checks",
      },
      {
        name: "خرید و خرج‌کرد کارخانه",
        subtitle: "مواد اولیه و هزینه‌ها",
        path: "/purchases",
        icon: ShoppingBag,
      },
      {
        name: "حساب بانکی کارخانه",
        subtitle: "ورودی و خروجی کارت",
        path: "/bank",
        icon: Landmark,
      },
      {
        name: "گزارش سود و زیان",
        subtitle: "ترازنامه ماهانه و سالانه",
        path: "/reports",
        icon: TrendingUp,
      },
    ],
  },
  {
    groupTitle: "مدیریت سامانه",
    items: [
      {
        name: "تنظیمات حساب کاربری",
        subtitle: "نام کاربری و رمز عبور",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { products } = useInventoryStore();
  const { transactions } = useCustomerStore();

  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // ساعت زنده دیجیتال در هدر
  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        setCurrentTime(
          now.toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      } catch {
        setCurrentTime("");
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // محاسبه هشدارهای زنده (موجود در انبار و چک‌ها) برای زنگوله
  const alerts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const safeTx = Array.isArray(transactions) ? transactions : [];

    const lowStockCount = safeProducts.filter(
      (p) => p.quantity <= p.minStock,
    ).length;
    const pendingChecksCount = safeTx.filter(
      (t) =>
        t.type === "PAYMENT_CHECK" &&
        (t.checkStatus || "PENDING") === "PENDING",
    ).length;

    return {
      lowStockCount,
      pendingChecksCount,
      total: lowStockCount + pendingChecksCount,
    };
  }, [products, transactions]);

  // پیدا کردن عنوان صفحه فعلی برای نمایش در هدر
  const currentPageInfo = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.path === location.pathname) return item;
      }
    }
    return navGroups[0].items[0];
  }, [location.pathname]);

  const todayJalali = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      dir="rtl"
      // حذف flex از کانتینر اصلی برای استفاده از Fixed Sidebar
      className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans print:bg-white overflow-x-hidden"
    >
      {/* استایل انیمیشن‌های سفارشی (ورود صفحات و لرزش زنگوله) */}
      <style>
        {`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-page-enter {
            animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          
          @keyframes bellRing {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(15deg); }
            50% { transform: rotate(-10deg); }
            75% { transform: rotate(5deg); }
          }
          .animate-bell-ring {
            animation: bellRing 1.5s ease-in-out infinite;
            transform-origin: top center;
          }
        `}
      </style>

      {/* لایه تیره پشت منو در موبایل */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="print:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
        />
      )}

      {/* ================= سایدبار مدرن کاملا Fixed ================= */}
      <aside
        className={`print:hidden fixed inset-y-0 right-0 z-50 w-[280px] sm:w-80 bg-white border-l border-slate-200/80 shadow-2xl lg:shadow-none flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-slate-100/80">
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer rounded-2xl bg-gradient-to-l from-slate-900 via-slate-800 to-blue-950 text-white p-3 sm:p-3.5 shadow-lg flex items-center justify-between transition-transform hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1.5 shadow-sm shrink-0 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="PN"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-white text-sm sm:text-base truncate">
                    گروه صنعتی پیمان
                  </h1>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black bg-blue-500/30 text-sky-300 rounded-md border border-sky-400/30">
                    PN
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 block mt-0.5 truncate">
                  مدیریت و حسابداری «حسنی»
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(false);
              }}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-white/20 active:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 hide-scrollbar">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <span className="px-3 text-[10px] sm:text-[11px] font-black text-slate-400 block mb-2 tracking-wide">
                {group.groupTitle}
              </span>

              {group.items.map((item) => {
                const Icon = item.icon;
                const badgeValue =
                  item.badgeType === "inventory"
                    ? alerts.lowStockCount
                    : item.badgeType === "checks"
                      ? alerts.pendingChecksCount
                      : 0;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-l from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25 -translate-x-1"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"}`}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>

                          <div className="truncate">
                            <span className="font-black text-xs sm:text-sm block truncate leading-snug">
                              {item.name}
                            </span>
                            <span
                              className={`text-[9px] sm:text-[11px] font-medium block truncate mt-0.5 ${isActive ? "text-blue-100" : "text-slate-400 group-hover:text-slate-500"}`}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1">
                          {badgeValue > 0 && (
                            <span
                              className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[11px] font-black ${isActive ? "bg-white text-blue-700" : item.badgeType === "inventory" ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-amber-100 text-amber-700"}`}
                            >
                              {badgeValue.toLocaleString("fa-IR")}
                            </span>
                          )}
                          <ChevronLeft
                            className={`w-3.5 h-3.5 transition-all duration-200 ${isActive ? "text-white opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1"}`}
                          />
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center">
                  PN
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="truncate">
                <p className="text-[11px] sm:text-xs font-black text-slate-800 truncate">
                  {user?.fullName || "مدیریت پیمان"}
                </p>
                <p className="text-[9px] sm:text-[11px] text-emerald-600 font-bold mt-0.5">
                  آنلاین • {user?.username || "admin"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="خروج از سامانه"
              className="p-1.5 sm:p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= هدر و محتوای اصلی ================= */}
      {/* حاشیه سمت راست هوشمند: محتوا رو روی دسکتاپ دقیقاً در کنار سایدبار قرار میده و از اسکرول خوردن روی هم جلوگیری میکنه */}
      <div className="flex flex-col min-h-screen lg:mr-80 print:mr-0 transition-all duration-300 ease-in-out">
        {/* هدر با استایل شیشه‌ای (Glassmorphism) مخصوص موبایل و دسکتاپ */}
        <header className="print:hidden h-16 sm:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* بخش راست: منوی همبرگری و عنوان صفحه */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="truncate pr-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <h2 className="font-black text-slate-900 text-sm sm:text-lg truncate">
                  {currentPageInfo.name}
                </h2>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                {currentPageInfo.subtitle}
              </p>
            </div>
          </div>

          {/* بخش چپ: زنگوله، ساعت و دکمه فاکتور */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 pl-1">
            {/* ساعت دیجیتالی خفن (فقط در صفحات متوسط به بالا دیده می‌شه) */}
            {currentTime && (
              <div className="hidden md:flex items-center gap-1.5 text-blue-900 font-black font-mono text-[13px] sm:text-sm tracking-[0.1em] bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-100/50">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="pt-0.5">{currentTime}</span>
              </div>
            )}

            {/* زنگوله هوشمند اعلانات */}
            <div className="relative">
              {notifOpen && (
                <div
                  className="fixed inset-0 z-40 sm:hidden"
                  onClick={() => setNotifOpen(false)}
                />
              )}

              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer active:scale-95 ${notifOpen ? "bg-blue-100 text-blue-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                title="اعلانات کارخانه"
              >
                {/* انیمیشن لرزش وقتی هشدار هست فعال می‌شه */}
                <Bell
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${alerts.total > 0 && !notifOpen ? "animate-bell-ring text-rose-600" : ""}`}
                />

                {alerts.total > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center ring-2 ring-white px-1">
                    {alerts.total}
                  </span>
                )}
              </button>

              {/* کادر بازشوی اعلانات (کاملاً موبایل فرندلی) */}
              {notifOpen && (
                <>
                  <div
                    className="hidden sm:block fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute left-0 mt-3 w-[260px] sm:w-[320px] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl p-4 z-50 animate-page-enter">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-3 mb-2 sm:mb-3">
                      <span className="font-black text-slate-900 text-[11px] sm:text-xs">
                        هشدارهای سیستم
                      </span>
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="text-[10px] sm:text-xs text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      >
                        بستن
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div
                        onClick={() => {
                          setNotifOpen(false);
                          navigate("/inventory");
                        }}
                        className="p-2.5 sm:p-3 rounded-xl bg-rose-50/70 hover:bg-rose-100 border border-rose-200/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <div>
                            <span className="font-black text-rose-900 text-[11px] sm:text-xs block">
                              کسری موجودی انبار
                            </span>
                            <span className="text-rose-600 text-[9px] sm:text-[11px]">
                              {alerts.lowStockCount.toLocaleString("fa-IR")}{" "}
                              قطعه در حال اتمام
                            </span>
                          </div>
                        </div>
                        <ChevronLeft className="w-3.5 h-3.5 text-rose-400" />
                      </div>

                      <div
                        onClick={() => {
                          setNotifOpen(false);
                          navigate("/checks");
                        }}
                        className="p-2.5 sm:p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-200/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-black text-amber-900 text-[11px] sm:text-xs block">
                              چک‌های در انتظار وصول
                            </span>
                            <span className="text-amber-700 text-[9px] sm:text-[11px]">
                              {alerts.pendingChecksCount.toLocaleString(
                                "fa-IR",
                              )}{" "}
                              چک در دست
                            </span>
                          </div>
                        </div>
                        <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* دکمه صدور فاکتور */}
            <button
              onClick={() => navigate("/invoices/new")}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-sm font-black shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">صدور فاکتور فروش</span>
              <span className="sm:hidden">فاکتور</span>
            </button>
          </div>
        </header>

        {/* ================= فضای محتوای صفحات ================= */}
        <main
          key={location.pathname}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 animate-page-enter"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
