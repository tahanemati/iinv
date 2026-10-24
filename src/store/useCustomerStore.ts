import { create } from "zustand";
import { getTodayJalali } from "./useInventoryStore";

export type CustomerTxType = "INVOICE" | "PAYMENT_CASH" | "PAYMENT_CHECK";
export type CheckStatus = "PENDING" | "CLEARED" | "BOUNCED"; // در جریان | پاس شده | برگشتی

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: CustomerTxType;
  amount: number;
  date: string;
  description: string;
  invoiceNo?: string;
  checkNumber?: string; // شماره چک صیادی
  checkBank?: string; // نام بانک چک
  checkDueDate?: string; // تاریخ سررسید چک
  checkStatus?: CheckStatus; // وضعیت چک
  receiptUrl?: string; // لینک عکس آپلود شده فیش یا چک
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  balance: number;
  createdAt: string;
}

interface CustomerState {
  customers: Customer[];
  transactions: CustomerTransaction[];
  addCustomer: (data: {
    name: string;
    phone: string;
    city: string;
    address: string;
    initialBalance?: number;
  }) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addInvoiceDebt: (
    customerId: string,
    amount: number,
    invoiceNo: string,
    date: string,
    description?: string,
  ) => void;
  registerPayment: (data: {
    customerId: string;
    type: "PAYMENT_CASH" | "PAYMENT_CHECK";
    amount: number;
    date: string;
    checkNumber?: string;
    checkBank?: string;
    checkDueDate?: string;
    description?: string;
    receiptUrl?: string; // قابلیت دریافت لینک عکس
  }) => { success: boolean; message?: string };
  markCheckCleared: (txId: string) => CustomerTransaction | null;
  markCheckBounced: (txId: string) => CustomerTransaction | null;
}

const CUSTOMERS_KEY = "peyman_pn_customers";
const CUSTOMER_TX_KEY = "peyman_pn_customer_tx";

const initialCustomers: Customer[] = [
  {
    id: "C-101",
    name: "فروشگاه یدک گستر (احمدی)",
    phone: "09123456789",
    city: "تهران",
    address: "خیابان امیرکبیر، کوچه ناظم‌الاطبا، پلاک ۴۲",
    balance: 18500000,
    createdAt: "۱۴۰۵/۰۶/۱۰",
  },
  {
    id: "C-102",
    name: "بازرگانی قطعات حسنی",
    phone: "09131112233",
    city: "اصفهان",
    address: "بلوار شاپور جدید، مجتمع صنعتی امیر، پلاک ۱۲",
    balance: 27000000,
    createdAt: "۱۴۰۵/۰۶/۱۵",
  },
  {
    id: "C-103",
    name: "پخش یدکی محمدی",
    phone: "09145556677",
    city: "تبریز",
    address: "چهارراه قونقا، پاساژ صنعتی، طبقه اول",
    balance: 0,
    createdAt: "۱۴۰۵/۰۷/۰۱",
  },
];

const initialTransactions: CustomerTransaction[] = [
  {
    id: "CTX-1",
    customerId: "C-101",
    type: "INVOICE",
    amount: 28500000,
    date: "۱۴۰۵/۰۷/۰۲",
    invoiceNo: "۲۳۹۸",
    description: "بابت فاکتور فروش شماره ۲۳۹۸",
  },
  {
    id: "CTX-2",
    customerId: "C-101",
    type: "PAYMENT_CHECK",
    amount: 10000000,
    date: "۱۴۰۵/۰۷/۰۵",
    checkNumber: "۸۸۴۵۱۲۹۹",
    checkBank: "بانک ملت",
    checkDueDate: "۱۴۰۵/۰۷/۱۵",
    checkStatus: "PENDING",
    description: "دریافت چک صیادی بابت بخشی از حساب",
  },
  {
    id: "CTX-3",
    customerId: "C-102",
    type: "INVOICE",
    amount: 42000000,
    date: "۱۴۰۵/۰۷/۰۸",
    invoiceNo: "۲۳۹۹",
    description: "بابت فاکتور فروش شماره ۲۳۹۹",
  },
  {
    id: "CTX-4",
    customerId: "C-102",
    type: "PAYMENT_CHECK",
    amount: 15000000,
    date: "۱۴۰۵/۰۷/۰۹",
    checkNumber: "۷۷۳۲۱۰۴۴",
    checkBank: "بانک صادرات",
    checkDueDate: "۱۴۰۵/۰۷/۲۰",
    checkStatus: "PENDING",
    description: "چک صیادی یک ماهه بابت فاکتور ۲۳۹۹",
  },
];

const loadCustomers = (): Customer[] => {
  try {
    const saved = localStorage.getItem(CUSTOMERS_KEY);
    return saved ? JSON.parse(saved) : initialCustomers;
  } catch {
    return initialCustomers;
  }
};

