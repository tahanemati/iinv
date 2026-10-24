import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  Landmark,
  TrendingUp,
  AlertTriangle,
  FileText,
  ArrowUpLeft,
  FilePlus2,
  CreditCard,
  Clock,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";
import { useInventoryStore } from "../../store/useInventoryStore";
import { useCustomerStore } from "../../store/useCustomerStore";
import { useFinanceStore } from "../../store/useFinanceStore";
import { useInvoiceStore } from "../../store/useInvoiceStore";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { products } = useInventoryStore();
  const { customers, transactions: customerTx } = useCustomerStore();
  const { bankAccount, purchases } = useFinanceStore();
  const { invoices } = useInvoiceStore();

  const liveStats = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const safeCustomerTx = Array.isArray(customerTx) ? customerTx : [];
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const safePurchases = Array.isArray(purchases) ? purchases : [];

    const totalPartsCount = safeProducts.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );
    const totalInventoryValue = safeProducts.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0,
    );
    const totalReceivable = safeCustomers.reduce(
      (sum, c) => (c.balance > 0 ? sum + c.balance : sum),
      0,
    );

    const totalSales =
      safeInvoices.reduce((sum, i) => sum + i.finalAmount, 0) +
      safeCustomerTx
        .filter((t) => t.type === "INVOICE")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalPurchases = safePurchases.reduce(
      (sum, p) => sum + p.totalAmount,
      0,
    );
    const netProfit = totalSales - totalPurchases;

    return {
      totalPartsCount,
      totalInventoryValue,
      productTypes: safeProducts.length,
      totalReceivable,
      debtorsCount: safeCustomers.filter((c) => c.balance > 0).length,
      bankBalance: bankAccount?.balance || 0,
      netProfit,
      totalSales,
    };
  }, [products, customers, customerTx, bankAccount, purchases, invoices]);

  const pendingChecks = useMemo(() => {
    const safeTx = Array.isArray(customerTx) ? customerTx : [];
    const safeCustomers = Array.isArray(customers) ? customers : [];

    return safeTx
      .filter(
        (t) =>
          t.type === "PAYMENT_CHECK" &&
          (t.checkStatus || "PENDING") === "PENDING",
      )
      .map((t) => {
        const cust = safeCustomers.find((c) => c.id === t.customerId);
        return {
          ...t,
          customerName: cust?.name || "مشتری نامشخص",
        };
      });
  }, [customerTx, customers]);

  const lowStockItems = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    return safeProducts.filter((p) => p.quantity <= p.minStock).slice(0, 5);
  }, [products]);

  const quickActions = [
    {
      label: "صدور فاکتور رسمی",
      desc: "چاپ فوری A4 و A5",
      icon: FilePlus2,
      path: "/invoices/new",
      color: "from-blue-600 to-indigo-600",
      shadow: "shadow-blue-600/20",
    },
    {
      label: "انبار و موجودی",
      desc: "ثبت تولید و خروج",
      icon: Package,
      path: "/inventory",
      color: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-600/20",
    },
    {
      label: "حساب مشتریان",
      desc: "دریافت چک و نقد",
      icon: Users,
      path: "/customers",
      color: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
    },
    {
      label: "فاکتور خرید",
      desc: "هزینه و مواد اولیه",
      icon: ShoppingBag,
      path: "/purchases",
      color: "from-purple-600 to-indigo-700",
      shadow: "shadow-purple-600/20",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-7">
      {/* ================= بنر بالای داشبورد ================= */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-l from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-8 shadow-xl overflow-hidden">
        {/* افکت‌های نوری پس‌زمینه */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-5 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-sky-300 text-[10px] sm:text-xs font-bold">
              <Sparkles className="w-3 h-3" />
              <span>پنل هوشمند مدیریت و حسابداری</span>
            </span>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              گروه صنعتی پیمان حسنی (PN)
            </h1>
            <p className="hidden sm:block text-sm text-slate-300 leading-relaxed">
              تولیدکننده قطعات لاستیکی خودرو و صنعتی • کلیه آمار انبار، حساب
              مشتریان و تراز مالی به صورت لحظه‌ای بروزرسانی می‌شوند.
            </p>
          </div>

          {/* میانبرهای سریع (در موبایل ۲ ستونه، در دسکتاپ ۴ ستونه) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 shrink-0 mt-2 sm:mt-0">
            {quickActions.map((act, i) => {
              const Icon = act.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(act.path)}
                  className={`group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${act.color} shadow-lg ${act.shadow} hover:-translate-y-1 transition-all duration-200 text-right cursor-pointer active:scale-95 overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[110px]`}
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-125 transition-transform duration-500">
                    <Icon className="w-16 h-16" />
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center shrink-0 mb-2 sm:mb-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[11px] sm:text-xs font-black block leading-tight text-white">
                      {act.label}
                    </span>
                    <span className="hidden sm:block text-[10px] text-white/80 font-medium mt-0.5">
                      {act.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= ۴ کارت آمار زنده (در موبایل ۲ در ۲) ================= */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        {/* کارت ۱: انبار قطعات */}
        <div
          onClick={() => navigate("/inventory")}
          className="group bg-white rounded-xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 hover:border-blue-400 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
              <span>{liveStats.productTypes.toLocaleString("fa-IR")} نوع</span>
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400">
              قطعات انبار
            </p>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-black text-slate-900 truncate">
                {liveStats.totalPartsCount.toLocaleString("fa-IR")}
              </span>
              <span className="text-[9px] sm:text-xs font-bold text-slate-400">
                عدد
              </span>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-3 border-t border-slate-100 items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">ارزش کل:</span>
            <span className="font-black text-slate-700 truncate max-w-[100px]">
              {liveStats.totalInventoryValue.toLocaleString("fa-IR")} ت
            </span>
          </div>
        </div>

        {/* کارت ۲: طلب از مشتریان */}
        <div
          onClick={() => navigate("/customers")}
          className="group bg-white rounded-xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 hover:border-amber-400 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
              <span>
                {liveStats.debtorsCount.toLocaleString("fa-IR")} بدهکار
              </span>
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400">
              طلب مشتریان
            </p>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-black text-slate-900 truncate">
                {liveStats.totalReceivable.toLocaleString("fa-IR")}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-3 border-t border-slate-100 items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">چک در جریان:</span>
            <span className="font-black text-amber-600">
              {pendingChecks.length.toLocaleString("fa-IR")} فقره
            </span>
          </div>
        </div>

        {/* کارت ۳: حساب بانکی کارخانه */}
        <div
          onClick={() => navigate("/bank")}
          className="group bg-white rounded-xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 hover:border-emerald-400 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
              <span>کارت فعال</span>
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400">
              موجودی کارت بانکی
            </p>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1.5">
              <span className="text-lg sm:text-2xl font-black text-emerald-600 truncate">
                {liveStats.bankBalance.toLocaleString("fa-IR")}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-3 border-t border-slate-100 items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">بانک عامل:</span>
            <span className="font-bold text-slate-700 truncate max-w-[100px]">
              {bankAccount?.bankName || "بانک ملت"}
            </span>
          </div>
        </div>

        {/* کارت ۴: تراز سود و زیان */}
        <div
          onClick={() => navigate("/reports")}
          className="group bg-white rounded-xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 hover:border-indigo-400 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
              <span>ترازنامه</span>
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400">
              سود خالص کل
            </p>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1.5">
              <span
                className={`text-lg sm:text-2xl font-black truncate ${
                  liveStats.netProfit >= 0 ? "text-indigo-600" : "text-rose-600"
                }`}
              >
                {liveStats.netProfit.toLocaleString("fa-IR")}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex mt-4 pt-3 border-t border-slate-100 items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">کل فروش:</span>
            <span className="font-black text-slate-700 truncate max-w-[100px]">
              {liveStats.totalSales.toLocaleString("fa-IR")} ت
            </span>
          </div>
        </div>
      </div>

      {/* ================= ۳ ستون عملیاتی پایین داشبورد ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* ستون ۱: هشدار کسری موجودی قطعات انبار */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                    هشدار موجودی انبار
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-400">
                    نیاز به تولید یا شارژ
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="py-6 sm:py-10 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500 mx-auto" />
                  <p className="text-[11px] sm:text-xs font-bold text-emerald-700">
                    موجودی انبار تکمیل است!
                  </p>
                </div>
              ) : (
                lowStockItems.map((item) => {
                  const percent = Math.min(
                    100,
                    Math.round(
                      (item.quantity / Math.max(1, item.minStock * 2)) * 100,
                    ),
                  );
                  const isZero = item.quantity === 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate("/inventory")}
                      className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/60 cursor-pointer space-y-1.5 sm:space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] sm:text-xs">
                        <span className="font-black text-slate-800 truncate pl-2">
                          {item.name}
                        </span>
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md font-black shrink-0 ${
                            isZero
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isZero
                            ? "ناموجود"
                            : `${item.quantity.toLocaleString("fa-IR")} ${item.unit}`}
                        </span>
                      </div>
                      <div className="w-full h-1 sm:h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isZero ? "bg-rose-500" : "bg-amber-500"}`}
                          style={{ width: `${isZero ? 5 : percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ستون ۲: سررسید چک‌های صیادی مشتریان */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                    سررسید چک‌ها
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-400">
                    در انتظار وصول
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              {pendingChecks.length === 0 ? (
                <div className="py-6 sm:py-10 text-center text-[11px] sm:text-xs text-slate-400 font-medium">
                  چک در جریانی وجود ندارد.
                </div>
              ) : (
                pendingChecks.slice(0, 4).map((chk) => (
                  <div
                    key={chk.id}
                    onClick={() => navigate("/checks")}
                    className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/60 cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pl-2">
                      <span className="font-black text-slate-800 text-[11px] sm:text-xs block truncate">
                        {chk.customerName}
                      </span>
                      <span className="text-[9px] sm:text-[11px] font-bold text-amber-700 mt-0.5 sm:mt-1 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 hidden sm:block" />
                        سررسید: {chk.checkDueDate || chk.date}
                      </span>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-black text-slate-900 text-xs sm:text-sm block">
                        {chk.amount.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ستون ۳: آخرین فاکتورهای فروش صادرشده */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                    آخرین فاکتورها
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-400">
                    فروش‌های ثبت‌شده اخیر
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              {invoices.length === 0 ? (
                <div className="py-6 sm:py-10 text-center space-y-2">
                  <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 mx-auto" />
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    هنوز فاکتوری صادر نشده است.
                  </p>
                </div>
              ) : (
                invoices.slice(0, 4).map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => navigate("/invoices/new")}
                    className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/60 cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pl-2">
                      <span className="font-black text-slate-800 text-[11px] sm:text-xs block truncate">
                        {inv.customerName}
                      </span>
                      <span className="text-[9px] sm:text-[11px] text-slate-400 font-bold mt-0.5 sm:mt-1 block">
                        ش: {inv.invoiceNo} • {inv.date}
                      </span>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-black text-blue-700 text-xs sm:text-sm block">
                        {inv.finalAmount.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
