import { create } from "zustand";

export interface InvoiceItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNo: string; // شماره فاکتور (مثلاً ۲۴۰۰)
  date: string; // تاریخ فاکتور
  customerId: string;
  customerName: string; // صورتحساب شرکت / آقای
  byPerson: string; // توسط
  customerAddress: string; // آدرس
  customerPhone: string; // تلفن
  items: InvoiceItem[];
  subTotal: number; // جمع کل
  discount: number; // تخفیف
  finalAmount: number; // قیمت کل (قابل پرداخت)
  amountInWords: string; // مبلغ به حروف
}

interface InvoiceState {
  invoices: SalesInvoice[];
  nextInvoiceNo: number;
  saveInvoice: (invoice: Omit<SalesInvoice, "id">) => SalesInvoice;
  deleteInvoice: (id: string) => void;
}

const INVOICES_KEY = "peyman_pn_sales_invoices";
const NEXT_NO_KEY = "peyman_pn_next_invoice_no";

const loadInvoices = (): SalesInvoice[] => {
  try {
    const saved = localStorage.getItem(INVOICES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const loadNextNo = (): number => {
  try {
    const saved = localStorage.getItem(NEXT_NO_KEY);
    return saved ? Number(saved) : 2400; // شروع شماره فاکتور از ۲۴۰۰ (ادامه ۲۳۹۹ روی عکس فاکتور)
  } catch {
    return 2400;
  }
};

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: loadInvoices(),
  nextInvoiceNo: loadNextNo(),

  saveInvoice: (data) => {
    const newInvoice: SalesInvoice = {
      ...data,
      id: `INV-${Date.now()}`,
    };

    const updated = [newInvoice, ...get().invoices];
    const nextNo = get().nextInvoiceNo + 1;

    localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
    localStorage.setItem(NEXT_NO_KEY, String(nextNo));

    set({ invoices: updated, nextInvoiceNo: nextNo });
    return newInvoice;
  },

  deleteInvoice: (id) => {
    const updated = get().invoices.filter((inv) => inv.id !== id);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
    set({ invoices: updated });
  },
}));
