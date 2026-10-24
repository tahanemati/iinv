import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  Wallet,
  FileSpreadsheet,
  Printer,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Banknote,
  CreditCard,
  CalendarDays,
  ArrowRightLeft,
  ReceiptText,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

// ایمپورت ایمن تقویم شمسی
import MultiDatePicker from "react-multi-date-picker";
import persianCal from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";
const DatePicker = (MultiDatePicker as any).default || MultiDatePicker;
const persian = (persianCal as any).default || persianCal;
const persian_fa = (persianFa as any).default || persianFa;

import { useCustomerStore, type Customer } from "../../store/useCustomerStore";
import { getTodayJalali } from "../../store/useInventoryStore";

const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];
const TENS = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
];
const HUNDREDS = [
  "",
  "یکصد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];
const SCALES = ["", "هزار", "میلیون", "میلیارد", "هزار میلیارد"];

function toCleanNumber(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : Math.floor(val);
  if (!val) return 0;
  const eng = String(val)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^0-9]/g, "");
  return Number(eng) || 0;
}

function amountToPersianLetters(val: unknown): string {
  let num = toCleanNumber(val);
  if (num <= 0) return "";
  const threeDigitsToWords = (n: number): string => {
    if (n === 0) return "";
    const res: string[] = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) res.push(HUNDREDS[h]);
    if (rem >= 10 && rem <= 19) res.push(TEENS[rem - 10]);
    else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (t > 0) res.push(TENS[t]);
      if (o > 0) res.push(ONES[o]);
    }
    return res.join(" و ");
  };
  const parts: string[] = [];
  let scaleIdx = 0;
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const words = threeDigitsToWords(chunk);
      const scale = SCALES[scaleIdx];
      parts.unshift(scale ? `${words} ${scale}` : words);
    }
    num = Math.floor(num / 1000);
    scaleIdx++;
  }
  return `${parts.join(" و ")} تومان`;
}

