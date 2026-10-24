import React, { useState, useMemo, useEffect } from "react";
import {
  Landmark,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  Trash2,
  Search,
  X,
  Wallet,
  CalendarDays,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

// ایمپورت ایمن تقویم شمسی برای جلوگیری از کرش (ESM Fallback)
import MultiDatePicker from "react-multi-date-picker";
import persianCal from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";
const DatePicker = (MultiDatePicker as any).default || MultiDatePicker;
const persian = (persianCal as any).default || persianCal;
const persian_fa = (persianFa as any).default || persianFa;

import { useFinanceStore } from "../../store/useFinanceStore";
import { getTodayJalali } from "../../store/useInventoryStore";

// رنگ‌های قابل انتخاب برای کارت‌های بانکی
const CARD_COLORS = [
  "from-blue-800 via-blue-700 to-slate-900", // آبی/سرمه‌ای
  "from-emerald-800 via-emerald-700 to-teal-900", // سبز
  "from-rose-800 via-rose-700 to-red-900", // قرمز
  "from-amber-700 via-amber-600 to-orange-900", // طلایی/نارنجی
  "from-indigo-800 via-indigo-700 to-violet-900", // بنفش
  "from-slate-800 via-slate-700 to-black", // مشکی VIP
];

interface BankCard {
  id: string;
  bankName: string;
  accountOwner: string;
  cardNumber: string;
  shabaNumber: string;
  initialBalance: number;
  color: string;
}

// فرمت‌کننده شماره کارت (اضافه کردن فاصله هر ۴ رقم)
const formatCardNumber = (num: string) => {
  const cleaned = num.replace(/\D/g, "");
  const match = cleaned.match(/.{1,4}/g);
  return match ? match.join("  ") : num;
};

export const BankPage: React.FC = () => {
  const { bankAccount, bankTransactions, updateBankInfo, addBankTransaction } =
    useFinanceStore();

  const safeTransactions = Array.isArray(bankTransactions)
    ? bankTransactions
    : [];

  // ================== مدیریت چند کارت بانکی (ذخیره در لوکال استوریج) ==================
  const [cards, setCards] = useState<BankCard[]>(() => {
    try {
      const saved = localStorage.getItem("pn_bank_cards_v4");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // مقداردهی اولیه اگر کارتی وجود نداشت
    return [
      {
        id: "card-default",
        bankName: bankAccount?.bankName || "بانک ملت",
        accountOwner: bankAccount?.accountOwner || "گروه صنعتی پیمان",
        cardNumber: bankAccount?.cardNumber || "6037990000000000",
        shabaNumber: bankAccount?.shabaNumber || "IR120000000000000000000000",
        initialBalance: bankAccount?.balance || 0,
        color: CARD_COLORS[0],
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("pn_bank_cards_v4", JSON.stringify(cards));
  }, [cards]);

  // فیلترها
  const [searchTerm, setSearchTerm] = useState("");
  const [txFilter, setTxFilter] = useState<"ALL" | "IN" | "OUT">("ALL");

  // استیت‌های مودال
  const [txModal, setTxModal] = useState<{
    isOpen: boolean;
    type: "IN" | "OUT";
  }>({ isOpen: false, type: "OUT" });
  const [cardModal, setCardModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    cardId: string;
  }>({ isOpen: false, isEdit: false, cardId: "" });
  const [deleteCardModal, setDeleteCardModal] = useState<{
    isOpen: boolean;
    cardId: string;
  }>({ isOpen: false, cardId: "" });

  // فیلدهای فرم تراکنش
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("خرج‌کرد جاری کارخانه");
  const [date, setDate] = useState(getTodayJalali());
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id || "");
  const [txError, setTxError] = useState<string | null>(null);

  // فیلدهای فرم کارت
  const [cardForm, setCardForm] = useState({
    bankName: "",
    accountOwner: "",
    cardNumber: "",
    shabaNumber: "",
    initialBalance: "",
    color: CARD_COLORS[0],
  });
  const [cardError, setCardError] = useState<string | null>(null);

  // ================== توابع محاسباتی هوشمند ==================

  // دریافت موجودی دقیق یک کارت خاص
  const getCardBalance = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return 0;

    const relatedTxs = safeTransactions.filter((t) => {
      const tCardId = (t as any).cardId;
      if (!tCardId && cardId === cards[0]?.id) return true; // پشتیبانی از تراکنش‌های قدیمی
      return tCardId === cardId;
    });

    const incoming = relatedTxs
      .filter((t) => t.type === "IN")
      .reduce((sum, t) => sum + t.amount, 0);
    const outgoing = relatedTxs
      .filter((t) => t.type === "OUT")
      .reduce((sum, t) => sum + t.amount, 0);

    return card.initialBalance + incoming - outgoing;
  };

  // مجموع موجودی کل کیف پول
  const grandTotalBalance = useMemo(() => {
    return cards.reduce((sum, c) => sum + getCardBalance(c.id), 0);
  }, [cards, safeTransactions]);

  // آپدیت همزمان موجودی کل در استور اصلی (برای نمایش در داشبورد و خریدها)
  useEffect(() => {
    if (grandTotalBalance !== bankAccount.balance) {
      updateBankInfo({ ...bankAccount, balance: grandTotalBalance });
    }
  }, [grandTotalBalance]);

  // فیلتر تراکنش‌ها
  const filteredTransactions = useMemo(() => {
    return safeTransactions.filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (t.title || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.date || "").includes(q);

      if (!matchesSearch) return false;
      if (txFilter !== "ALL" && t.type !== txFilter) return false;
      return true;
    });
  }, [safeTransactions, searchTerm, txFilter]);

  // آمار کلی ورودی/خروجی
  const stats = useMemo(() => {
    const totalIn = safeTransactions
      .filter((t) => t.type === "IN")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalOut = safeTransactions
      .filter((t) => t.type === "OUT")
      .reduce((sum, t) => sum + t.amount, 0);
    return { totalIn, totalOut };
  }, [safeTransactions]);

  // پیدا کردن نام بانک برای هر تراکنش در لیست
  const getTxBankName = (tx: any) => {
    if (tx.cardId) {
      const c = cards.find((x) => x.id === tx.cardId);
      return c ? c.bankName : "کارت حذف شده";
    }
    return cards[0]?.bankName || "نامشخص";
  };

  // ================== هندلرهای اکشن‌ها ==================

  const openTxModal = (type: "IN" | "OUT") => {
    setTxModal({ isOpen: true, type });
    setAmount("");
    setTitle("");
    setCategory(type === "IN" ? "واریزی مشتریان" : "خرج‌کرد جاری کارخانه");
    setDate(getTodayJalali());
    setSelectedCardId(cards[0]?.id || "");
    setTxError(null);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);

    if (!title.trim() || !amount || Number(amount) <= 0) {
      setTxError("لطفاً شرح تراکنش و مبلغ را به درستی وارد نمایید.");
      return;
    }
    if (!selectedCardId) {
      setTxError("لطفاً یک کارت بانکی را انتخاب کنید.");
      return;
    }

    addBankTransaction({
      type: txModal.type,
      amount: Number(amount),
      title: title.trim(),
      category,
      date,
      cardId: selectedCardId,
    } as any);

    setTxModal({ isOpen: false, type: "OUT" });
  };

  const openAddCardModal = () => {
    setCardForm({
      bankName: "",
      accountOwner: "",
      cardNumber: "",
      shabaNumber: "",
      initialBalance: "",
      color: CARD_COLORS[0],
    });
    setCardError(null);
    setCardModal({ isOpen: true, isEdit: false, cardId: "" });
  };

  const openEditCardModal = (card: BankCard) => {
    setCardForm({
      bankName: card.bankName,
      accountOwner: card.accountOwner,
      cardNumber: card.cardNumber,
      shabaNumber: card.shabaNumber,
      initialBalance: String(card.initialBalance),
      color: card.color,
    });
    setCardError(null);
    setCardModal({ isOpen: true, isEdit: true, cardId: card.id });
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.bankName.trim()) {
      setCardError("وارد کردن نام بانک الزامی است.");
      return;
    }

    if (cardModal.isEdit) {
      setCards(
        cards.map((c) =>
          c.id === cardModal.cardId
            ? {
                ...c,
                ...cardForm,
                initialBalance: Number(cardForm.initialBalance) || 0,
              }
            : c,
        ),
      );
    } else {
      setCards([
        ...cards,
        {
          id: `card-${Date.now()}`,
          ...cardForm,
          initialBalance: Number(cardForm.initialBalance) || 0,
        },
      ]);
    }
    setCardModal({ isOpen: false, isEdit: false, cardId: "" });
  };

  const confirmDeleteCard = () => {
    if (cards.length === 1) {
      alert("شما نمی‌توانید آخرین کارت بانکی سیستم را حذف کنید!");
      setDeleteCardModal({ isOpen: false, cardId: "" });
      return;
    }
    setCards(cards.filter((c) => c.id !== deleteCardModal.cardId));
    setDeleteCardModal({ isOpen: false, cardId: "" });
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      {/* ================= هدر اصلی ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <span>کیف پول و حساب‌های بانکی</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1">
            مدیریت چندین کارت، ثبت ورودی/خروجی و مشاهده گردش حساب به تفکیک
            کارت‌ها
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => openTxModal("IN")}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-sm font-bold inline-flex justify-center items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>ورودی (+)</span>
          </button>
          <button
            onClick={() => openTxModal("OUT")}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] sm:text-sm font-bold inline-flex justify-center items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>خرج‌کرد (-)</span>
          </button>
        </div>
      </div>

      {/* ================= نمایش کارت‌های بانکی (موبایل اسکرولی / دسکتاپ گرید) ================= */}
      <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 scroll-smooth">
        {cards.map((card) => {
          const currentBalance = getCardBalance(card.id);
          return (
            <div
              key={card.id}
              className={`snap-center shrink-0 w-[88vw] max-w-[340px] lg:w-full lg:max-w-none rounded-3xl bg-gradient-to-br ${card.color} text-white p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[210px] border border-white/10 transition-transform duration-300 hover:scale-[1.02]`}
            >
              {/* افکت‌های شیشه‌ای و نوری روی کارت */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl pointer-events-none" />

              {/* ردیف بالا: نام بانک و آیکون‌ها */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 opacity-80" />
                  <span className="font-bold text-sm tracking-widest">
                    {card.bankName}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditCardModal(card)}
                    className="p-1.5 rounded-lg hover:bg-white/20 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteCardModal({ isOpen: true, cardId: card.id })
                    }
                    className="p-1.5 rounded-lg hover:bg-rose-500/50 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* چیپ الکترونیکی (طراحی CSS) */}
              <div className="relative z-10 mt-4 mb-2">
                <div className="w-10 h-7 rounded bg-amber-200/40 border border-amber-300/30 flex items-center justify-center">
                  <div className="w-6 h-4 border border-amber-300/30 rounded-sm opacity-50"></div>
                </div>
              </div>

              {/* شماره کارت */}
              <div
                dir="ltr"
                className="relative z-10 text-[19px] sm:text-[22px] font-black tracking-[0.15em] font-mono text-white drop-shadow-md"
              >
                {formatCardNumber(card.cardNumber || "**** **** **** ****")}
              </div>

              {/* ردیف پایین: صاحب حساب و موجودی */}
              <div className="relative z-10 mt-5 flex items-end justify-between">
                <div>
                  <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider opacity-70 mb-0.5">
                    صاحب حساب
                  </span>
                  <span className="block font-bold text-xs sm:text-sm">
                    {card.accountOwner || "بدون نام"}
                  </span>
                </div>
                <div className="text-left">
                  <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider opacity-70 mb-0.5">
                    موجودی کارت
                  </span>
                  <div className="font-black text-lg sm:text-xl drop-shadow-md">
                    {currentBalance.toLocaleString("fa-IR")}{" "}
                    <span className="text-[10px] font-normal opacity-80">
                      تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* دکمه افزودن کارت جدید (طراحی شده به شکل یک کارت خالی) */}
        <div
          onClick={openAddCardModal}
          className="snap-center shrink-0 w-[88vw] max-w-[340px] lg:w-full lg:max-w-none rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer min-h-[210px] p-6 group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-200 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors shadow-sm">
            <Plus className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
          </div>
          <span className="font-black text-sm">افزودن کارت جدید</span>
          <span className="text-[10px] mt-1.5 opacity-70 text-center max-w-[200px]">
            مدیریت کیف پول و کارت‌های بانکی مجزا برای حسابرسی دقیق
          </span>
        </div>
      </div>

      {/* ================= آمار کل کیف پول ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="col-span-2 lg:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-slate-300 font-bold block">
                مجموع موجودی تمام کارت‌ها (دارایی نقدی)
              </span>
              <span className="text-lg sm:text-2xl font-black text-white">
                {grandTotalBalance.toLocaleString("fa-IR")}{" "}
                <span className="text-[9px] sm:text-[11px] font-normal text-slate-400">
                  تومان
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              کل واریزی‌ها (+)
            </span>
            <span className="text-base font-black text-emerald-600 truncate block">
              {stats.totalIn.toLocaleString("fa-IR")}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              کل خرج‌کردها (-)
            </span>
            <span className="text-base font-black text-rose-600 truncate block">
              {stats.totalOut.toLocaleString("fa-IR")}
            </span>
          </div>
        </div>
      </div>

      {/* ================= فیلترها و لیست تراکنش‌ها ================= */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar shrink-0">
            {[
              { key: "ALL", label: "همه تراکنش‌ها" },
              { key: "IN", label: "ورودی‌ها (+)" },
              { key: "OUT", label: "خرج‌کردها (-)" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTxFilter(item.key as any)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  txFilter === item.key
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
              placeholder="جستجو در شرح، بانک یا تاریخ..."
              className="w-full pr-10 pl-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>

        {/* نسخه موبایل (کارت‌ها) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs font-bold">
              تراکنشی یافت نشد.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative"
              >
                <div
                  className={`absolute top-0 right-0 w-1.5 h-full ${tx.type === "IN" ? "bg-emerald-500" : "bg-rose-500"}`}
                ></div>
                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3 pr-2">
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 mb-1.5 ${tx.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {tx.type === "IN" ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                      {tx.type === "IN" ? "واریزی" : "خرج‌کرد"} •{" "}
                      <Landmark className="w-3 h-3 ml-0.5 text-slate-400" />{" "}
                      {getTxBankName(tx)}
                    </span>
                    <h3 className="font-black text-slate-800 text-sm line-clamp-2 leading-tight">
                      {tx.title}
                    </h3>
                    <div className="text-[10px] text-slate-500 mt-1.5 font-bold flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-slate-400" />{" "}
                      {tx.date}
                    </div>
                  </div>
                  <div className="text-left shrink-0 pl-1">
                    <span
                      className={`font-black text-[13px] block ${tx.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {tx.type === "IN" ? "+" : "-"}
                      {tx.amount.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[9px] text-slate-400">تومان</span>
                    <span className="block mt-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold text-center w-max ml-auto border border-slate-200/60">
                      {tx.category}
                    </span>
                  </div>
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
                <th className="py-3.5 px-3 font-bold w-28">نوع</th>
                <th className="py-3.5 px-3 font-bold w-36">کارت بانکی</th>
                <th className="py-3.5 px-3 font-bold w-32">تاریخ</th>
                <th className="py-3.5 px-3 font-bold">شرح تراکنش</th>
                <th className="py-3.5 px-3 font-bold text-center w-36">
                  دسته‌بندی
                </th>
                <th className="py-3.5 px-3 font-bold text-left w-36">
                  مبلغ (تومان)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    هیچ تراکنشی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-3">
                      {tx.type === "IN" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3" /> واریزی
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          <ArrowUpRight className="w-3 h-3" /> خرج‌کرد
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-500" />{" "}
                      {getTxBankName(tx)}
                    </td>
                    <td className="py-4 px-3 text-xs font-bold text-slate-500">
                      {tx.date}
                    </td>
                    <td
                      className="py-4 px-3 font-black text-slate-900 max-w-[250px] truncate"
                      title={tx.title}
                    >
                      {tx.title}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {tx.category}
                      </span>
                    </td>
                    <td
                      className={`py-4 px-3 text-left font-black text-base ${tx.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {tx.type === "IN" ? "+" : "-"}
                      {tx.amount.toLocaleString("fa-IR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= مودال تایید حذف کارت بانکی ================= */}
      {deleteCardModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 sm:p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center border-4 border-rose-100">
                <ShieldAlert className="w-7 h-7 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
                  حذف کامل کارت بانکی
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed px-2">
                  با حذف این کارت، موجودی آن از دارایی کل کارخانه کسر می‌شود.
                  <br /> مطمئن هستید؟
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-[11px] font-bold text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-3.5 h-3.5" /> تراکنش‌های قبلی این
                  کارت بی‌نام می‌شوند.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-7 pt-5 border-t border-slate-100">
              <button
                onClick={() =>
                  setDeleteCardModal({ isOpen: false, cardId: "" })
                }
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={confirmDeleteCard}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
              >
                بله، کارت حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال ثبت تراکنش ورودی/خروجی ================= */}
      {txModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md p-5 sm:p-8 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                {txModal.type === "IN" ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-rose-600" />
                )}
                {txModal.type === "IN"
                  ? "ثبت ورودی واریزی (+)"
                  : "ثبت خرج‌کرد کارخانه (-)"}
              </h3>
              <button
                onClick={() => setTxModal({ isOpen: false, type: "OUT" })}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {txError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] sm:text-xs font-bold">
                {txError}
              </div>
            )}

            <form onSubmit={handleSaveTx} className="space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  انتخاب کارت بانکی *
                </label>
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bankName} (موجودی:{" "}
                      {getCardBalance(c.id).toLocaleString("fa-IR")} ت)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  مبلغ تراکنش (تومان) *
                </label>
                <input
                  type="number"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثلاً: 2500000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  شرح تراکنش *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    txModal.type === "IN"
                      ? "مثلاً: واریزی بیعانه مشتری..."
                      : "مثلاً: خرید روغن موتور یا قبض..."
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    دسته‌بندی
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {txModal.type === "IN" ? (
                      <>
                        <option value="واریزی مشتریان">واریزی مشتریان</option>
                        <option value="شارژ حساب کارخانه">
                          شارژ حساب کارخانه
                        </option>
                        <option value="سایر ورودی‌ها">سایر ورودی‌ها</option>
                      </>
                    ) : (
                      <>
                        <option value="خرج‌کرد جاری کارخانه">
                          خرج‌کرد جاری کارخانه
                        </option>
                        <option value="خرید محصول / ابزار">
                          خرید محصول / ابزار
                        </option>
                        <option value="حقوق و دستمزد">حقوق و دستمزد</option>
                        <option value="قبوض و اجاره">قبوض و اجاره</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    تاریخ
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

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTxModal({ isOpen: false, type: "OUT" })}
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] sm:text-xs font-bold cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className={`flex-1 sm:flex-none px-6 py-2.5 sm:py-3 rounded-xl text-white text-[11px] sm:text-xs font-bold shadow-md cursor-pointer transition-colors ${txModal.type === "IN" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"}`}
                >
                  {txModal.type === "IN"
                    ? "ثبت و افزودن به موجودی کارت"
                    : "ثبت و کسر از موجودی کارت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= مودال تعریف و ویرایش کارت بانکی ================= */}
      {cardModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md p-5 sm:p-8 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                {cardModal.isEdit
                  ? "ویرایش اطلاعات کارت"
                  : "افزودن کارت بانکی جدید"}
              </h3>
              <button
                onClick={() =>
                  setCardModal({ isOpen: false, isEdit: false, cardId: "" })
                }
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cardError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] sm:text-xs font-bold">
                {cardError}
              </div>
            )}

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  نام بانک و شعبه *
                </label>
                <input
                  type="text"
                  value={cardForm.bankName}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, bankName: e.target.value })
                  }
                  placeholder="مثلاً: بانک ملت"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  نام صاحب حساب
                </label>
                <input
                  type="text"
                  value={cardForm.accountOwner}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, accountOwner: e.target.value })
                  }
                  placeholder="مثلاً: گروه صنعتی پیمان"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    شماره کارت ۱۶ رقمی
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={cardForm.cardNumber}
                    onChange={(e) =>
                      setCardForm({ ...cardForm, cardNumber: e.target.value })
                    }
                    placeholder="6037..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-left focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    شماره شبا (IR)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={cardForm.shabaNumber}
                    onChange={(e) =>
                      setCardForm({ ...cardForm, shabaNumber: e.target.value })
                    }
                    placeholder="IR..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-left focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  موجودی اولیه کارت (تومان)
                </label>
                <input
                  type="number"
                  value={cardForm.initialBalance}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, initialBalance: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-blue-600 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-2">
                  رنگ پس‌زمینه کارت (طراحی)
                </label>
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCardForm({ ...cardForm, color: c })}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${c} cursor-pointer transition-all ${cardForm.color === c ? "scale-110 ring-2 ring-offset-2 ring-blue-500 shadow-md" : "hover:scale-105 opacity-60 hover:opacity-100"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setCardModal({ isOpen: false, isEdit: false, cardId: "" })
                  }
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] sm:text-xs font-bold cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-colors"
                >
                  {cardModal.isEdit ? "ذخیره تغییرات" : "افزودن کارت بانکی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
