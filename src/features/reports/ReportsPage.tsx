import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Printer,
  FileSpreadsheet,
  ShoppingBag,
  CreditCard,
  Award,
  ChevronLeft,
  CalendarRange,
} from "lucide-react";
import { useInvoiceStore } from "../../store/useInvoiceStore";
import { useFinanceStore } from "../../store/useFinanceStore";
import { useCustomerStore } from "../../store/useCustomerStore";
import { getTodayJalali } from "../../store/useInventoryStore";

// تبدیل اعداد فارسی و عربی به انگلیسی برای مقایسه دقیق تاریخ‌ها
const normalizeDigits = (str: string = "") =>
  str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const MONTHS = [
  { code: "01", name: "فروردین" },
  { code: "02", name: "اردیبهشت" },
  { code: "03", name: "خرداد" },
  { code: "04", name: "تیر" },
  { code: "05", name: "مرداد" },
  { code: "06", name: "شهریور" },
  { code: "07", name: "مهر" },
  { code: "08", name: "آبان" },
  { code: "09", name: "آذر" },
  { code: "10", name: "دی" },
  { code: "11", name: "بهمن" },
  { code: "12", name: "اسفند" },
];

export const ReportsPage: React.FC = () => {
  const { invoices } = useInvoiceStore();
  const { purchases, bankTransactions } = useFinanceStore();
  const { transactions: customerTx } = useCustomerStore();

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeBankTx = Array.isArray(bankTransactions) ? bankTransactions : [];
  const safeCustomerTx = Array.isArray(customerTx) ? customerTx : [];

  // انتخاب سال و ماه برای استعلام سود و زیان
  const [selectedYear, setSelectedYear] = useState("1405");
  const [selectedMonth, setSelectedMonth] = useState<"ALL" | string>("ALL");

  // جمع‌آوری کل فروش‌ها
  const allSales = useMemo(() => {
    const invNumbers = new Set(
      safeInvoices.map((i) => normalizeDigits(i.invoiceNo)),
    );
    const initialCustomerInvoices = safeCustomerTx
      .filter(
        (t) =>
          t.type === "INVOICE" &&
          (!t.invoiceNo || !invNumbers.has(normalizeDigits(t.invoiceNo))),
      )
      .map((t) => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        title: t.description,
      }));

    const directInvoices = safeInvoices.map((i) => ({
      id: i.id,
      date: i.date,
      amount: i.finalAmount,
      title: `فاکتور شماره ${i.invoiceNo} - ${i.customerName}`,
    }));

    return [...directInvoices, ...initialCustomerInvoices];
  }, [safeInvoices, safeCustomerTx]);

  // خرج‌کردهای دستی کارت کارخانه
  const manualBankExpenses = useMemo(() => {
    return safeBankTx.filter(
      (t) =>
        t.type === "OUT" &&
        !t.title.includes("(فروشنده:") &&
        !t.title.includes("(فاکتور"),
    );
  }, [safeBankTx]);

  // محاسبه سود و زیان برای بازه انتخاب‌شده
  const periodStats = useMemo(() => {
    const prefix =
      selectedMonth === "ALL"
        ? `${selectedYear}/`
        : `${selectedYear}/${selectedMonth}`;

    const matchedSales = allSales.filter((s) =>
      normalizeDigits(s.date).startsWith(prefix),
    );
    const matchedPurchases = safePurchases.filter((p) =>
      normalizeDigits(p.date).startsWith(prefix),
    );
    const matchedBankOut = manualBankExpenses.filter((b) =>
      normalizeDigits(b.date).startsWith(prefix),
    );

    const totalRevenue = matchedSales.reduce((sum, s) => sum + s.amount, 0);
    const totalPurchaseCost = matchedPurchases.reduce(
      (sum, p) => sum + p.totalAmount,
      0,
    );
    const totalOtherBankCost = matchedBankOut.reduce(
      (sum, b) => sum + b.amount,
      0,
    );

    const totalExpenses = totalPurchaseCost + totalOtherBankCost;
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalPurchaseCost,
      totalOtherBankCost,
      totalExpenses,
      netProfit,
      salesCount: matchedSales.length,
      purchasesCount: matchedPurchases.length,
    };
  }, [
    allSales,
    safePurchases,
    manualBankExpenses,
    selectedYear,
    selectedMonth,
  ]);

  // جدول تفکیکی ۱۲ ماه سال
  const monthlyBreakdown = useMemo(() => {
    return MONTHS.map((m) => {
      const prefix = `${selectedYear}/${m.code}`;

      const rev = allSales
        .filter((s) => normalizeDigits(s.date).startsWith(prefix))
        .reduce((sum, s) => sum + s.amount, 0);

      const pur = safePurchases
        .filter((p) => normalizeDigits(p.date).startsWith(prefix))
        .reduce((sum, p) => sum + p.totalAmount, 0);

      const bnk = manualBankExpenses
        .filter((b) => normalizeDigits(b.date).startsWith(prefix))
        .reduce((sum, b) => sum + b.amount, 0);

      const cost = pur + bnk;
      const profit = rev - cost;

      return {
        ...m,
        revenue: rev,
        purchasesCost: pur,
        otherCost: bnk,
        totalCost: cost,
        profit,
      };
    });
  }, [allSales, safePurchases, manualBankExpenses, selectedYear]);

  const isProfitable = periodStats.netProfit >= 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body { background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print\\:hidden { display: none !important; }
          }
        `}
      </style>

      {/* ================= هدر و فیلترها ================= */}
      <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <span>گزارش سود و زیان کارخانه</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1">
            محاسبه هوشمند تراز مالی (فروش کل منهای هزینه‌ها و خریدها)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto">
            <div className="flex items-center gap-1.5 px-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white px-3 py-2 rounded-lg text-xs font-black text-slate-900 border border-slate-200 focus:outline-none flex-1 sm:flex-none cursor-pointer"
            >
              <option value="1405">سال ۱۴۰۵</option>
              <option value="1404">سال ۱۴۰۴</option>
              <option value="1406">سال ۱۴۰۶</option>
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white px-3 py-2 rounded-lg text-xs font-black text-blue-700 border border-slate-200 focus:outline-none flex-1 sm:flex-none cursor-pointer"
            >
              <option value="ALL">کل سال</option>
              {MONTHS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold inline-flex justify-center items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش</span>
          </button>
        </div>
      </div>

      {/* ================= بنر سود یا زیان خالص ================= */}
      <div
        className={`p-5 sm:p-8 rounded-2xl sm:rounded-3xl text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 relative overflow-hidden transition-colors duration-500 ${
          isProfitable
            ? "bg-gradient-to-l from-emerald-800 via-emerald-600 to-teal-600 shadow-emerald-600/20"
            : "bg-gradient-to-l from-rose-800 via-rose-600 to-orange-600 shadow-rose-600/20"
        }`}
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 backdrop-blur-sm">
            {isProfitable ? (
              <Award className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            ) : (
              <TrendingDown className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            )}
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-white/80 block uppercase tracking-wider mb-0.5">
              نتیجه استعلام{" "}
              {selectedMonth === "ALL"
                ? `کل سال ${selectedYear}`
                : `${MONTHS.find((m) => m.code === selectedMonth)?.name} ماه ${selectedYear}`}
            </span>
            <h2 className="text-xl sm:text-3xl font-black drop-shadow-sm">
              {isProfitable ? "تراز مثبت (سود خالص)" : "تراز منفی (زیان دوره)"}
            </h2>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-5 sm:px-6 py-4 text-left w-full md:w-auto relative z-10">
          <span className="text-[10px] sm:text-xs font-bold text-white/80 block mb-1">
            مبلغ {isProfitable ? "سود خالص کارخانه" : "زیان خالص کارخانه"}:
          </span>
          <div className="flex items-end justify-start sm:justify-end gap-1.5">
            <span className="text-3xl sm:text-4xl font-black drop-shadow-md tracking-tight">
              {Math.abs(periodStats.netProfit).toLocaleString("fa-IR")}
            </span>
            <span className="text-[11px] sm:text-xs font-bold pb-1 opacity-90">
              تومان
            </span>
          </div>
        </div>
      </div>

      {/* ================= ۳ کارت تفکیک درآمد و هزینه‌ها ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              فروش (درآمد) • {periodStats.salesCount} فاکتور
            </span>
            <span className="text-base sm:text-xl font-black text-blue-700 truncate block mt-0.5">
              +{periodStats.totalRevenue.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-[11px] font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              خرید کالا • {periodStats.purchasesCount} فاکتور
            </span>
            <span className="text-base sm:text-xl font-black text-rose-600 truncate block mt-0.5">
              -{periodStats.totalPurchaseCost.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-[11px] font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              سایر خرج‌کردهای جاری
            </span>
            <span className="text-base sm:text-xl font-black text-amber-600 truncate block mt-0.5">
              -{periodStats.totalOtherBankCost.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-[11px] font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ================= جدول/لیست حسابرسی ۱۲ ماهه ================= */}
      <div className="bg-white rounded-xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 relative overflow-hidden shadow-sm">
        {/* واترمارک چرخ‌دنده */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="PN"
            className="w-48 h-48 sm:w-80 sm:h-80 object-contain opacity-[0.03] mix-blend-multiply"
          />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-2">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-blue-600" />
              جزئیات عملکرد ماه‌های سال {selectedYear}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
              جهت فیلتر کردن اطلاعات بالا روی کارت/ردیف هر ماه کلیک کنید
            </p>
          </div>
          <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            تاریخ گزارش: {getTodayJalali()}
          </div>
        </div>

        <div className="relative z-10">
          {/* ================= نسخه موبایل (کارت‌های ماهانه) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden print:hidden">
            {monthlyBreakdown.map((row) => {
              const isSelected = selectedMonth === row.code;
              const hasActivity = row.revenue > 0 || row.totalCost > 0;

              return (
                <div
                  key={row.code}
                  onClick={() =>
                    setSelectedMonth(isSelected ? "ALL" : row.code)
                  }
                  className={`border rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/50 border-blue-300 shadow-md shadow-blue-500/10 ring-1 ring-blue-400"
                      : hasActivity
                        ? "bg-white border-slate-200 hover:border-blue-300"
                        : "bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <span className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      )}
                      {row.name} {selectedYear}
                    </span>
                    {row.profit > 0 ? (
                      <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> سودده
                      </span>
                    ) : row.profit < 0 ? (
                      <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> زیان‌ده
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">
                        بدون گردش
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-[11px] font-bold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">درآمد (فروش):</span>
                      <span className="text-blue-600">
                        +{row.revenue.toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">مجموع هزینه‌ها:</span>
                      <span className="text-slate-800">
                        -{row.totalCost.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`mt-1 pt-3 border-t border-slate-100 flex justify-between items-center font-black ${
                      row.profit > 0
                        ? "text-emerald-600"
                        : row.profit < 0
                          ? "text-rose-600"
                          : "text-slate-400"
                    }`}
                  >
                    <span className="text-[11px]">تراز نهایی:</span>
                    <span className="text-sm">
                      {row.profit > 0 ? "+" : ""}
                      {row.profit.toLocaleString("fa-IR")} ت
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================= نسخه دسکتاپ و پرینت (جدول) ================= */}
          <div className="hidden md:block print:block overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/80 border-b-2 border-slate-200 text-slate-600 text-xs">
                  <th className="py-3.5 px-4 font-black">ماه</th>
                  <th className="py-3.5 px-3 font-black text-center">
                    کل فروش فاکتورها (+)
                  </th>
                  <th className="py-3.5 px-3 font-black text-center">
                    خرید کالا (-)
                  </th>
                  <th className="py-3.5 px-3 font-black text-center">
                    سایر خرج‌کردها (-)
                  </th>
                  <th className="py-3.5 px-3 font-black text-center border-l border-slate-200">
                    جمع کل هزینه‌ها
                  </th>
                  <th className="py-3.5 px-4 font-black text-left w-48">
                    تراز نهایی (سود / زیان)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {monthlyBreakdown.map((row) => {
                  const isSelected = selectedMonth === row.code;
                  const hasActivity = row.revenue > 0 || row.totalCost > 0;

                  return (
                    <tr
                      key={row.code}
                      onClick={() =>
                        setSelectedMonth(isSelected ? "ALL" : row.code)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/60 font-bold print:bg-transparent"
                          : hasActivity
                            ? "hover:bg-slate-50"
                            : "opacity-50 hover:opacity-100 print:opacity-100"
                      }`}
                    >
                      <td className="py-4 px-4 font-black text-slate-800 flex items-center gap-2">
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse print:hidden" />
                        )}
                        {row.name}
                      </td>
                      <td className="py-4 px-3 text-center font-bold text-blue-600">
                        {row.revenue > 0
                          ? row.revenue.toLocaleString("fa-IR")
                          : "-"}
                      </td>
                      <td className="py-4 px-3 text-center font-bold text-rose-500">
                        {row.purchasesCost > 0
                          ? row.purchasesCost.toLocaleString("fa-IR")
                          : "-"}
                      </td>
                      <td className="py-4 px-3 text-center font-bold text-amber-600">
                        {row.otherCost > 0
                          ? row.otherCost.toLocaleString("fa-IR")
                          : "-"}
                      </td>
                      <td className="py-4 px-3 text-center font-black text-slate-700 border-l border-slate-100">
                        {row.totalCost > 0
                          ? row.totalCost.toLocaleString("fa-IR")
                          : "-"}
                      </td>
                      <td className="py-4 px-4 text-left">
                        {row.profit > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-black text-[11px] sm:text-xs">
                            <TrendingUp className="w-3.5 h-3.5" />+{" "}
                            {row.profit.toLocaleString("fa-IR")}
                          </span>
                        ) : row.profit < 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-black text-[11px] sm:text-xs">
                            <TrendingDown className="w-3.5 h-3.5" />{" "}
                            {row.profit.toLocaleString("fa-IR")}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            ۰ (بدون گردش)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