export const CustomersPage: React.FC = () => {
  const {
    customers,
    transactions,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    registerPayment,
    addInvoiceDebt,
  } = useCustomerStore();

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "DEBTORS" | "SETTLED">(
    "ALL",
  );

  // مودال مشتری
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formInitialBalance, setFormInitialBalance] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // مودال دریافت وجه
  const [paymentModalCustomer, setPaymentModalCustomer] =
    useState<Customer | null>(null);
  const [payDate, setPayDate] = useState(getTodayJalali());
  const [cashAmount, setCashAmount] = useState("");
  const [checkAmount, setCheckAmount] = useState("");
  const [payCheckNo, setPayCheckNo] = useState("");
  const [payCheckBank, setPayCheckBank] = useState("");
  const [payCheckDueDate, setPayCheckDueDate] = useState(getTodayJalali());
  const [payDesc, setPayDesc] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // نگهداری فایل عکس انتخاب شده
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const totalReceivingAmount =
    (Number(cashAmount) || 0) + (Number(checkAmount) || 0);

  // مودال انتقال وجه
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(getTodayJalali());
  const [transferDesc, setTransferDesc] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // مودال نمایش و چاپ
  const [receiptTx, setReceiptTx] = useState<{
    customer: Customer;
    tx: any;
  } | null>(null);
  const [imageViewModal, setImageViewModal] = useState<string | null>(null);
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);
  const [printSize, setPrintSize] = useState<"A4" | "A5">("A4");

  const filteredCustomers = useMemo(() => {
    return safeCustomers.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (c.name || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q);

      if (!matchesSearch) return false;
      if (filterMode === "DEBTORS") return c.balance > 0;
      if (filterMode === "SETTLED") return c.balance <= 0;
      return true;
    });
  }, [safeCustomers, searchTerm, filterMode]);

  const stats = useMemo(() => {
    const totalCustomers = safeCustomers.length;
    const debtorsCount = safeCustomers.filter((c) => c.balance > 0).length;
    const totalReceivable = safeCustomers.reduce(
      (sum, c) => (c.balance > 0 ? sum + c.balance : sum),
      0,
    );
    return { totalCustomers, debtorsCount, totalReceivable };
  }, [safeCustomers]);

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormPhone("");
    setFormCity("");
    setFormAddress("");
    setFormInitialBalance("");
    setFormError(null);
    setIsCustomerModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone || "");
    setFormCity(customer.city || "");
    setFormAddress(customer.address || "");
    setFormInitialBalance("");
    setFormError(null);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim())
      return setFormError("لطفاً نام مشتری یا فروشگاه را وارد نمایید.");

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
      });
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
        initialBalance: Number(formInitialBalance) || 0,
      });
    }
    setIsCustomerModalOpen(false);
  };

  const openPaymentModal = (customer: Customer) => {
    setPaymentModalCustomer(customer);
    setPayDate(getTodayJalali());
    setCashAmount("");
    setCheckAmount("");
    setPayCheckNo("");
    setPayCheckBank("");
    setPayCheckDueDate(getTodayJalali());
    setPayDesc("");
    setReceiptFile(null);
    setPayError(null);
  };

  // ارسال عکس به Node.js و دریافت URL
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCustomer) return;

    const numCash = Number(cashAmount) || 0;
    const numCheck = Number(checkAmount) || 0;

    if (numCash <= 0 && numCheck <= 0)
      return setPayError("لطفاً مبلغ نقدی یا مبلغ چک را وارد کنید.");
    if (numCheck > 0 && !payCheckNo.trim())
      return setPayError("وارد کردن شماره چک صیادی الزامی است.");

    setIsUploading(true);
    let uploadedImageUrl = "";

    // اگر کاربر فایلی انتخاب کرده بود، اول آپلودش کن
    if (receiptFile) {
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      try {
        const res = await fetch("http://localhost:4000/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          uploadedImageUrl = data.url;
        } else {
          setPayError("خطا در آپلود تصویر در سرور.");
          setIsUploading(false);
          return;
        }
      } catch (err) {
        setPayError("خطای ارتباط با سرور آپلود (Node.js خاموش است).");
        setIsUploading(false);
        return;
      }
    }

    let successCount = 0;

    // ثبت رسید با لینک عکس آپلود شده
    if (numCash > 0) {
      const resCash = registerPayment({
        customerId: paymentModalCustomer.id,
        type: "PAYMENT_CASH",
        amount: numCash,
        date: payDate,
        description: payDesc ? `نقد: ${payDesc}` : "دریافت نقدی / حواله",
        receiptUrl: uploadedImageUrl, // ذخیره لینک در استور
      } as any);
      if (resCash.success) successCount++;
      else setPayError(resCash.message || "خطا در ثبت نقدی");
    }

    if (numCheck > 0) {
      const resCheck = registerPayment({
        customerId: paymentModalCustomer.id,
        type: "PAYMENT_CHECK",
        amount: numCheck,
        date: payDate,
        checkNumber: payCheckNo,
        checkBank: payCheckBank,
        checkDueDate: payCheckDueDate,
        description: payDesc ? `چک: ${payDesc}` : "دریافت چک صیادی",
        receiptUrl: uploadedImageUrl, // ذخیره لینک در استور
      } as any);
      if (resCheck.success) successCount++;
      else setPayError(resCheck.message || "خطا در ثبت چک");
    }

    setIsUploading(false);

    if (successCount > 0 && !payError) {
      setPaymentModalCustomer(null);
      setSuccessMsg("دریافت وجه و رسید با موفقیت ثبت شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const openTransferModal = () => {
    setTransferFrom("");
    setTransferTo("");
    setTransferAmount("");
    setTransferDate(getTodayJalali());
    setTransferDesc("");
    setTransferError(null);
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    if (!transferFrom || !transferTo || transferFrom === transferTo)
      return setTransferError("مبداء و مقصد نامعتبر است.");
    const amt = Number(transferAmount);
    if (amt <= 0)
      return setTransferError("مبلغ انتقال باید بیشتر از صفر باشد.");

    const fromC = safeCustomers.find((c) => c.id === transferFrom);
    const toC = safeCustomers.find((c) => c.id === transferTo);
    if (!fromC || !toC) return setTransferError("مشتری یافت نشد.");

    registerPayment({
      customerId: transferFrom,
      type: "PAYMENT_CASH",
      amount: amt,
      date: transferDate,
      description: `حواله تهاتر به حساب «${toC.name}» ${transferDesc ? "- " + transferDesc : ""}`,
    });

    if (addInvoiceDebt) {
      addInvoiceDebt(
        transferTo,
        amt,
        "تهاتر",
        transferDate,
        `انتقال وجه از حساب «${fromC.name}» ${transferDesc ? "- " + transferDesc : ""}`,
      );
    } else {
      setTransferError("سیستم قادر به افزایش بدهی مقصد نیست.");
      return;
    }

    setIsTransferModalOpen(false);
    setSuccessMsg(
      `مبلغ ${amt.toLocaleString("fa-IR")} تومان با موفقیت جابجا شد.`,
    );
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const customerLedgerTx = useMemo(() => {
    if (!ledgerCustomer) return [];
    return safeTransactions.filter((t) => t.customerId === ledgerCustomer.id);
  }, [safeTransactions, ledgerCustomer]);

  const currentLedgerCustomer = useMemo(() => {
    if (!ledgerCustomer) return null;
    return (
      safeCustomers.find((c) => c.id === ledgerCustomer.id) || ledgerCustomer
    );
  }, [safeCustomers, ledgerCustomer]);

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      <style>
        {`
          @media print {
            @page { size: ${printSize === "A4" ? "A4" : "A5"} portrait; margin: 0 !important; }
            body { background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; }
            ::-webkit-scrollbar { display: none; }
            body * { visibility: hidden; }
            #print-section, #print-section * { visibility: visible; }
            #print-section {
              position: fixed !important; left: 0 !important; top: 0 !important;
              width: ${printSize === "A4" ? "210mm" : "148mm"} !important;
              height: ${printSize === "A4" ? "297mm" : "210mm"} !important;
              margin: 0 !important; padding: 6mm !important; box-shadow: none !important; border: none !important;
              z-index: 999999 !important; background: white !important;
            }
          }
        `}
      </style>

      {/* ================= هدر اصلی ================= */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <span>مشتریان و مانده حساب اشخاص</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1">
            مدیریت مشتریان، ثبت دریافت وجه، آپلود فیش، چاپ رسید و تهاتر حساب‌ها
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={openTransferModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-bold border border-amber-200 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />{" "}
            <span>انتقال وجه (تهاتر)</span>
          </button>
          <button
            onClick={openNewCustomerModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> <span>تعریف مشتری جدید</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="print:hidden p-4 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-page-enter shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-[11px] sm:text-xs text-emerald-700 underline cursor-pointer shrink-0 text-left"
          >
            متوجه شدم
          </button>
        </div>
      )}

      {/* ================= ۴ کارت آمار زنده ================= */}
      <div className="print:hidden grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              کل مشتریان
            </span>
            <span className="text-base sm:text-xl font-black text-slate-900 block truncate">
              {stats.totalCustomers.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-normal text-slate-500">
                نفر
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              مشتریان بدهکار
            </span>
            <span className="text-base sm:text-xl font-black text-amber-600 block truncate">
              {stats.debtorsCount.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-normal text-amber-600/70">
                نفر
              </span>
            </span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              کل طلب کارخانه از بازار
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-600 block truncate">
              {stats.totalReceivable.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                تومان
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ================= فیلترها و نمایش لیست ================= */}
      <div className="print:hidden bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar w-full lg:w-fit shrink-0">
            {[
              { key: "ALL", label: "همه مشتریان" },
              { key: "DEBTORS", label: "بدهکاران" },
              { key: "SETTLED", label: "تسویه‌شده" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilterMode(item.key as any)}
                className={`flex-1 lg:flex-none px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${filterMode === item.key ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
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
              placeholder="جستجوی نام مشتری، شهر یا تلفن..."
              className="w-full pr-10 pl-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>

        {/* ----------------- نسخه موبایل (کارت‌ها) ----------------- */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredCustomers.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs font-bold">
              هیچ مشتری یافت نشد.
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isDebtor = customer.balance > 0;
              const isCreditor = customer.balance < 0;
              return (
                <div
                  key={customer.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-slate-800 text-sm line-clamp-1">
                        {customer.name}
                      </h3>
                      <div className="flex flex-col gap-1 mt-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-500" />{" "}
                          {customer.city || "بدون شهر"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />{" "}
                          {customer.phone || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      {isDebtor ? (
                        <div className="text-rose-600 text-center bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100">
                          <span className="font-black text-[13px] block">
                            {customer.balance.toLocaleString("fa-IR")}
                          </span>
                          <span className="text-[9px] font-bold">بدهکار</span>
                        </div>
                      ) : isCreditor ? (
                        <div className="text-emerald-600 text-center bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100">
                          <span className="font-black text-[13px] block">
                            {Math.abs(customer.balance).toLocaleString("fa-IR")}
                          </span>
                          <span className="text-[9px] font-bold">بستانکار</span>
                        </div>
                      ) : (
                        <div className="text-emerald-700 text-center bg-emerald-50 px-2 py-2 rounded-lg border border-emerald-100 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">
                            تسویه (۰)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => openPaymentModal(customer)}
                      className="col-span-2 flex justify-center items-center py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors text-[11px] font-bold gap-1 border border-emerald-200/50 cursor-pointer"
                    >
                      <Banknote className="w-4 h-4" /> دریافت وجه
                    </button>
                    <button
                      onClick={() => setLedgerCustomer(customer)}
                      className="col-span-2 flex justify-center items-center py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-[11px] font-bold gap-1 border border-blue-200/50 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> ریزحساب
                    </button>
                    <button
                      onClick={() => openEditCustomerModal(customer)}
                      className="col-span-2 flex justify-center items-center py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors text-[11px] font-bold gap-1 border border-slate-200 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> ویرایش
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`حذف مشتری «${customer.name}»؟`))
                          deleteCustomer(customer.id);
                      }}
                      className="col-span-2 flex justify-center items-center py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors text-[11px] font-bold gap-1 border border-rose-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ----------------- نسخه دسکتاپ (جدول) ----------------- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs">
                <th className="py-3.5 px-3 font-bold">نام مشتری / فروشگاه</th>
                <th className="py-3.5 px-3 font-bold">شهر و آدرس</th>
                <th className="py-3.5 px-3 font-bold text-center">
                  شماره تماس
                </th>
                <th className="py-3.5 px-3 font-bold text-center">
                  مانده حساب فعلی
                </th>
                <th className="py-3.5 px-3 font-bold text-center">
                  دریافت / ریزحساب
                </th>
                <th className="py-3.5 px-3 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    هیچ مشتری با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const isDebtor = customer.balance > 0;
                  const isCreditor = customer.balance < 0;
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-3 font-black text-slate-900">
                        {customer.name}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{customer.city || "بدون شهر"}</span>
                        </div>
                        {customer.address && (
                          <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[200px] xl:max-w-xs">
                            {customer.address}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />{" "}
                          {customer.phone || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        {isDebtor ? (
                          <div>
                            <span className="font-black text-rose-600 text-sm xl:text-base">
                              {customer.balance.toLocaleString("fa-IR")}
                            </span>{" "}
                            <span className="text-[10px] text-slate-400">
                              تومان
                            </span>
                            <span className="block text-[10px] font-bold text-rose-500 bg-rose-50 mx-auto w-fit px-2 py-0.5 rounded mt-0.5">
                              بدهکار
                            </span>
                          </div>
                        ) : isCreditor ? (
                          <div>
                            <span className="font-black text-emerald-600 text-sm xl:text-base">
                              {Math.abs(customer.balance).toLocaleString(
                                "fa-IR",
                              )}
                            </span>{" "}
                            <span className="text-[10px] text-slate-400">
                              تومان
                            </span>
                            <span className="block text-[10px] font-bold text-emerald-600 bg-emerald-50 mx-auto w-fit px-2 py-0.5 rounded mt-0.5">
                              بستانکار
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> تسویه (۰)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openPaymentModal(customer)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Banknote className="w-4 h-4" />{" "}
                            <span>دریافت وجه</span>
                          </button>
                          <button
                            onClick={() => setLedgerCustomer(customer)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4" />{" "}
                            <span>ریزحساب</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-left">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditCustomerModal(customer)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`حذف «${customer.name}»؟`))
                                deleteCustomer(customer.id);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= مودال ۱: تعریف / ویرایش مشتری ================= */}
      {isCustomerModalOpen && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-5 sm:p-8 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />{" "}
                {editingCustomer ? "ویرایش مشتری" : "مشتری جدید"}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">
                {formError}
              </div>
            )}
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  نام مشتری / فروشگاه *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    شماره تماس
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    شهر
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  آدرس دقیق
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white outline-none focus:border-blue-600"
                />
              </div>
              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    مانده بدهی قبلی (تومان - اختیاری)
                  </label>
                  <input
                    type="number"
                    value={formInitialBalance}
                    onChange={(e) => setFormInitialBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-blue-600"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2.5 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingCustomer ? "ذخیره تغییرات" : "ثبت مشتری"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= مودال دریافت وجه (با قابلیت آپلود فایل) ================= */}
      {paymentModalCustomer && (
        <div className="print:hidden fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md p-5 sm:p-7 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" /> ثبت دریافتی و
                آپلود فیش
              </h3>
              <button
                onClick={() => setPaymentModalCustomer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-800 line-clamp-1">
                  {paymentModalCustomer.name}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                  {paymentModalCustomer.city || "-"}
                </p>
              </div>
              <div className="text-left shrink-0 pl-1">
                <span className="text-[9px] sm:text-[10px] text-slate-400 block mb-0.5">
                  مانده بدهی:
                </span>
                <span className="text-xs sm:text-sm font-black text-rose-600">
                  {paymentModalCustomer.balance.toLocaleString("fa-IR")} ت
                </span>
              </div>
            </div>

            {payError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-[11px] sm:text-xs font-bold">
                {payError}
              </div>
            )}

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="relative z-40 pb-2 border-b border-slate-100">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  تاریخ ثبت
                </label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={payDate}
                  onChange={(date: any) =>
                    setPayDate(date?.format?.("YYYY/MM/DD") || getTodayJalali())
                  }
                  containerClassName="w-full"
                  inputClass="w-full px-3.5 py-2.5 pl-8 bg-slate-50 border rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-blue-600 cursor-pointer"
                />
                <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-8 pointer-events-none" />
              </div>

              {/* بخش نقدی */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-700">
                  <Banknote className="w-4 h-4" /> بخش نقدی (کارت به کارت /
                  حواله)
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="مبلغ نقدی (تومان)..."
                  className="w-full px-3.5 py-2.5 bg-emerald-50/30 border border-emerald-200 rounded-xl text-sm font-black focus:bg-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* بخش چک صیادی */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-700">
                  <CreditCard className="w-4 h-4" /> بخش چک صیادی
                </label>
                <input
                  type="number"
                  value={checkAmount}
                  onChange={(e) => setCheckAmount(e.target.value)}
                  placeholder="مبلغ چک (تومان)..."
                  className="w-full px-3.5 py-2.5 bg-blue-50/30 border border-blue-200 rounded-xl text-sm font-black focus:bg-white outline-none focus:border-blue-500"
                />

                {Number(checkAmount) > 0 && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3 animate-page-enter">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-800 mb-1">
                          شماره صیادی *
                        </label>
                        <input
                          type="text"
                          value={payCheckNo}
                          onChange={(e) => setPayCheckNo(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-800 mb-1">
                          نام بانک
                        </label>
                        <input
                          type="text"
                          value={payCheckBank}
                          onChange={(e) => setPayCheckBank(e.target.value)}
                          placeholder="مثلا: ملی"
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="relative z-50">
                      <label className="block text-[10px] font-black text-rose-600 mb-1">
                        تاریخ سررسید چک *
                      </label>
                      <DatePicker
                        calendar={persian}
                        locale={persian_fa}
                        value={payCheckDueDate}
                        onChange={(date: any) =>
                          setPayCheckDueDate(
                            date?.format?.("YYYY/MM/DD") || getTodayJalali(),
                          )
                        }
                        containerClassName="w-full"
                        inputClass="w-full px-3 py-2 pl-8 bg-white border border-rose-300 rounded-lg text-xs font-black text-rose-600 outline-none cursor-pointer focus:border-rose-500"
                      />
                      <CalendarDays className="w-3.5 h-3.5 text-rose-400 absolute left-2.5 top-6 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* آپلود تصویر رسید */}
              <div className="pt-2">
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  <Upload className="w-3.5 h-3.5" /> آپلود تصویر فیش یا چک
                  (اختیاری)
                </label>
                <div
                  className={`border border-dashed rounded-xl transition-colors p-3 text-center cursor-pointer relative overflow-hidden ${receiptFile ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 hover:bg-slate-100 border-slate-300"}`}
                >
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={(e) =>
                      setReceiptFile(e.target.files ? e.target.files[0] : null)
                    }
                  />
                  {receiptFile ? (
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> عکس انتخاب شد:{" "}
                      {receiptFile.name.substring(0, 15)}...
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> برای انتخاب عکس کلیک
                      کنید
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  توضیحات (اختیاری)
                </label>
                <input
                  type="text"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  placeholder="بابت تسویه فاکتور..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 flex items-center justify-between mt-2">
                <span className="text-[11px] sm:text-xs text-slate-300 font-bold">
                  مجموع مبلغ دریافتی (نقد + چک):
                </span>
                <span className="text-sm sm:text-base text-emerald-400 font-black">
                  {totalReceivingAmount.toLocaleString("fa-IR")} ت
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setPaymentModalCustomer(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] sm:text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "ثبت مبالغ و کسر از بدهی"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= مودال تهاتر (انتقال وجه بین حساب‌ها) ================= */}
      {isTransferModalOpen && (
        <div className="print:hidden fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md p-5 sm:p-7 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" /> انتقال وجه
                (تهاتر حساب)
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-[11px] sm:text-xs font-bold">
                {transferError}
              </div>
            )}

            <form onSubmit={handleConfirmTransfer} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-black text-amber-800 mb-1.5">
                    مشتری مبداء (کسر از بدهی این شخص) *
                  </label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      انتخاب مشتری...
                    </option>
                    {safeCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (بدهی: {c.balance.toLocaleString("fa-IR")})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-black text-blue-800 mb-1.5">
                    مشتری مقصد (افزایش بدهی این شخص) *
                  </label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      انتخاب مشتری...
                    </option>
                    {safeCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (بدهی: {c.balance.toLocaleString("fa-IR")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  مبلغ تهاتر (تومان) *
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="مثلاً: 5000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:bg-white outline-none focus:border-blue-600"
                />
              </div>

              <div className="relative z-40">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  تاریخ انتقال
                </label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={transferDate}
                  onChange={(date: any) =>
                    setTransferDate(
                      date?.format?.("YYYY/MM/DD") || getTodayJalali(),
                    )
                  }
                  containerClassName="w-full"
                  inputClass="w-full px-3.5 py-2.5 pl-8 bg-slate-50 border rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-blue-600 cursor-pointer"
                />
                <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-8 pointer-events-none" />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  توضیحات (اختیاری)
                </label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  placeholder="بابت..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-amber-600 text-white text-[11px] font-bold shadow-md cursor-pointer"
                >
                  ثبت و انتقال مبلغ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= مودال نمایش عکس فیش آپلودی ================= */}
      {imageViewModal && (
        <div
          className="print:hidden fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setImageViewModal(null)}
        >
          <div className="relative max-w-3xl w-full">
            <button
              onClick={() => setImageViewModal(null)}
              className="absolute -top-12 right-0 p-2 bg-white/20 text-white rounded-xl hover:bg-white/40"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={imageViewModal}
              alt="رسید پرداختی"
              className="w-full rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* ================= مودال چاپ رسید پرداختی تکی ================= */}
      {receiptTx && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto print:static print:bg-white print:p-0">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-[210mm] my-auto overflow-hidden print:shadow-none print:border-none print:rounded-none">
            <div className="print:hidden bg-slate-900 px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                پیش‌نمایش رسید پرداخت
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> چاپ رسید
                </button>
                <button
                  onClick={() => setReceiptTx(null)}
                  className="p-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              id="print-section"
              className="relative p-8 bg-white text-slate-900 mx-auto w-[210mm] h-[297mm] print:w-full print:h-auto"
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="PN"
                  className="w-80 h-80 object-contain opacity-[0.04] mix-blend-multiply"
                />
              </div>

              <div className="relative z-10 flex justify-between items-center border-b-2 border-slate-800 pb-5 mb-8">
                <div className="flex items-center gap-4">
                  <img
                    src="/logo.png"
                    alt="PN"
                    className="w-20 h-20 object-contain mix-blend-multiply"
                  />
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      گروه صنعتی پیمان «حسنی»
                    </h2>
                    <p className="text-xs font-bold text-slate-600 mt-1">
                      تولید کننده قطعات لاستیکی خودرو و صنعتی
                    </p>
                  </div>
                </div>
                <div className="text-left text-sm font-bold text-slate-800 space-y-1">
                  <div className="text-xl font-black text-blue-700 mb-2 border-b border-slate-300 pb-1 inline-block">
                    رسید دریافت وجه
                  </div>
                  <div>
                    شماره پیگیری:{" "}
                    <span className="font-mono">
                      {receiptTx.tx.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div>تاریخ: {receiptTx.tx.date}</div>
                </div>
              </div>

              <div className="relative z-10 text-base leading-loose font-medium text-justify px-4">
                بدینوسیله گواهی می‌شود در تاریخ{" "}
                <span className="font-bold border-b border-dotted border-slate-400 px-2">
                  {receiptTx.tx.date}
                </span>{" "}
                مبلغ{" "}
                <span className="font-black text-lg border-b border-dotted border-slate-400 px-2 text-rose-600">
                  {receiptTx.tx.amount.toLocaleString("fa-IR")} تومان
                </span>{" "}
                (معادل حروف:{" "}
                <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {amountToPersianLetters(receiptTx.tx.amount)}
                </span>
                ) از جناب آقای / شرکت{" "}
                <span className="font-black border-b border-dotted border-slate-400 px-2 text-lg">
                  {receiptTx.customer.name}
                </span>{" "}
                بابت{" "}
                <span className="font-bold border-b border-dotted border-slate-400 px-2">
                  {receiptTx.tx.description || "تسویه حساب"}
                </span>{" "}
                به صورت{" "}
                <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {receiptTx.tx.type === "PAYMENT_CHECK"
                    ? "چک صیادی"
                    : "نقد / حواله بانکی"}
                </span>{" "}
                دریافت گردید.
              </div>

              {receiptTx.tx.type === "PAYMENT_CHECK" &&
                receiptTx.tx.checkNumber && (
                  <div className="relative z-10 mt-6 p-4 bg-slate-50 border border-slate-300 rounded-xl grid grid-cols-3 gap-4 text-sm font-bold mx-4">
                    <div>
                      شماره چک:{" "}
                      <span className="font-black font-mono text-slate-900">
                        {receiptTx.tx.checkNumber}
                      </span>
                    </div>
                    <div>
                      بانک صادرکننده:{" "}
                      <span className="font-black text-slate-900">
                        {receiptTx.tx.checkBank || "-"}
                      </span>
                    </div>
                    <div>
                      تاریخ سررسید:{" "}
                      <span className="font-black text-rose-600">
                        {receiptTx.tx.checkDueDate}
                      </span>
                    </div>
                  </div>
                )}

              <div className="relative z-10 mt-20 flex justify-between px-16 text-sm font-black text-slate-800">
                <div className="text-center space-y-16">
                  <span>مهر و امضای پرداخت کننده</span>
                  <div className="border-t border-slate-400 pt-2 w-48 mx-auto">
                    امضای مشتری
                  </div>
                </div>
                <div className="text-center space-y-16">
                  <span>مهر و امضای دریافت کننده</span>
                  <div className="border-t border-slate-400 pt-2 w-48 mx-auto">
                    گروه صنعتی پیمان
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-0 w-full text-center text-[10px] font-bold text-slate-400">
                آدرس: جاده خاوران... | تلفن: ۰۹۱۲۶۹۶۶۹۲۳ - ۰۹۱۲۹۶۳۱۶۲۱
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال ریزحساب (جدول کلی مشتری) ================= */}
      {currentLedgerCustomer && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto print:static print:bg-white print:p-0">
          <div
            className={`bg-white rounded-3xl border border-slate-200 shadow-2xl w-full my-auto overflow-hidden print:shadow-none print:border-none print:rounded-none ${printSize === "A5" ? "max-w-[148mm]" : "max-w-[210mm]"}`}
          >
            <div className="print:hidden bg-slate-900 text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                  سایز چاپ:
                </span>
                <div className="flex bg-slate-800 p-1 rounded-xl flex-1 sm:flex-none">
                  <button
                    onClick={() => setPrintSize("A4")}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${printSize === "A4" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPrintSize("A5")}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${printSize === "A5" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    A5
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-bold inline-flex justify-center items-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> <span>چاپ ریزحساب</span>
                </button>
                <button
                  onClick={() => setLedgerCustomer(null)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4 sm:w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              id="print-section"
              className={`relative p-5 sm:p-8 bg-white text-slate-900 overflow-hidden mx-auto ${printSize === "A5" ? "text-xs" : "text-sm"}`}
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="PN"
                  className={`${printSize === "A5" ? "w-48 h-48" : "w-72 h-72"} object-contain opacity-[0.06] mix-blend-multiply`}
                />
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-800 pb-4 mb-5 gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="PN"
                    className={`${printSize === "A5" ? "w-12 h-12" : "w-16 h-16"} object-contain mix-blend-multiply shrink-0`}
                  />
                  <div>
                    <h2
                      className={`${printSize === "A5" ? "text-lg" : "text-xl"} font-black text-slate-900 tracking-tight`}
                    >
                      گروه صنعتی پیمان «حسنی»
                    </h2>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-1">
                      تولید کننده قطعات لاستیکی خودرو و صنعتی
                    </p>
                  </div>
                </div>
                <div className="text-right sm:text-left text-[10px] sm:text-xs space-y-1 font-bold text-slate-700 pr-2 sm:pr-0 border-r-2 sm:border-r-0 border-slate-300">
                  <div className="text-rose-600 font-black mb-1">
                    صورتحساب و ریزگردش مشتری
                  </div>
                  <div>تاریخ گزارش: {getTodayJalali()}</div>
                  <div>همراه: ۰۹۱۲۶۹۶۶۹۲۳ - ۰۹۱۲۹۶۳۱۶۲۱</div>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-50 border border-slate-300 rounded-xl p-3 sm:p-4 mb-5 text-[11px] sm:text-xs">
                <div className="flex sm:block justify-between border-b sm:border-0 border-slate-200 pb-1 sm:pb-0">
                  <span className="text-slate-500 font-medium sm:block">
                    مشتری:
                  </span>
                  <span className="font-black text-slate-900 text-xs sm:text-sm">
                    {currentLedgerCustomer.name}
                  </span>
                </div>
                <div className="flex sm:block justify-between border-b sm:border-0 border-slate-200 pb-1 sm:pb-0">
                  <span className="text-slate-500 font-medium sm:block">
                    شهر:
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentLedgerCustomer.city || "-"}
                  </span>
                </div>
                <div className="flex sm:block justify-between border-b sm:border-0 border-slate-200 pb-1 sm:pb-0">
                  <span className="text-slate-500 font-medium sm:block">
                    تلفن:
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentLedgerCustomer.phone || "-"}
                  </span>
                </div>
                <div className="flex sm:block justify-between bg-rose-50 sm:bg-transparent p-1.5 -m-1.5 sm:p-0 sm:m-0 rounded-lg">
                  <span className="text-slate-500 font-bold sm:block">
                    مانده نهایی حساب:
                  </span>
                  <span className="font-black text-rose-600 text-xs sm:text-sm">
                    {currentLedgerCustomer.balance.toLocaleString("fa-IR")}{" "}
                    <span className="text-[9px] sm:text-[10px]">تومان</span>
                  </span>
                </div>
              </div>

              <div className="relative z-10">
                <div className="hidden sm:block print:block border border-slate-400 rounded-lg overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-400 text-slate-900">
                        <th className="py-2 px-2 border-l border-slate-300 w-10 text-center font-black">
                          ردیف
                        </th>
                        <th className="py-2 px-2 border-l border-slate-300 w-24 text-center font-black">
                          تاریخ
                        </th>
                        <th className="py-2 px-2 border-l border-slate-300 w-28 font-black">
                          نوع تراکنش
                        </th>
                        <th className="py-2 px-3 border-l border-slate-300 font-black">
                          شرح / فاکتور / چک
                        </th>
                        <th className="py-2 px-3 text-center font-black w-28">
                          مبلغ (تومان)
                        </th>
                        <th className="print:hidden py-2 px-2 text-center font-black w-24 border-r border-slate-300">
                          رسید / فیش
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {customerLedgerTx.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-slate-500 font-medium"
                          >
                            هیچ گردش حسابی ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        customerLedgerTx.map((tx, idx) => (
                          <tr key={tx.id} className="text-slate-800">
                            <td className="py-1.5 px-2 border-l border-slate-300 text-center font-bold">
                              {(idx + 1).toLocaleString("fa-IR")}
                            </td>
                            <td className="py-1.5 px-2 border-l border-slate-300 text-center font-bold">
                              {tx.date}
                            </td>
                            <td className="py-1.5 px-2 border-l border-slate-300 font-black text-[11px] sm:text-xs">
                              {tx.type === "INVOICE" ? (
                                <span className="text-rose-600">
                                  فاکتور فروش (+)
                                </span>
                              ) : tx.type === "PAYMENT_CHECK" ? (
                                <span className="text-blue-600">
                                  پرداخت چک (-)
                                </span>
                              ) : (
                                <span className="text-emerald-600">
                                  دریافت نقدی (-)
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 border-l border-slate-300 font-medium text-[11px] sm:text-xs">
                              {tx.description}
                              {tx.checkNumber && (
                                <span className="block text-[10px] text-slate-500 mt-0.5 font-bold">
                                  چک: {tx.checkNumber} ({tx.checkBank}) •
                                  سررسید: {tx.checkDueDate}
                                </span>
                              )}
                            </td>
                            <td
                              className={`py-1.5 px-3 text-left font-black ${tx.type === "INVOICE" ? "text-rose-600" : "text-emerald-600"}`}
                            >
                              {tx.type === "INVOICE" ? "+" : "-"}
                              {tx.amount.toLocaleString("fa-IR")}
                            </td>
                            <td className="print:hidden py-1.5 px-2 text-center border-r border-slate-300">
                              <div className="flex items-center justify-center gap-1">
                                {tx.type !== "INVOICE" && (
                                  <button
                                    onClick={() =>
                                      setReceiptTx({
                                        customer: currentLedgerCustomer,
                                        tx,
                                      })
                                    }
                                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                                    title="چاپ رسید"
                                  >
                                    <ReceiptText className="w-4 h-4" />
                                  </button>
                                )}
                                {(tx as any).receiptUrl && (
                                  <button
                                    onClick={() =>
                                      setImageViewModal((tx as any).receiptUrl)
                                    }
                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg cursor-pointer"
                                    title="مشاهده فیش واریزی"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex items-start justify-between border-t-2 border-slate-800 pt-4 text-xs font-bold text-slate-800">
                <div className="space-y-4">
                  <div>مهر و امضای فروشنده (پیمان)</div>
                  <div>مهر و امضای مشتری ({currentLedgerCustomer.name})</div>
                </div>
                <div className="text-left border-2 border-slate-800 p-3 rounded-xl bg-slate-50">
                  <div className="text-[11px] text-slate-500 mb-1">
                    مانده نهایی و قابل پرداخت:
                  </div>
                  <div className="text-base sm:text-lg font-black text-rose-600">
                    {currentLedgerCustomer.balance.toLocaleString("fa-IR")}{" "}
                    تومان
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
