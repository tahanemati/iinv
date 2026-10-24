import { create } from "zustand";
import { getTodayJalali } from "./useInventoryStore";

export interface PurchaseRecord {
  id: string;
  invoiceNo: string; // شماره فاکتور خرید
  supplierName: string; // فروشنده / محل خرید خارج از کارخانه
  title: string; // شرح کالا یا خرج‌کرد
  category:
    | "مواد اولیه"
    | "خرید قطعه آماده"
    | "هزینه جاری و تعمیرات"
    | "سایر هزینه‌ها";
  quantity: number;
  unitPrice: number;
  totalAmount: number; // مبلغ کل (تومان)
  date: string; // تاریخ (مثلاً ۱۴۰۵/۰۷/۱۰ برای فیلتر ماهانه و سالانه)
  paidFromBank: boolean; // آیا از کارت/حساب کارخانه پرداخت شده؟
}

export interface BankAccountInfo {
  bankName: string;
  accountOwner: string;
  cardNumber: string;
  shabaNumber: string;
  balance: number; // موجودی فعلی حساب کارخانه (تومان)
}

export interface BankTransaction {
  id: string;
  type: "IN" | "OUT"; // IN: واریز به کارت کارخانه | OUT: برداشت/خرج‌کرد از کارت
  amount: number;
  date: string;
  title: string;
  category: string;
}

interface FinanceState {
  purchases: PurchaseRecord[];
  bankAccount: BankAccountInfo;
  bankTransactions: BankTransaction[];

  addPurchase: (data: Omit<PurchaseRecord, "id">) => void;
  deletePurchase: (id: string) => void;

  updateBankInfo: (info: Partial<BankAccountInfo>) => void;
  addBankTransaction: (data: Omit<BankTransaction, "id">) => {
    success: boolean;
    message?: string;
  };
  deleteBankTransaction: (id: string) => void;
}

const PURCHASES_KEY = "peyman_pn_purchases";
const BANK_INFO_KEY = "peyman_pn_bank_info";
const BANK_TX_KEY = "peyman_pn_bank_tx";

const initialPurchases: PurchaseRecord[] = [
  {
    id: "PUR-101",
    invoiceNo: "۸۸۴۰",
    supplierName: "پتروشیمی و لاستیک‌سازی رازی",
    title: "خرید ۵۰۰ کیلوگرم کائوچو و مواد اولیه لاستیک",
    category: "مواد اولیه",
    quantity: 500,
    unitPrice: 95000,
    totalAmount: 47500000,
    date: "۱۴۰۵/۰۷/۰۳",
    paidFromBank: true,
  },
  {
    id: "PUR-102",
    invoiceNo: "۱۲۰۵",
    supplierName: "تراشکاری و قالب‌سازی صنعتگران",
    title: "خرید بوش فلزی داخل طبق و سرویس قالب‌ها",
    category: "خرید قطعه آماده",
    quantity: 1000,
    unitPrice: 12000,
    totalAmount: 12000000,
    date: "۱۴۰۵/۰۷/۰۶",
    paidFromBank: true,
  },
];

const initialBankInfo: BankAccountInfo = {
  bankName: "بانک ملت - شعبه مرکزی صنعت",
  accountOwner: "گروه صنعتی پیمان (حسنی)",
  cardNumber: "۶۱۰۴ - ۳۳۷۸ - ۹۱۲۰ - ۴۴۵۵",
  shabaNumber: "IR820120000000009876543210",
  balance: 342000000,
};

