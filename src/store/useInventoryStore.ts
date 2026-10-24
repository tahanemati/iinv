import { create } from "zustand";

export interface Product {
  id: string;
  code: string; // کد قطعه
  name: string; // نام قطعه
  price: number; // قیمت واحد (جهت درج اتومات در فاکتور)
  quantity: number; // موجودی فعلی در انبار
  minStock: number; // نقطه هشدار اتمام موجودی
  unit: string; // واحد (عدد، بسته، کارتن و...)
  lastEntryDate: string; // تاریخ آخرین ورود به انبار
  lastExitDate: string; // تاریخ آخرین خروج از انبار
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: "IN" | "OUT"; // IN: ورودی به انبار | OUT: خروجی از انبار
  amount: number;
  date: string;
  note: string;
}

interface InventoryState {
  products: Product[];
  logs: InventoryLog[];
  addProduct: (data: {
    code?: string;
    name: string;
    price: number;
    quantity: number;
    minStock: number;
    unit: string;
    entryDate: string;
  }) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (
    productId: string,
    type: "IN" | "OUT",
    amount: number,
    date: string,
    note?: string,
  ) => { success: boolean; message?: string };
}

const PRODUCTS_KEY = "peyman_pn_products";
const LOGS_KEY = "peyman_pn_inventory_logs";

export const getTodayJalali = () =>
  new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

// قطعات پیش‌فرض کارخانه گروه صنعتی پیمان (تولیدکننده قطعات لاستیکی خودرو و صنعتی)
const initialProducts: Product[] = [
  {
    id: "P-101",
    code: "PN-101",
    name: "بوش طبق پراید لاستیکی تقویت‌شده",
    price: 45000,
    quantity: 420,
    minStock: 50,
    unit: "عدد",
    lastEntryDate: "۱۴۰۵/۰۷/۰۵",
    lastExitDate: "۱۴۰۵/۰۷/۰۹",
  },
  {
    id: "P-102",
    code: "PN-102",
    name: "ضربه‌گیر کمک فنر پژو ۴۰۵",
    price: 62000,
    quantity: 0,
    minStock: 30,
    unit: "عدد",
    lastEntryDate: "۱۴۰۵/۰۶/۲۰",
    lastExitDate: "۱۴۰۵/۰۷/۰۸",
  },
  {
    id: "P-103",
    code: "PN-103",
    name: "گردگیر پلوس تیبا و ساینا",
    price: 55000,
    quantity: 18,
    minStock: 25,
    unit: "عدد",
    lastEntryDate: "۱۴۰۵/۰۷/۰۱",
    lastExitDate: "۱۴۰۵/۰۷/۱۰",
  },
  {
    id: "P-104",
    code: "PN-104",
    name: "دسته موتور پایین سمند و پژو",
    price: 185000,
    quantity: 150,
    minStock: 20,
    unit: "عدد",
    lastEntryDate: "۱۴۰۵/۰۷/۰۸",
    lastExitDate: "-",
  },
  {
    id: "P-105",
    code: "PN-105",
    name: "چهارشاخه فرمان لاستیکی پیکان و وانت",
    price: 78000,
    quantity: 95,
    minStock: 20,
    unit: "عدد",
    lastEntryDate: "۱۴۰۵/۰۷/۰۳",
    lastExitDate: "۱۴۰۵/۰۷/۰۷",
  },
];

const loadProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem(PRODUCTS_KEY);
    return saved ? JSON.parse(saved) : initialProducts;
  } catch {
    return initialProducts;
  }
};

const loadLogs = (): InventoryLog[] => {
  try {
    const saved = localStorage.getItem(LOGS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: loadProducts(),
  logs: loadLogs(),

  addProduct: ({ code, name, price, quantity, minStock, unit, entryDate }) => {
    const date = entryDate || getTodayJalali();
    const newProduct: Product = {
      id: `P-${Date.now()}`,
      code: code?.trim() || `PN-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      price: Number(price),
      quantity: Number(quantity),
      minStock: Number(minStock) || 10,
      unit: unit || "عدد",
      lastEntryDate: date,
      lastExitDate: "-",
    };

    const updatedProducts = [newProduct, ...get().products];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

    const updatedLogs = [...get().logs];
    if (quantity > 0) {
      updatedLogs.unshift({
        id: `LOG-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        type: "IN",
        amount: Number(quantity),
        date,
        note: "موجودی اولیه هنگام تعریف قطعه",
      });
      localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
    }

    set({ products: updatedProducts, logs: updatedLogs });
  },

  updateProduct: (id, data) => {
    const updated = get().products.map((p) =>
      p.id === id ? { ...p, ...data } : p,
    );
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
    set({ products: updated });
  },

  deleteProduct: (id) => {
    const updated = get().products.filter((p) => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
    set({ products: updated });
  },

  adjustStock: (productId, type, amount, date, note = "") => {
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      return {
        success: false,
        message: "تعداد وارد شده باید بیشتر از صفر باشد.",
      };
    }

    const products = get().products;
    const target = products.find((p) => p.id === productId);
    if (!target) {
      return { success: false, message: "قطعه مورد نظر در انبار یافت نشد." };
    }

    // بررسی موجودی هنگام خروج از انبار یا صدور فاکتور
    if (type === "OUT" && target.quantity < numAmount) {
      return {
        success: false,
        message: `موجودی انبار کافی نیست! موجودی فعلی «${target.name}» فقط ${target.quantity} ${target.unit} است.`,
      };
    }

    const actionDate = date || getTodayJalali();

    const updatedProducts = products.map((p) => {
      if (p.id !== productId) return p;
      const newQty =
        type === "IN" ? p.quantity + numAmount : p.quantity - numAmount;
      return {
        ...p,
        quantity: newQty,
        lastEntryDate: type === "IN" ? actionDate : p.lastEntryDate,
        lastExitDate: type === "OUT" ? actionDate : p.lastExitDate,
      };
    });

    const newLog: InventoryLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: target.id,
      productName: target.name,
      type,
      amount: numAmount,
      date: actionDate,
      note:
        note ||
        (type === "IN" ? "ورود بار جدید به انبار" : "خروج قطعه از انبار"),
    };

    const updatedLogs = [newLog, ...get().logs];

    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
    localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));

    set({ products: updatedProducts, logs: updatedLogs });
    return { success: true };
  },
}));