const loadTx = (): CustomerTransaction[] => {
  try {
    const saved = localStorage.getItem(CUSTOMER_TX_KEY);
    return saved ? JSON.parse(saved) : initialTransactions;
  } catch {
    return initialTransactions;
  }
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: loadCustomers(),
  transactions: loadTx(),

  addCustomer: ({ name, phone, city, address, initialBalance = 0 }) => {
    const today = getTodayJalali();
    const initDebt = Number(initialBalance) || 0;

    const newCustomer: Customer = {
      id: `C-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim(),
      balance: initDebt,
      createdAt: today,
    };

    const updatedCustomers = [newCustomer, ...get().customers];
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));

    const updatedTx = [...get().transactions];
    if (initDebt > 0) {
      updatedTx.unshift({
        id: `CTX-${Date.now()}`,
        customerId: newCustomer.id,
        type: "INVOICE",
        amount: initDebt,
        date: today,
        description: "مانده بدهی اولیه از قبل",
      });
      localStorage.setItem(CUSTOMER_TX_KEY, JSON.stringify(updatedTx));
    }

    set({ customers: updatedCustomers, transactions: updatedTx });
    return newCustomer;
  },

  updateCustomer: (id, data) => {
    const updated = get().customers.map((c) =>
      c.id === id ? { ...c, ...data } : c,
    );
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
    set({ customers: updated });
  },

  deleteCustomer: (id) => {
    const updatedCustomers = get().customers.filter((c) => c.id !== id);
    const updatedTx = get().transactions.filter((t) => t.customerId !== id);
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
    localStorage.setItem(CUSTOMER_TX_KEY, JSON.stringify(updatedTx));
    set({ customers: updatedCustomers, transactions: updatedTx });
  },

  addInvoiceDebt: (customerId, amount, invoiceNo, date, description) => {
    const numAmount = Number(amount);
    const updatedCustomers = get().customers.map((c) =>
      c.id === customerId ? { ...c, balance: c.balance + numAmount } : c,
    );

    const newTx: CustomerTransaction = {
      id: `CTX-${Date.now()}`,
      customerId,
      type: "INVOICE",
      amount: numAmount,
      date: date || getTodayJalali(),
      invoiceNo,
      description: description || `بابت صدور فاکتور فروش شماره ${invoiceNo}`,
    };

    const updatedTx = [newTx, ...get().transactions];
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
    localStorage.setItem(CUSTOMER_TX_KEY, JSON.stringify(updatedTx));
    set({ customers: updatedCustomers, transactions: updatedTx });
  },

  registerPayment: ({
    customerId,
    type,
    amount,
    date,
    checkNumber,
    checkBank,
    checkDueDate,
    description,
    receiptUrl,
  }) => {
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      return {
        success: false,
        message: "مبلغ دریافتی باید بیشتر از صفر باشد.",
      };
    }

    const target = get().customers.find((c) => c.id === customerId);
    if (!target) {
      return { success: false, message: "مشتری یافت نشد." };
    }

    const updatedCustomers = get().customers.map((c) =>
      c.id === customerId ? { ...c, balance: c.balance - numAmount } : c,
    );

    const newTx: CustomerTransaction = {
      id: `CTX-${Date.now()}`,
      customerId,
      type,
      amount: numAmount,
      date: date || getTodayJalali(),
      checkNumber:
        type === "PAYMENT_CHECK" ? checkNumber?.trim() || "-" : undefined,
      checkBank:
        type === "PAYMENT_CHECK" ? checkBank?.trim() || "بانک" : undefined,
      checkDueDate:
        type === "PAYMENT_CHECK"
          ? checkDueDate?.trim() || date || getTodayJalali()
          : undefined,
      checkStatus: type === "PAYMENT_CHECK" ? "PENDING" : undefined,
      receiptUrl, // ذخیره لینک تصویر آپلودی
      description:
        description?.trim() ||
        (type === "PAYMENT_CASH"
          ? "دریافت وجه نقد / واریز کارت به کارت"
          : `دریافت چک شماره ${checkNumber || "-"} (${checkBank || ""}) - سررسید ${
              checkDueDate || "-"
            }`),
    };

    const updatedTx = [newTx, ...get().transactions];
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
    localStorage.setItem(CUSTOMER_TX_KEY, JSON.stringify(updatedTx));
    set({ customers: updatedCustomers, transactions: updatedTx });

    return { success: true };
  },

  // پاس شدن چک
  markCheckCleared: (txId) => {
    const target = get().transactions.find((t) => t.id === txId);
    if (
      !target ||
      target.type !== "PAYMENT_CHECK" ||
      target.checkStatus === "CLEARED"
    ) {
      return null;
    }

    // اگر قبلاً برگشت خورده بود و الان پاس شده، دوباره از بدهی مشتری کم کن
    let updatedCustomers = get().customers;
    if (target.checkStatus === "BOUNCED") {
      updatedCustomers = updatedCustomers.map((c) =>
        c.id === target.customerId
          ? { ...c, balance: c.balance - target.amount }
          : c,
      );
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
    }

    const updatedTx = get().transactions.map((t) =>
      t.id === txId ? { ...t, checkStatus: "CLEARED" as CheckStatus } : t,
    );

    localStorage.setItem(CUSTOMER_TX_KEY, JSON.stringify(updatedTx));
    set({ customers: updatedCustomers, transactions: updatedTx });
    return target;
  },

  // برگشت خوردن چک (برگرداندن مبلغ چک روی بدهی مشتری)
  markCheckBounced: (txId) => {
    const target = get().transactions.find((t) => t.id === txId);
    if (
      !target ||
      target.type !== "PAYMENT_CHECK" ||
      target.checkStatus === "BOUNCED"
    ) {
      return null;
    }

    const updatedCustomers = get().customers.map((c) =>
      c.id === target.customerId
        ? { ...c, balance: c.balance + target.amount }
        : c,
    );

    const updatedTx = get().transactions.map((t) =>
      t.id === txId
        ? {
            ...t,
            checkStatus: "BOUNCED" as CheckStatus,
            description: `${t.description} (چک برگشت خورد و به حساب بدهی بازگشت)`,
          }
        : t,
    );

    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
    localStorage.setItem(CUSTOMER_TX_KEY, JSON.stringify(updatedTx));
    set({ customers: updatedCustomers, transactions: updatedTx });
    return target;
  },
}));
