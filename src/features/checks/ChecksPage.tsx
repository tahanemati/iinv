import React, { useState, useMemo } from "react";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Calendar,
  Landmark,
  AlertTriangle,
  User,
  ShieldAlert,
} from "lucide-react";
import {
  useCustomerStore,
  type CheckStatus,
} from "../../store/useCustomerStore";
import { useFinanceStore } from "../../store/useFinanceStore";
import { getTodayJalali } from "../../store/useInventoryStore";

export const ChecksPage: React.FC = () => {
  const { customers, transactions, markCheckCleared, markCheckBounced } =
    useCustomerStore();
  const { addBankTransaction } = useFinanceStore();

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CheckStatus>("ALL");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // استیت‌های مودال اختصاصی تایید عملیات
  const [confirmClearModal, setConfirmClearModal] = useState<{
    isOpen: boolean;
    txId: string;
    customerName: string;
  }>({ isOpen: false, txId: "", customerName: "" });

  const [confirmBounceModal, setConfirmBounceModal] = useState<{
    isOpen: boolean;
    txId: string;
    customerName: string;
  }>({ isOpen: false, txId: "", customerName: "" });

  // استخراج تمام چک‌های ثبت‌شده همراه با نام مشتری
  const allChecks = useMemo(() => {
    return safeTransactions
      .filter((t) => t.type === "PAYMENT_CHECK")
      .map((t) => {
        const customer = safeCustomers.find((c) => c.id === t.customerId);
        return {
          ...t,
          customerName: customer?.name || "مشتری نامشخص",
          customerCity: customer?.city || "",
          customerPhone: customer?.phone || "",
          status: t.checkStatus || "PENDING",
          dueDate: t.checkDueDate || t.date,
          bank: t.checkBank || "بانک",
          number: t.checkNumber || "-",
        };
      });
  }, [safeTransactions, safeCustomers]);

  const filteredChecks = useMemo(() => {
    return allChecks.filter((chk) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        chk.customerName.toLowerCase().includes(q) ||
        chk.number.toLowerCase().includes(q) ||
        chk.bank.toLowerCase().includes(q) ||
        chk.dueDate.includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== "ALL" && chk.status !== statusFilter) return false;
      return true;
    });
  }, [allChecks, searchTerm, statusFilter]);

  // آمار چک‌ها
  const stats = useMemo(() => {
    const pending = allChecks.filter((c) => c.status === "PENDING");
    const cleared = allChecks.filter((c) => c.status === "CLEARED");
    const bounced = allChecks.filter((c) => c.status === "BOUNCED");

    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, c) => sum + c.amount, 0),
      clearedCount: cleared.length,
      clearedAmount: cleared.reduce((sum, c) => sum + c.amount, 0),
      bouncedCount: bounced.length,
      bouncedAmount: bounced.reduce((sum, c) => sum + c.amount, 0),
    };
  }, [allChecks]);

  // عملیات نهایی پاس شدن چک
  const executeClearCheck = () => {
    const { txId, customerName } = confirmClearModal;
    const clearedTx = markCheckCleared(txId);
    if (clearedTx) {
      addBankTransaction({
        type: "IN",
        amount: clearedTx.amount,
        date: getTodayJalali(),
        title: `وصول چک صیادی شماره ${clearedTx.checkNumber || "-"} از ${customerName}`,
        category: "واریزی مشتریان",
      });

      setActionMessage(
        `چک شماره ${clearedTx.checkNumber || "-"} با موفقیت پاس شد و مبلغ ${clearedTx.amount.toLocaleString(
          "fa-IR",
        )} تومان به حساب بانکی اضافه گردید.`,
      );
    }
    setConfirmClearModal({ isOpen: false, txId: "", customerName: "" });
  };

  // عملیات نهایی برگشت خوردن چک
  const executeBounceCheck = () => {
    const { txId, customerName } = confirmBounceModal;
    const bouncedTx = markCheckBounced(txId);
    if (bouncedTx) {
      setActionMessage(
        `چک شماره ${bouncedTx.checkNumber || "-"} به وضعیت «برگشتی» تغییر یافت و مبلغ ${bouncedTx.amount.toLocaleString(
          "fa-IR",
        )} تومان به بدهی ${customerName} بازگردانده شد.`,
      );
    }
    setConfirmBounceModal({ isOpen: false, txId: "", customerName: "" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* هدر */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <span>دفترچه چک‌های صیادی و هشدار سررسید</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1">
            پیگیری سررسید چک‌های دریافتی، وصول خودکار به کارت کارخانه و مدیریت
            چک‌های برگشتی
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-page-enter shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-[11px] sm:text-xs text-emerald-700 underline cursor-pointer shrink-0 text-left"
          >
            متوجه شدم
          </button>
        </div>
      )}

      {/* ۳ کارت آماری وضعیت چک‌ها (موبایل و دسکتاپ) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              در دست (سررسید نشده: {stats.pendingCount})
            </span>
            <span className="text-base sm:text-xl font-black text-amber-600 truncate block">
              {stats.pendingAmount.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              وصول شده به بانک ({stats.clearedCount})
            </span>
            <span className="text-base sm:text-xl font-black text-emerald-600 truncate block">
              {stats.clearedAmount.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              برگشت خورده ({stats.bouncedCount})
            </span>
            <span className="text-base sm:text-xl font-black text-rose-600 truncate block">
              {stats.bouncedAmount.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* فیلتر و لیست چک‌ها */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar shrink-0">
            {[
              { key: "ALL", label: "همه چک‌ها" },
              { key: "PENDING", label: "در انتظار سررسید" },
              { key: "CLEARED", label: "پاس‌شده" },
              { key: "BOUNCED", label: "برگشتی" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key as any)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === item.key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative w-full">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی شماره چک، نام مشتری، بانک یا تاریخ..."
              className="w-full pr-10 pl-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>

        {/* ================= نمایش لیست (موبایل: کارت / دسکتاپ: جدول) ================= */}

        {/* نسخه موبایل (کارت‌ها) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredChecks.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs font-bold">
              هیچ چکی با این مشخصات یافت نشد.
            </div>
          ) : (
            filteredChecks.map((chk) => (
              <div
                key={chk.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 w-1.5 h-full ${chk.status === "PENDING" ? "bg-amber-400" : chk.status === "CLEARED" ? "bg-emerald-500" : "bg-rose-500"}`}
                ></div>

                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3 pr-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1">
                      <Landmark className="w-3 h-3 text-blue-600" /> {chk.bank}{" "}
                      •{" "}
                      <span className="font-mono text-slate-800">
                        {chk.number}
                      </span>
                    </span>
                    <h3 className="font-black text-slate-800 text-sm line-clamp-1">
                      {chk.customerName}
                    </h3>
                    <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] sm:text-[11px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> تاریخ
                        دریافت: {chk.date}
                      </span>
                      <span className="flex items-center gap-1 text-blue-700 bg-blue-50 w-fit px-1.5 py-0.5 rounded-md mt-1 border border-blue-100">
                        سررسید: {chk.dueDate}
                      </span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-black text-slate-900 text-sm block">
                      {chk.amount.toLocaleString("fa-IR")}{" "}
                      <span className="text-[9px] text-slate-400 font-normal">
                        تومان
                      </span>
                    </span>

                    <div className="mt-2 text-left">
                      {chk.status === "PENDING" ? (
                        <span className="inline-flex items-center justify-center gap-1 w-full px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                          <Clock className="w-3 h-3" /> در انتظار
                        </span>
                      ) : chk.status === "CLEARED" ? (
                        <span className="inline-flex items-center justify-center gap-1 w-full px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> پاس شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 w-full px-2 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-bold">
                          <XCircle className="w-3 h-3" /> برگشتی
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {chk.status === "PENDING" && (
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    <button
                      onClick={() =>
                        setConfirmClearModal({
                          isOpen: true,
                          txId: chk.id,
                          customerName: chk.customerName,
                        })
                      }
                      className="flex justify-center items-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-[11px] font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> وصول شد
                    </button>
                    <button
                      onClick={() =>
                        setConfirmBounceModal({
                          isOpen: true,
                          txId: chk.id,
                          customerName: chk.customerName,
                        })
                      }
                      className="flex justify-center items-center gap-1.5 py-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors text-[11px] font-bold cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> برگشت خورد
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* نسخه دسکتاپ (جدول) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs">
                <th className="py-3.5 px-3 font-bold">شماره چک و بانک</th>
                <th className="py-3.5 px-3 font-bold">صاحب چک (مشتری)</th>
                <th className="py-3.5 px-3 font-bold text-center">
                  تاریخ دریافت
                </th>
                <th className="py-3.5 px-3 font-bold text-center">
                  تاریخ سررسید
                </th>
                <th className="py-3.5 px-3 font-bold text-center">
                  مبلغ چک (تومان)
                </th>
                <th className="py-3.5 px-3 font-bold text-center">
                  وضعیت فعلی
                </th>
                <th className="py-3.5 px-3 font-bold text-left">تعیین وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    هیچ چکی با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredChecks.map((chk) => (
                  <tr
                    key={chk.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-3">
                      <span className="font-mono font-black text-slate-900 block">
                        {chk.number}
                      </span>
                      <span className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                        <Landmark className="w-3 h-3 text-blue-600" />{" "}
                        {chk.bank}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-black text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />{" "}
                        {chk.customerName}
                      </span>
                      <span
                        className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[150px]"
                        title={`${chk.customerCity} - ${chk.customerPhone}`}
                      >
                        {chk.customerCity} {chk.customerPhone}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center text-xs text-slate-500 font-medium">
                      {chk.date}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-xs border border-blue-200">
                        <Calendar className="w-3.5 h-3.5" /> {chk.dueDate}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center font-black text-slate-900 text-base">
                      {chk.amount.toLocaleString("fa-IR")}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {chk.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                          <Clock className="w-3.5 h-3.5" /> در جریان
                        </span>
                      ) : chk.status === "CLEARED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> پاس شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold">
                          <XCircle className="w-3.5 h-3.5" /> برگشتی
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-left">
                      {chk.status === "PENDING" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setConfirmClearModal({
                                isOpen: true,
                                txId: chk.id,
                                customerName: chk.customerName,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> وصول شد
                          </button>
                          <button
                            onClick={() =>
                              setConfirmBounceModal({
                                isOpen: true,
                                txId: chk.id,
                                customerName: chk.customerName,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> برگشتی
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          تعیین وضعیت شده
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= مودال اختصاصی تایید وصول چک ================= */}
      {confirmClearModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 sm:p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
                  تایید وصول چک
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed px-2">
                  آیا چک <br />
                  <span className="font-bold text-slate-900 text-base">
                    «{confirmClearModal.customerName}»
                  </span>
                  <br /> پاس شده است؟
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                  <Landmark className="w-3.5 h-3.5" />
                  مبلغ به حساب بانکی اضافه خواهد شد
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-7 pt-5 border-t border-slate-100">
              <button
                onClick={() =>
                  setConfirmClearModal({
                    isOpen: false,
                    txId: "",
                    customerName: "",
                  })
                }
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={executeClearCheck}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
              >
                بله، وصول شد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال اختصاصی تایید برگشت چک ================= */}
      {confirmBounceModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 sm:p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center border-4 border-rose-100">
                <ShieldAlert className="w-7 h-7 text-rose-500" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
                  چک برگشتی
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed px-2">
                  آیا چک <br />
                  <span className="font-bold text-slate-900 text-base">
                    «{confirmBounceModal.customerName}»
                  </span>
                  <br /> برگشت خورده است؟
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-[11px] font-bold text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  مبلغ مجدداً به بدهی مشتری اضافه می‌شود
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-7 pt-5 border-t border-slate-100">
              <button
                onClick={() =>
                  setConfirmBounceModal({
                    isOpen: false,
                    txId: "",
                    customerName: "",
                  })
                }
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={executeBounceCheck}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
              >
                بله، برگشت بزن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
