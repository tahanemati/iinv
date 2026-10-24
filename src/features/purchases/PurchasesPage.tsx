import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Trash2,
  CalendarDays,
  CreditCard,
  PackagePlus,
  FileText,
  X,
  Filter,
  AlertTriangle,
} from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import {
  useFinanceStore,
  type PurchaseRecord,
} from "../../store/useFinanceStore";
import {
  useInventoryStore,
  getTodayJalali,
} from "../../store/useInventoryStore";

export const PurchasesPage: React.FC = () => {
  const { purchases, bankAccount, addPurchase, deletePurchase } =
    useFinanceStore();
  const { products, adjustStock } = useInventoryStore();

  const safePurchases = Array.isArray(purchases) ? purchases : [];

  // فیلتر و سرچ برای حسابرسی
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // مودال ثبت فاکتور خرید جدید
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<PurchaseRecord["category"]>("مواد اولیه");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [date, setDate] = useState(getTodayJalali());
  const [paidFromBank, setPaidFromBank] = useState(true);

  // موجودی انبار
  const [addToInventory, setAddToInventory] = useState(false);
  const [targetProductId, setTargetProductId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // مودال تایید حذف اختصاصی
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    purchase: PurchaseRecord | null;
  }>({ isOpen: false, purchase: null });

  const calculatedTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const filteredPurchases = useMemo(() => {
    return safePurchases.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (p.title || "").toLowerCase().includes(q) ||
        (p.supplierName || "").toLowerCase().includes(q) ||
        (p.invoiceNo || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (selectedCategory !== "ALL" && p.category !== selectedCategory)
        return false;
      if (dateFilter.trim() && !(p.date || "").includes(dateFilter.trim()))
        return false;

      return true;
    });
  }, [safePurchases, searchTerm, selectedCategory, dateFilter]);

  const totalFilteredExpense = useMemo(
    () => filteredPurchases.reduce((sum, item) => sum + item.totalAmount, 0),
    [filteredPurchases],
  );

  const handleOpenModal = () => {
    setInvoiceNo("");
    setSupplierName("");
    setTitle("");
    setCategory("مواد اولیه");
    setQuantity("1");
    setUnitPrice("");
    setDate(getTodayJalali());
    setPaidFromBank(true);
    setAddToInventory(false);
    setTargetProductId(products[0]?.id || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !unitPrice || calculatedTotal <= 0) {
      setFormError("لطفاً شرح خرید و مبلغ واحد را به درستی وارد نمایید.");
      return;
    }

    addPurchase({
      invoiceNo: invoiceNo.trim() || "-",
      supplierName: supplierName.trim() || "خرید متفرقه",
      title: title.trim(),
      category,
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice),
      totalAmount: calculatedTotal,
      date: date || getTodayJalali(),
      paidFromBank,
    });

    if (addToInventory && targetProductId) {
      adjustStock(
        targetProductId,
        "IN",
        Number(quantity) || 1,
        date,
        `ورود از طریق فاکتور خرید ${invoiceNo || "-"} (${supplierName})`,
      );
    }

    setIsModalOpen(false);
  };

  const confirmDeletePurchase = () => {
    if (deleteModal.purchase) {
      deletePurchase(deleteModal.purchase.id);
      setDeleteModal({ isOpen: false, purchase: null });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      {/* هدر صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <span>خرید و خرج‌کرد کارخانه</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1">
            ثبت خرید مواد اولیه، هزینه‌های جاری و خرید قطعات جهت حسابرسی
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت فاکتور / خرج‌کرد جدید</span>
        </button>
      </div>

      {/* ۳ کارت خلاصه وضعیت */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              جمع هزینه‌ها (فیلتر فعلی)
            </span>
            <span className="text-base sm:text-xl font-black text-rose-600 truncate block">
              {totalFilteredExpense.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              تعداد فاکتورهای ثبت‌شده
            </span>
            <span className="text-base sm:text-xl font-black text-slate-900 truncate block">
              {filteredPurchases.length.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                فاکتور
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              موجودی فعلی کارت کارخانه
            </span>
            <span className="text-base sm:text-xl font-black text-emerald-600 truncate block">
              {bankAccount?.balance?.toLocaleString("fa-IR") || 0}{" "}
              <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* بخش فیلترها و لیست */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام کالا، فروشنده یا شماره فاکتور..."
              className="w-full pr-10 pl-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="md:col-span-3 relative">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="فیلتر ماه/سال (مثال: ۱۴۰۵/۰۷)"
              className="w-full pr-10 pl-3 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="md:col-span-4 relative">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">همه دسته‌بندی‌ها</option>
              <option value="مواد اولیه">مواد اولیه (کائوچو...)</option>
              <option value="خرید قطعه آماده">خرید قطعه آماده</option>
              <option value="هزینه جاری و تعمیرات">هزینه جاری و تعمیرات</option>
              <option value="سایر هزینه‌ها">سایر هزینه‌ها</option>
            </select>
          </div>
        </div>

        {/* ================= نمایش لیست (موبایل: کارت / دسکتاپ: جدول) ================= */}

        {/* نسخه موبایل (کارت‌ها) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredPurchases.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs font-bold">
              خرید یا خرج‌کردی یافت نشد.
            </div>
          ) : (
            filteredPurchases.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative"
              >
                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3 text-blue-600" />{" "}
                      {item.invoiceNo} • {item.date}
                    </span>
                    <h3 className="font-black text-slate-800 text-sm line-clamp-2 leading-tight">
                      {item.title}
                    </h3>
                    <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] sm:text-[11px] text-slate-500 font-bold">
                      <span>فروشنده: {item.supplierName}</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0 pl-1">
                    <span className="font-black text-rose-600 text-[13px] block">
                      {item.totalAmount.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[9px] text-slate-400">تومان</span>
                    <span className="block mt-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold text-center w-max ml-auto">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[10px] sm:text-[11px] font-bold">
                    {item.paidFromBank ? (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                        <CreditCard className="w-3 h-3" /> پرداخت از بانک
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        نقدی (خارج کارت)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setDeleteModal({ isOpen: true, purchase: item })
                    }
                    className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* نسخه دسکتاپ (جدول) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs">
                <th className="py-3.5 px-3 font-bold">شماره فاکتور</th>
                <th className="py-3.5 px-3 font-bold">تاریخ</th>
                <th className="py-3.5 px-3 font-bold">شرح محصول / خرج‌کرد</th>
                <th className="py-3.5 px-3 font-bold">فروشنده</th>
                <th className="py-3.5 px-3 font-bold text-center">دسته‌بندی</th>
                <th className="py-3.5 px-3 font-bold text-center">
                  تعداد × فی
                </th>
                <th className="py-3.5 px-3 font-bold text-center">
                  مبلغ کل (تومان)
                </th>
                <th className="py-3.5 px-3 font-bold text-center">
                  وضعیت پرداخت
                </th>
                <th className="py-3.5 px-3 font-bold text-left">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    هیچ فاکتوری یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-3 font-mono text-xs font-bold text-slate-500">
                      {item.invoiceNo}
                    </td>
                    <td className="py-4 px-3 text-xs font-bold text-slate-600">
                      {item.date}
                    </td>
                    <td
                      className="py-4 px-3 font-black text-slate-900 max-w-[200px] truncate"
                      title={item.title}
                    >
                      {item.title}
                    </td>
                    <td className="py-4 px-3 text-xs font-bold text-slate-600 truncate max-w-[120px]">
                      {item.supplierName}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center text-xs text-slate-500 font-bold">
                      {item.quantity.toLocaleString("fa-IR")} ×{" "}
                      {item.unitPrice.toLocaleString("fa-IR")}
                    </td>
                    <td className="py-4 px-3 text-center font-black text-rose-600 text-base">
                      {item.totalAmount.toLocaleString("fa-IR")}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {item.paidFromBank ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <CreditCard className="w-3.5 h-3.5" /> از کارت کارخانه
                        </span>
                      ) : (
                        <span className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          نقدی / خارج حساب
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-left">
                      <button
                        onClick={() =>
                          setDeleteModal({ isOpen: true, purchase: item })
                        }
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= مودال تایید حذف اختصاصی ================= */}
      {deleteModal.isOpen && deleteModal.purchase && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 sm:p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center border-4 border-rose-100">
                <Trash2 className="w-7 h-7 text-rose-500" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
                  حذف فاکتور خرید
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed px-2">
                  آیا از حذف <br />
                  <span className="font-bold text-slate-900 text-base">
                    «{deleteModal.purchase.title}»
                  </span>
                  <br /> اطمینان دارید؟
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-[11px] font-bold text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-3.5 h-3.5" /> غیرقابل بازگشت!
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-7 pt-5 border-t border-slate-100">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, purchase: null })
                }
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={confirmDeletePurchase}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
              >
                بله، حذف کن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال ثبت فاکتور خرید ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-5 sm:p-8 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" /> ثبت فاکتور
                جدید
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] sm:text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    شماره فاکتور
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="مثلاً: ۸۸۴۵"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    تاریخ خرید
                  </label>
                  <div className="relative z-40">
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={date}
                      onChange={(d: any) =>
                        setDate(d?.format?.("YYYY/MM/DD") || getTodayJalali())
                      }
                      containerClassName="w-full"
                      inputClass="w-full px-3.5 py-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                    />
                    <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    نام فروشنده
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="مثلاً: بازرگانی..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    دسته‌بندی
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="مواد اولیه">مواد اولیه</option>
                    <option value="خرید قطعه آماده">خرید قطعه آماده</option>
                    <option value="هزینه جاری و تعمیرات">
                      هزینه جاری و تعمیرات
                    </option>
                    <option value="سایر هزینه‌ها">سایر هزینه‌ها</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  شرح کامل *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: خرید کائوچو..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    مقدار / تعداد
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    قیمت واحد (تومان) *
                  </label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="95000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-600">
                  مبلغ کل فاکتور:
                </span>
                <span className="text-sm sm:text-base font-black text-rose-600">
                  {calculatedTotal.toLocaleString("fa-IR")} تومان
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 mt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paidFromBank}
                    onChange={(e) => setPaidFromBank(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" /> کسر خودکار
                    از موجودی کارت کارخانه
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addToInventory}
                    onChange={(e) => setAddToInventory(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <PackagePlus className="w-4 h-4 text-emerald-600" /> افزودن
                    به موجودی قطعات انبار
                  </span>
                </label>

                {addToInventory && (
                  <div className="pt-2">
                    <select
                      value={targetProductId}
                      onChange={(e) => setTargetProductId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (موجودی فعلی: {p.quantity} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] sm:text-xs font-bold cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-colors"
                >
                  ثبت فاکتور خرید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
