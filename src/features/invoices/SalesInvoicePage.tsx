import React, { useState, useMemo, useEffect } from "react";
import {
  FilePlus2,
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  User,
  History,
  Eye,
  FileText,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
} from "lucide-react";

// ایمپورت‌های تقویم شمسی
import MultiDatePicker from "react-multi-date-picker";
import persianCal from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";

// ================== رفع باگ صفحه سفید (ESM Interop Fix) ==================
const DatePicker = (MultiDatePicker as any).default || MultiDatePicker;
const persian = (persianCal as any).default || persianCal;
const persian_fa = (persianFa as any).default || persianFa;

import { useAuthStore } from "../../store/useAuthStore";
import {
  useInventoryStore,
  type Product,
  getTodayJalali,
} from "../../store/useInventoryStore";
import { useCustomerStore, type Customer } from "../../store/useCustomerStore";
import {
  useInvoiceStore,
  type InvoiceItem,
  type SalesInvoice,
} from "../../store/useInvoiceStore";

// ================== تبدیل عدد به حروف فارسی ==================
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
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
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
    if (rem >= 10 && rem <= 19) {
      res.push(TEENS[rem - 10]);
    } else {
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
// =========================================================================

export const SalesInvoicePage: React.FC = () => {
  const { user } = useAuthStore();
  const { products, adjustStock } = useInventoryStore();
  const { customers, addInvoiceDebt } = useCustomerStore();
  const { invoices, nextInvoiceNo, saveInvoice } = useInvoiceStore();

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const [activeTab, setActiveTab] = useState<"NEW" | "ARCHIVE">("NEW");
  const [printSize, setPrintSize] = useState<"A4" | "A5">("A4");

  const [invoiceNo, setInvoiceNo] = useState(String(nextInvoiceNo));
  const [invoiceDate, setInvoiceDate] = useState(getTodayJalali());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [byPerson, setByPerson] = useState(user?.fullName || "مدیریت");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQty, setItemQty] = useState("1");
  const [itemPrice, setItemPrice] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState("0");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const safeItems = Array.isArray(items) ? items : [];

  useEffect(() => {
    if (activeTab === "NEW") {
      setByPerson(user?.fullName || "مدیریت");
    }
  }, [user, activeTab]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return safeCustomers;
    return safeCustomers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q),
    );
  }, [safeCustomers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return safeProducts;
    return safeProducts.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q),
    );
  }, [safeProducts, productSearch]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerAddress(
      customer.city
        ? `${customer.city}${customer.address ? " - " + customer.address : ""}`
        : customer.address || "",
    );
    setCustomerPhone(customer.phone || "");
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setErrorMsg(null);
  };

  const handleSelectProduct = (product: Product) => {
    setErrorMsg(null);
    setSelectedProduct(product);
    setProductSearch(product.name);
    setItemPrice(String(product.price));
    setShowProductDropdown(false);

    if (product.quantity <= 0) {
      setErrorMsg(
        `خطا: قطعه «${product.name}» در انبار موجود نیست (موجودی: ۰)!`,
      );
    }
  };

  const previewRowTotal = toCleanNumber(itemQty) * toCleanNumber(itemPrice);

  const handleAddItem = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedProduct) {
      setErrorMsg("لطفاً ابتدا یک قطعه را جستجو و انتخاب کنید.");
      return;
    }

    const qty = toCleanNumber(itemQty);
    const price = toCleanNumber(itemPrice);

    if (qty <= 0) {
      setErrorMsg("تعداد قطعه باید حداقل ۱ باشد.");
      return;
    }

    const existingInInvoice = safeItems.find(
      (i) => i.productId === selectedProduct.id,
    );
    const totalRequestedQty = (existingInInvoice?.quantity || 0) + qty;

    if (selectedProduct.quantity === 0) {
      setErrorMsg(`موجودی «${selectedProduct.name}» در انبار تمام شده است!`);
      return;
    }

    if (totalRequestedQty > selectedProduct.quantity) {
      setErrorMsg(
        `تعداد درخواستی (${totalRequestedQty}) بیشتر از موجودی انبار (${selectedProduct.quantity}) است!`,
      );
      return;
    }

    if (existingInInvoice) {
      setItems(
        safeItems.map((i) =>
          i.productId === selectedProduct.id
            ? {
                ...i,
                quantity: totalRequestedQty,
                unitPrice: price,
                totalPrice: totalRequestedQty * price,
              }
            : i,
        ),
      );
    } else {
      setItems([
        ...safeItems,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          unit: selectedProduct.unit,
          quantity: qty,
          unitPrice: price,
          totalPrice: qty * price,
        },
      ]);
    }

    setSelectedProduct(null);
    setProductSearch("");
    setItemQty("1");
    setItemPrice("");
  };

  const handleRemoveItem = (productId: string) => {
    setItems(safeItems.filter((i) => i.productId !== productId));
  };

  const subTotal = useMemo(
    () => safeItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [safeItems],
  );
  const numDiscount = toCleanNumber(discount);
  const finalAmount = Math.max(0, subTotal - numDiscount);

  const finalPersianWords = useMemo(() => {
    if (finalAmount > 0) return amountToPersianLetters(finalAmount);
    if (previewRowTotal > 0) return amountToPersianLetters(previewRowTotal);
    return "";
  }, [finalAmount, previewRowTotal]);

  const handleFinalizeInvoice = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!customerName.trim()) {
      setErrorMsg("لطفاً نام مشتری (صورتحساب شرکت/آقای) را مشخص کنید.");
      return;
    }
    if (safeItems.length === 0) {
      setErrorMsg("فاکتور خالی است! حداقل یک قطعه به فاکتور اضافه کنید.");
      return;
    }

    for (const item of safeItems) {
      const stockItem = safeProducts.find((p) => p.id === item.productId);
      if (!stockItem || stockItem.quantity < item.quantity) {
        setErrorMsg(`موجودی قطعه «${item.productName}» کافی نیست!`);
        return;
      }
    }

    for (const item of safeItems) {
      adjustStock(
        item.productId,
        "OUT",
        item.quantity,
        invoiceDate,
        `فاکتور فروش شماره ${invoiceNo} (${customerName})`,
      );
    }

    if (selectedCustomer && finalAmount > 0) {
      addInvoiceDebt(
        selectedCustomer.id,
        finalAmount,
        invoiceNo,
        invoiceDate,
        `فاکتور فروش ${invoiceNo}`,
      );
    }

    const wordsToSave = amountToPersianLetters(finalAmount);

    saveInvoice({
      invoiceNo,
      date: invoiceDate,
      customerId: selectedCustomer?.id || "",
      customerName: customerName.trim(),
      byPerson: byPerson.trim(),
      customerAddress: customerAddress.trim(),
      customerPhone: customerPhone.trim(),
      items: safeItems,
      subTotal,
      discount: numDiscount,
      finalAmount,
      amountInWords: wordsToSave,
    });

    setSuccessMsg(`فاکتور ${invoiceNo} با موفقیت ثبت شد.`);
  };

  const loadArchivedInvoice = (inv: SalesInvoice) => {
    setInvoiceNo(inv.invoiceNo);
    setInvoiceDate(inv.date);
    setCustomerName(inv.customerName);
    setByPerson(inv.byPerson);
    setCustomerAddress(inv.customerAddress);
    setCustomerPhone(inv.customerPhone);
    setItems(inv.items);
    setDiscount(String(inv.discount));
    setActiveTab("NEW");
  };

  const printableRows = useMemo(() => {
    const totalRows = Math.max(12, safeItems.length);
    return Array.from(
      { length: totalRows },
      (_, index) => safeItems[index] || null,
    );
  }, [safeItems]);

  const handleResetNewInvoice = () => {
    setInvoiceNo(String(nextInvoiceNo));
    setInvoiceDate(getTodayJalali());
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomerName("");
    setByPerson(user?.fullName || "مدیریت");
    setCustomerAddress("");
    setCustomerPhone("");
    setItems([]);
    setDiscount("0");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="space-y-5 sm:space-y-6 relative">
      <style>
        {`
          @media print {
            @page { 
              size: ${printSize === "A4" ? "A4" : "A5"} portrait; 
              margin: 0 !important; 
            }
            body { 
              background: #ffffff !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              margin: 0 !important;
              padding: 0 !important;
            }
            ::-webkit-scrollbar { display: none; }
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            /* جدا کردن کامل کادر فاکتور از بقیه سایت برای پرینت دقیق فیزیکی */
            #print-section {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: ${printSize === "A4" ? "210mm" : "148mm"} !important;
              height: ${printSize === "A4" ? "297mm" : "210mm"} !important;
              max-width: none !important;
              min-width: 0 !important;
              margin: 0 !important;
              padding: 6mm !important;
              box-shadow: none !important;
              border: none !important;
              z-index: 999999 !important;
              background: white !important;
              transform: none !important;
            }
          }
        `}
      </style>

      {/* هدر اصلی */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("NEW")}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === "NEW"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FilePlus2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>صدور فاکتور</span>
            </button>
            <button
              onClick={() => setActiveTab("ARCHIVE")}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === "ARCHIVE"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>آرشیو فاکتورها</span>
            </button>
          </div>

          {activeTab === "NEW" && (
            <button
              onClick={handleResetNewInvoice}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              فاکتور خام جدید
            </button>
          )}
        </div>

        {activeTab === "NEW" && (
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full xl:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 pl-2 pr-1">
                سایز چاپ:
              </span>
              <button
                onClick={() => setPrintSize("A4")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${printSize === "A4" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"}`}
              >
                ورق A4
              </button>
              <button
                onClick={() => setPrintSize("A5")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${printSize === "A5" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"}`}
              >
                ورق A5
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === "ARCHIVE" ? (
        <div className="print:hidden bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm">
          <h3 className="font-black text-slate-900 text-base sm:text-lg mb-4 sm:mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            فاکتورهای ثبت‌شده قبلی
          </h3>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {safeInvoices.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-bold">
                فاکتوری یافت نشد.
              </div>
            ) : (
              safeInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="absolute -left-4 -top-4 opacity-5">
                    <FileText className="w-24 h-24" />
                  </div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        شماره:{" "}
                        <span className="text-blue-600 font-mono text-xs">
                          {inv.invoiceNo}
                        </span>
                      </span>
                      <h4 className="font-black text-slate-800 text-sm">
                        {inv.customerName}
                      </h4>
                      <span className="text-[10px] text-slate-400 block mt-1 font-bold">
                        {inv.date}{" "}
                        <span className="text-slate-300 mx-1">|</span> ثبت توسط:{" "}
                        <span className="text-blue-600">{inv.byPerson}</span>
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="font-black text-emerald-600 text-sm block">
                        {inv.finalAmount.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-[9px] text-slate-400">تومان</span>
                    </div>
                  </div>
                  <button
                    onClick={() => loadArchivedInvoice(inv)}
                    className="w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold flex justify-center items-center gap-2 hover:bg-blue-50 transition-colors relative z-10 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> مشاهده و چاپ مجدد
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs">
                  <th className="py-3 px-3">شماره فاکتور</th>
                  <th className="py-3 px-3">تاریخ</th>
                  <th className="py-3 px-3">مشتری</th>
                  <th className="py-3 px-3 text-center">ثبت کننده</th>
                  <th className="py-3 px-3 text-center">مبلغ به حروف</th>
                  <th className="py-3 px-3 text-left">مبلغ کل (تومان)</th>
                  <th className="py-3 px-3 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-400 font-medium"
                    >
                      هنوز فاکتوری ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  safeInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-3 font-black text-blue-600 font-mono">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-4 px-3 text-xs text-slate-500">
                        {inv.date}
                      </td>
                      <td className="py-4 px-3 font-bold text-slate-900">
                        {inv.customerName}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          {inv.byPerson}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center text-xs font-bold text-emerald-700">
                        {amountToPersianLetters(inv.finalAmount)}
                      </td>
                      <td className="py-4 px-3 text-left font-black text-slate-900">
                        {inv.finalAmount.toLocaleString("fa-IR")}
                      </td>
                      <td className="py-4 px-3 text-left">
                        <button
                          onClick={() => loadArchivedInvoice(inv)}
                          className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> بارگذاری
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="w-full print:block">
          {errorMsg && (
            <div className="print:hidden mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm font-black shadow-sm animate-pulse">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="print:hidden mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-800 text-sm font-bold shadow-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold transition-all hover:bg-emerald-700 w-full sm:w-auto text-center cursor-pointer"
              >
                چاپ فوری فاکتور
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
            {/* فرم‌ها */}
            <div className="xl:col-span-5 space-y-5 flex flex-col print:hidden">
              <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2 mb-5">
                  <User className="w-5 h-5 text-blue-600" />
                  اطلاعات مشتری و سربرگ
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={customerSearch}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCustomerName(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      placeholder="جستجوی مشتری از سیستم..."
                      className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-52 overflow-y-auto hide-scrollbar">
                        {filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            className="p-3.5 border-b border-slate-50 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                          >
                            <div>
                              <span className="font-black text-slate-900 text-sm block">
                                {c.name}
                              </span>
                              <span className="text-xs text-slate-500 block mt-0.5">
                                {c.city} - {c.phone}
                              </span>
                            </div>
                            {c.balance > 0 && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                                بدهکار
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> شماره فاکتور
                      </label>
                      <input
                        type="text"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-black text-rose-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> تاریخ (شمسی)
                      </label>
                      <div className="relative z-40">
                        <DatePicker
                          calendar={persian}
                          locale={persian_fa}
                          value={invoiceDate}
                          onChange={(date: any) =>
                            setInvoiceDate(
                              date?.format?.("YYYY/MM/DD") || getTodayJalali(),
                            )
                          }
                          containerClassName="w-full"
                          inputClass="w-full px-3 py-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> آدرس خریدار
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="شهر و آدرس دقیق..."
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> تلفن خریدار
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="09..."
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2 mb-5">
                  <Search className="w-5 h-5 text-emerald-600" />
                  افزودن قطعات به فاکتور
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={productSearch}
                      onFocus={() => setShowProductDropdown(true)}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      placeholder="جستجوی نام یا کد قطعه..."
                      className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    {showProductDropdown && filteredProducts.length > 0 && (
                      <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-52 overflow-y-auto hide-scrollbar">
                        {filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            className="p-3.5 border-b border-slate-50 hover:bg-emerald-50 cursor-pointer transition-colors flex justify-between items-center"
                          >
                            <div>
                              <span className="font-black text-slate-900 text-sm block">
                                {p.name}
                              </span>
                              <span className="text-xs text-slate-500 block mt-0.5">
                                فی: {p.price.toLocaleString("fa-IR")} ت
                              </span>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-md text-[10px] font-black ${p.quantity === 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"}`}
                            >
                              {p.quantity === 0
                                ? "ناموجود"
                                : `موجودی: ${p.quantity}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5">
                        تعداد درخواستی
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-center focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5">
                        قیمت واحد (تومان)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-emerald-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span>افزودن به سبد فاکتور</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl text-white">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                      <CreditCard className="w-4 h-4" /> اعمال تخفیف (تومان)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-black text-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="block text-[11px] text-slate-400 mb-1">
                      مبلغ نهایی قابل پرداخت:
                    </span>
                    <div className="text-3xl font-black text-emerald-400 tracking-tight">
                      {finalAmount.toLocaleString("fa-IR")}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        تومان
                      </span>
                    </div>
                    {finalPersianWords && (
                      <div className="text-xs text-slate-300 mt-2 font-bold leading-relaxed">
                        {finalPersianWords}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleFinalizeInvoice}
                    className="w-full mt-4 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base font-black shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ثبت نهایی و کسر از انبار</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================= پیش‌نمایش زنده فاکتور (تنها بخشی که چاپ می‌شود) ================= */}
            <div className="xl:col-span-7 flex flex-col pb-10 print:block print:pb-0 print:w-full print:m-0 print:p-0">
              <div className="w-full overflow-x-auto hide-scrollbar bg-slate-200/50 p-4 sm:p-6 lg:p-8 rounded-3xl border border-slate-200 print:bg-transparent print:border-none print:p-0 print:rounded-none">
                {/* جلوگیری از بریدگی و اسکرول در مانیتورهای کوچک */}
                <div className="min-w-fit flex justify-center print:block print:min-w-0">
                  <div
                    id="print-section"
                    className={`invoice-print-area bg-white text-slate-900 shadow-2xl relative transition-all duration-300 ease-in-out w-full mx-auto ${
                      printSize === "A5" ? "max-w-[480px]" : "max-w-[720px]"
                    }`}
                  >
                    <div className="border-2 border-slate-900 w-full h-full flex flex-col p-3 sm:p-5 relative z-10 rounded-xl print:rounded-none print:p-0">
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
                        <img
                          src="/logo.png"
                          alt="PN Gear Watermark"
                          className={`${printSize === "A5" ? "w-64 h-64" : "w-[400px] h-[400px]"} object-contain opacity-[0.06] mix-blend-multiply`}
                        />
                      </div>

                      <div className="relative z-10 flex items-start justify-between gap-2 pb-4 border-b-2 border-slate-900">
                        <div className="flex items-center gap-3">
                          <img
                            src="/logo.png"
                            alt="PN"
                            className={`${printSize === "A5" ? "w-16 h-16" : "w-24 h-24"} object-contain mix-blend-multiply shrink-0`}
                          />
                          <div>
                            <h1
                              className={`${printSize === "A5" ? "text-xl" : "text-3xl"} font-black text-slate-900 tracking-tight`}
                            >
                              گروه صنعتی پیمان
                            </h1>
                            <div
                              className={`${printSize === "A5" ? "text-sm" : "text-base"} font-black text-slate-800 mt-0.5`}
                            >
                              «حسنی»
                            </div>
                            <p className="text-[11px] sm:text-xs font-bold text-slate-700 mt-1">
                              تولید کننده انواع قطعات لاستیکی خودرو و صنعتی
                            </p>
                          </div>
                        </div>

                        <div className="text-left flex flex-col items-end justify-between space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">
                              شماره:
                            </span>
                            <span className="text-xl font-black text-rose-700 font-mono tracking-wider">
                              {invoiceNo || "---"}
                            </span>
                          </div>
                          <div className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight text-left border-r-2 border-slate-800 pr-2">
                            <div>همراه: ۰۹۱۲۶۹۶۶۹۲۳</div>
                            <div>۰۹۱۲۹۶۳۱۶۲۱</div>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 my-4 space-y-2.5 text-xs">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-8 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 bg-white/80">
                            <span className="font-black text-slate-800 shrink-0">
                              صورتحساب شرکت/آقای:
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {customerName ||
                                "..................................................."}
                            </span>
                          </div>
                          <div className="col-span-4 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 bg-white/80">
                            <span className="font-black text-slate-800 shrink-0">
                              تاریخ:
                            </span>
                            <span className="font-bold text-slate-900">
                              {invoiceDate}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-8 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 bg-white/80">
                            <span className="font-black text-slate-800 shrink-0">
                              آدرس:
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {customerAddress ||
                                "..................................................."}
                            </span>
                          </div>
                          <div className="col-span-4 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 bg-white/80">
                            <span className="font-black text-slate-800 shrink-0">
                              تلفن:
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {customerPhone || "..................."}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 border-2 border-slate-900 rounded-lg overflow-hidden flex-1 flex flex-col">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-100/90 border-b-2 border-slate-900 text-slate-900 text-xs">
                              <th className="py-2.5 px-2 border-l border-slate-800 w-10 text-center font-black">
                                ردیف
                              </th>
                              <th className="py-2.5 px-3 border-l border-slate-800 font-black text-center">
                                شـــــرح کـــــالا
                              </th>
                              <th className="py-2.5 px-2 border-l border-slate-800 w-20 text-center font-black">
                                تعداد
                              </th>
                              <th className="py-2.5 px-2 border-l border-slate-800 w-28 text-center font-black">
                                قیمت واحد
                              </th>
                              <th className="py-2.5 px-3 w-32 text-center font-black">
                                مبلغ کل
                              </th>
                              <th className="print:hidden py-2 px-2 w-10 text-center font-black border-r border-slate-800 bg-rose-50 text-rose-700">
                                حذف
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-400 text-xs flex-1">
                            {printableRows.map((rowItem, index) => (
                              <tr key={index} className="h-8 group">
                                <td className="py-1.5 px-2 border-l border-slate-800 text-center font-black text-slate-800">
                                  {rowItem
                                    ? (index + 1).toLocaleString("fa-IR")
                                    : ""}
                                </td>
                                <td className="py-1.5 px-3 border-l border-slate-800 font-bold text-slate-900">
                                  {rowItem ? rowItem.productName : ""}
                                </td>
                                <td className="py-1.5 px-2 border-l border-slate-800 text-center font-bold">
                                  {rowItem
                                    ? `${rowItem.quantity.toLocaleString("fa-IR")} ${rowItem.unit}`
                                    : ""}
                                </td>
                                <td className="py-1.5 px-2 border-l border-slate-800 text-center font-bold">
                                  {rowItem
                                    ? rowItem.unitPrice.toLocaleString("fa-IR")
                                    : ""}
                                </td>
                                <td className="py-1.5 px-3 text-center font-black text-slate-900">
                                  {rowItem
                                    ? rowItem.totalPrice.toLocaleString("fa-IR")
                                    : ""}
                                </td>
                                <td className="print:hidden py-1.5 px-2 text-center border-r border-slate-300 bg-slate-50 group-hover:bg-rose-50 transition-colors">
                                  {rowItem && (
                                    <button
                                      onClick={() =>
                                        handleRemoveItem(rowItem.productId)
                                      }
                                      className="text-rose-400 hover:text-rose-600 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 mx-auto" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="relative z-10 mt-3 grid grid-cols-12 gap-2 items-stretch text-xs">
                        <div className="col-span-7 border-2 border-slate-900 rounded-lg p-3 flex flex-col justify-between bg-white/80">
                          <div className="flex items-center justify-between border-b border-dotted border-slate-400 pb-2">
                            <span className="font-black text-slate-900 leading-relaxed">
                              مبلغ کل به حروف: <br />
                              <span className="font-black text-slate-800 text-sm">
                                {finalPersianWords ||
                                  "......................................................................"}
                              </span>
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 pb-1 text-center font-black text-slate-800">
                            <div>امضاء فروشنده</div>
                            <div>امضاء خریدار</div>
                          </div>
                        </div>

                        <div className="col-span-5 border-2 border-slate-900 rounded-lg overflow-hidden bg-white/80 flex flex-col">
                          <div className="grid grid-cols-12 border-b border-slate-800 py-2.5 px-3 flex-1 items-center">
                            <span className="col-span-5 font-black text-slate-900 border-l border-slate-800">
                              جمع کل
                            </span>
                            <span className="col-span-7 text-left font-bold text-slate-900">
                              {subTotal.toLocaleString("fa-IR")}
                            </span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-800 py-2.5 px-3 flex-1 items-center">
                            <span className="col-span-5 font-black text-slate-900 border-l border-slate-800">
                              تخفیف
                            </span>
                            <span className="col-span-7 text-left font-bold text-slate-900">
                              {numDiscount.toLocaleString("fa-IR")}
                            </span>
                          </div>
                          <div className="grid grid-cols-12 py-3 px-3 bg-slate-200/80 flex-1 items-center">
                            <span className="col-span-5 font-black text-slate-900 border-l border-slate-800">
                              قیمت نهایی
                            </span>
                            <span className="col-span-7 text-left font-black text-slate-900 text-sm">
                              {finalAmount.toLocaleString("fa-IR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