const initialBankTx: BankTransaction[] = [
  {
    id: "BTX-1",
    type: "IN",
    amount: 85000000,
    date: "۱۴۰۵/۰۷/۰۱",
    title: "شارژ اولیه و واریزی فروش قطعات",
    category: "واریزی مشتریان",
  },
  {
    id: "BTX-2",
    type: "OUT",
    amount: 47500000,
    date: "۱۴۰۵/۰۷/۰۳",
    title: "خرید ۵۰۰ کیلوگرم کائوچو و مواد اولیه لاستیک (فاکتور ۸۸۴۰)",
    category: "مواد اولیه",
  },
  {
    id: "BTX-3",
    type: "OUT",
    amount: 12000000,
    date: "۱۴۰۵/۰۷/۰۶",
    title: "خرید بوش فلزی داخل طبق و سرویس قالب‌ها (فاکتور ۱۲۰۵)",
    category: "خرید قطعه آماده",
  },
];

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  purchases: loadFromStorage(PURCHASES_KEY, initialPurchases),
  bankAccount: loadFromStorage(BANK_INFO_KEY, initialBankInfo),
  bankTransactions: loadFromStorage(BANK_TX_KEY, initialBankTx),

  addPurchase: (data) => {
    const newPurchase: PurchaseRecord = {
      ...data,
      id: `PUR-${Date.now()}`,
      date: data.date || getTodayJalali(),
    };

    const updatedPurchases = [newPurchase, ...get().purchases];
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(updatedPurchases));

    // اگر تیک «پرداخت از کارت بانکی کارخانه» خورده باشد، خودکار از حساب بانکی کم شود
    if (data.paidFromBank && data.totalAmount > 0) {
      const currentBank = get().bankAccount;
      const updatedBank = {
        ...currentBank,
        balance: currentBank.balance - Number(data.totalAmount),
      };

      const newBankTx: BankTransaction = {
        id: `BTX-${Date.now()}`,
        type: "OUT",
        amount: Number(data.totalAmount),
        date: newPurchase.date,
        title: `${newPurchase.title} (فروشنده: ${newPurchase.supplierName})`,
        category: newPurchase.category,
      };

      const updatedBankTx = [newBankTx, ...get().bankTransactions];

      localStorage.setItem(BANK_INFO_KEY, JSON.stringify(updatedBank));
      localStorage.setItem(BANK_TX_KEY, JSON.stringify(updatedBankTx));

      set({
        purchases: updatedPurchases,
        bankAccount: updatedBank,
        bankTransactions: updatedBankTx,
      });
      return;
    }

    set({ purchases: updatedPurchases });
  },

  deletePurchase: (id) => {
    const updated = get().purchases.filter((p) => p.id !== id);
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(updated));
    set({ purchases: updated });
  },

  updateBankInfo: (info) => {
    const updated = { ...get().bankAccount, ...info };
    localStorage.setItem(BANK_INFO_KEY, JSON.stringify(updated));
    set({ bankAccount: updated });
  },

  addBankTransaction: (data) => {
    const numAmount = Number(data.amount);
    if (numAmount <= 0) {
      return { success: false, message: "مبلغ تراکنش باید بیشتر از صفر باشد." };
    }

    const currentBank = get().bankAccount;
    const newBalance =
      data.type === "IN"
        ? currentBank.balance + numAmount
        : currentBank.balance - numAmount;

    const updatedBank = { ...currentBank, balance: newBalance };
    const newTx: BankTransaction = {
      ...data,
      id: `BTX-${Date.now()}`,
      amount: numAmount,
      date: data.date || getTodayJalali(),
    };

    const updatedTx = [newTx, ...get().bankTransactions];

    localStorage.setItem(BANK_INFO_KEY, JSON.stringify(updatedBank));
    localStorage.setItem(BANK_TX_KEY, JSON.stringify(updatedTx));

    set({ bankAccount: updatedBank, bankTransactions: updatedTx });
    return { success: true };
  },

  deleteBankTransaction: (id) => {
    const target = get().bankTransactions.find((t) => t.id === id);
    if (!target) return;

    const currentBank = get().bankAccount;
    const revertedBalance =
      target.type === "IN"
        ? currentBank.balance - target.amount
        : currentBank.balance + target.amount;

    const updatedBank = { ...currentBank, balance: revertedBalance };
    const updatedTx = get().bankTransactions.filter((t) => t.id !== id);

    localStorage.setItem(BANK_INFO_KEY, JSON.stringify(updatedBank));
    localStorage.setItem(BANK_TX_KEY, JSON.stringify(updatedTx));

    set({ bankAccount: updatedBank, bankTransactions: updatedTx });
  },
}));
