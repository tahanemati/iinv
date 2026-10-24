import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  X,
  Calendar,
  Tag,
  Layers,
} from "lucide-react";
import {
  useInventoryStore,
  type Product,
  getTodayJalali,
} from "../../store/useInventoryStore";

export const InventoryPage: React.FC = () => {
  const {
    products,
    logs,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  } = useInventoryStore();

  // استیت‌های جستجو و فیلتر
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "AVAILABLE" | "LOW" | "OUT"
  >("ALL");
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "LOGS">("PRODUCTS");

  // مودال تعریف / ویرایش قطعه
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formMinStock, setFormMinStock] = useState("20");
  const [formUnit, setFormUnit] = useState("عدد");
  const [formDate, setFormDate] = useState(getTodayJalali());
  const [formError, setFormError] = useState<string | null>(null);

  // مودال ثبت ورود / خروج موجودی
  const [stockModal, setStockModal] = useState<{
    isOpen: boolean;
    product: Product | null;
    type: "IN" | "OUT";
  }>({ isOpen: false, product: null, type: "IN" });
  const [stockAmount, setStockAmount] = useState("");
  const [stockDate, setStockDate] = useState(getTodayJalali());
  const [stockNote, setStockNote] = useState("");
  const [stockError, setStockError] = useState<string | null>(null);

  // ================= مودال اختصاصی تایید حذف =================
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });

  // فیلتر کردن قطعات
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "AVAILABLE") return p.quantity > p.minStock;
      if (statusFilter === "LOW")
        return p.quantity > 0 && p.quantity <= p.minStock;
      if (statusFilter === "OUT") return p.quantity === 0;
      return true;
    });
  }, [products, searchTerm, statusFilter]);

  // آمار انبار
  const stats = useMemo(() => {
    const totalTypes = products.length;
    const totalCount = products.reduce((acc, p) => acc + p.quantity, 0);
    const outOfStock = products.filter((p) => p.quantity === 0).length;
    const totalValue = products.reduce(
      (acc, p) => acc + p.quantity * p.price,
      0,
    );
    return { totalTypes, totalCount, outOfStock, totalValue };
  }, [products]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormCode(`PN-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormPrice("");
    setFormQty("");
    setFormMinStock("20");
    setFormUnit("عدد");
    setFormDate(getTodayJalali());
    setFormError(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormCode(product.code);
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormQty(String(product.quantity));
    setFormMinStock(String(product.minStock));
    setFormUnit(product.unit);
    setFormDate(product.lastEntryDate);
    setFormError(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formPrice) {
      setFormError("لطفاً نام قطعه و قیمت واحد را وارد نمایید.");
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        code: formCode,
        name: formName.trim(),
        price: Number(formPrice),
        minStock: Number(formMinStock) || 10,
        unit: formUnit,
      });
    } else {
      addProduct({
        code: formCode,
        name: formName,
        price: Number(formPrice),
        quantity: Number(formQty) || 0,
        minStock: Number(formMinStock) || 10,
        unit: formUnit,
        entryDate: formDate,
      });
    }

    setIsProductModalOpen(false);
  };

  const openStockAdjustment = (product: Product, type: "IN" | "OUT") => {
    setStockModal({ isOpen: true, product, type });
    setStockAmount("");
    setStockDate(getTodayJalali());
    setStockNote("");
    setStockError(null);
  };

  const handleConfirmStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModal.product) return;

    const result = adjustStock(
      stockModal.product.id,
      stockModal.type,
      Number(stockAmount),
      stockDate,
      stockNote,
    );

    if (!result.success && result.message) {
      setStockError(result.message);
      return;
    }

    setStockModal({ isOpen: false, product: null, type: "IN" });
  };

  const confirmDeleteProduct = () => {
    if (deleteModal.product) {
      deleteProduct(deleteModal.product.id);
      setDeleteModal({ isOpen: false, product: null });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      {/* هدر صفحه */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <span>مدیریت انبار قطعات</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1">
            تعریف قطعات، قیمت پایه فاکتور، ثبت ورودی/خروجی و کنترل موجودی
          </p>
        </div>

        <button
          onClick={openNewProductModal}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف قطعه جدید در انبار</span>
        </button>
      </div>

      {/* ۴ کارت خلاصه وضعیت (موبایل ۲در۲) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              تنوع قطعات
            </span>
            <span className="text-sm sm:text-lg font-black text-slate-900 block truncate">
              {stats.totalTypes.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-normal text-slate-500">
                نوع
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              کل موجودی
            </span>
            <span className="text-sm sm:text-lg font-black text-slate-900 block truncate">
              {stats.totalCount.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-normal text-slate-500">
                عدد
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              قطعات ناموجود
            </span>
            <span className="text-sm sm:text-lg font-black text-rose-600 block truncate">
              {stats.outOfStock.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] sm:text-xs font-normal text-slate-500">
                مورد
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block truncate">
              ارزش کل انبار
            </span>
            <span
              className="text-sm sm:text-lg font-black text-slate-900 block truncate"
              title={`${stats.totalValue.toLocaleString("fa-IR")} تومان`}
            >
              {stats.totalValue.toLocaleString("fa-IR")}
            </span>
          </div>
        </div>
      </div>

      {/* نوار تب‌ها و فیلترها */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* تب‌ها */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full lg:w-fit overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab("PRODUCTS")}
              className={`flex-1 lg:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex justify-center items-center gap-1.5 ${
                activeTab === "PRODUCTS"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>لیست قطعات</span>
            </button>
            <button
              onClick={() => setActiveTab("LOGS")}
              className={`flex-1 lg:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex justify-center items-center gap-1.5 ${
                activeTab === "LOGS"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-4 h-4" />
              <span>تاریخچه ({logs.length.toLocaleString("fa-IR")})</span>
            </button>
          </div>

          {/* فیلتر وضعیت */}
          {activeTab === "PRODUCTS" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
              {[
                { key: "ALL", label: "همه" },
                { key: "AVAILABLE", label: "موجود" },
                { key: "LOW", label: "رو به اتمام" },
                { key: "OUT", label: "ناموجود" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setStatusFilter(item.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === item.key
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* سرچ سریع */}
        {activeTab === "PRODUCTS" && (
          <div className="relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام یا کد قطعه..."
              className="w-full pr-10 pl-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        )}

        {/* ================= نمایش لیست قطعات (موبایل: کارت / دسکتاپ: جدول) ================= */}
        {activeTab === "PRODUCTS" ? (
          <>
            {/* نسخه موبایل (کارت‌ها) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
              {filteredProducts.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 py-10 text-center text-slate-400 text-xs">
                  هیچ قطعه‌ای یافت نشد.
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isOut = product.quantity === 0;
                  const isLow =
                    product.quantity > 0 &&
                    product.quantity <= product.minStock;

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1">
                            {product.code}
                          </span>
                          <h3
                            className="font-black text-slate-800 text-sm line-clamp-2 leading-tight"
                            title={product.name}
                          >
                            {product.name}
                          </h3>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] ${
                            isOut
                              ? "bg-rose-100 text-rose-700"
                              : isLow
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <span>{product.quantity}</span>
                          <span className="text-[9px] font-normal">
                            {product.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-500">قیمت واحد:</span>
                        <span className="font-black text-blue-700">
                          {product.price.toLocaleString("fa-IR")} ت
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mt-1">
                        <button
                          onClick={() => openStockAdjustment(product, "IN")}
                          className="col-span-1 flex justify-center items-center py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="ورود به انبار"
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                        </button>
                        <button
                          disabled={isOut}
                          onClick={() => openStockAdjustment(product, "OUT")}
                          className="col-span-1 flex justify-center items-center py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
                          title="خروج از انبار"
                        >
                          <ArrowUpFromLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditProductModal(product)}
                          className="col-span-1 flex justify-center items-center py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModal({ isOpen: true, product })
                          }
                          className="col-span-1 flex justify-center items-center py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* نسخه دسکتاپ (جدول) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-xs">
                    <th className="py-3.5 px-3 font-bold">کد قطعه</th>
                    <th className="py-3.5 px-3 font-bold">نام قطعه</th>
                    <th className="py-3.5 px-3 font-bold">قیمت (تومان)</th>
                    <th className="py-3.5 px-3 font-bold text-center">
                      موجودی
                    </th>
                    <th className="py-3.5 px-3 font-bold text-center hidden lg:table-cell">
                      وضعیت
                    </th>
                    <th className="py-3.5 px-3 font-bold text-center">
                      ورود / خروج
                    </th>
                    <th className="py-3.5 px-3 font-bold text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-slate-400"
                      >
                        هیچ قطعه‌ای یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isOut = product.quantity === 0;
                      const isLow =
                        product.quantity > 0 &&
                        product.quantity <= product.minStock;

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-4 px-3 font-mono text-xs font-bold text-slate-500">
                            {product.code}
                          </td>
                          <td
                            className="py-4 px-3 font-black text-slate-900 max-w-[200px] xl:max-w-[300px] truncate"
                            title={product.name}
                          >
                            {product.name}
                          </td>
                          <td className="py-4 px-3 font-bold text-blue-700">
                            {product.price.toLocaleString("fa-IR")}
                          </td>
                          <td className="py-4 px-3 text-center">
                            <span
                              className={`inline-block font-black text-base ${isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900"}`}
                            >
                              {product.quantity.toLocaleString("fa-IR")}
                            </span>{" "}
                            <span className="text-xs text-slate-400">
                              {product.unit}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-center hidden lg:table-cell">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                <XCircle className="w-3 h-3" /> ناموجود
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" /> رو به
                                اتمام
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> موجود
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  openStockAdjustment(product, "IN")
                                }
                                title="ورود به انبار"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" /> ورود
                                +
                              </button>
                              <button
                                disabled={isOut}
                                onClick={() =>
                                  openStockAdjustment(product, "OUT")
                                }
                                title="خروج از انبار"
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowUpFromLine className="w-3.5 h-3.5" /> خروج
                                -
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-left">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => openEditProductModal(product)}
                                title="ویرایش"
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({ isOpen: true, product })
                                }
                                title="حذف"
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
          </>
        ) : (
          /* ================= نمایش تاریخچه ================= */
          <>
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {logs.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  تراکنشی ثبت نشده است.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex justify-between items-center"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold mb-1 ${log.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {log.type === "IN" ? (
                          <ArrowDownToLine className="w-3 h-3" />
                        ) : (
                          <ArrowUpFromLine className="w-3 h-3" />
                        )}
                        {log.type === "IN" ? "ورود" : "خروج"}
                      </span>
                      <h4
                        className="font-black text-slate-800 text-xs truncate"
                        title={log.productName}
                      >
                        {log.productName}
                      </h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {log.date} • {log.note || "-"}
                      </span>
                    </div>
                    <div
                      className={`font-black text-sm shrink-0 pl-2 ${log.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {log.type === "IN" ? "+" : "-"}
                      {log.amount}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-xs">
                    <th className="py-3.5 px-3 font-bold w-32">نوع عملیات</th>
                    <th className="py-3.5 px-3 font-bold">نام قطعه</th>
                    <th className="py-3.5 px-3 font-bold text-center w-24">
                      تعداد
                    </th>
                    <th className="py-3.5 px-3 font-bold text-center w-32">
                      تاریخ
                    </th>
                    <th className="py-3.5 px-3 font-bold">توضیحات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-slate-400"
                      >
                        تراکنشی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-3">
                          {log.type === "IN" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700">
                              <ArrowDownToLine className="w-3.5 h-3.5" /> ورود
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-600">
                              <ArrowUpFromLine className="w-3.5 h-3.5" /> خروج
                            </span>
                          )}
                        </td>
                        <td
                          className="py-3.5 px-3 font-bold text-slate-800 max-w-[200px] truncate"
                          title={log.productName}
                        >
                          {log.productName}
                        </td>
                        <td className="py-3.5 px-3 text-center font-black">
                          <span
                            className={
                              log.type === "IN"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }
                          >
                            {log.type === "IN" ? "+" : "-"}
                            {log.amount.toLocaleString("fa-IR")}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-xs text-slate-500">
                          {log.date}
                        </td>
                        <td
                          className="py-3.5 px-3 text-xs text-slate-500 truncate max-w-[150px]"
                          title={log.note}
                        >
                          {log.note || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ================= مودال اختصاصی تایید حذف قطعه ================= */}
      {deleteModal.isOpen && deleteModal.product && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 sm:p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center border-4 border-rose-100">
                <Trash2 className="w-7 h-7 text-rose-500" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
                  حذف قطعه از انبار
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed px-2">
                  آیا از حذف قطعه <br />
                  <span className="font-bold text-slate-900 text-base">
                    «{deleteModal.product.name}»
                  </span>
                  <br /> اطمینان دارید؟
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-[11px] font-bold text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  این عملیات غیرقابل بازگشت است!
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-7 pt-5 border-t border-slate-100">
              <button
                onClick={() => setDeleteModal({ isOpen: false, product: null })}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
              >
                بله، حذف کن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال ۱: تعریف و ویرایش قطعه ================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-5 sm:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-5 sm:mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {editingProduct ? "ویرایش قطعه" : "تعریف قطعه جدید"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    کد قطعه
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    نام قطعه *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثلاً: بوش طبق پراید لاستیکی"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    قیمت واحد (تومان) *
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    واحد شمارش
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:border-blue-600 focus:outline-none"
                  >
                    <option value="عدد">عدد</option>
                    <option value="بسته">بسته</option>
                    <option value="کارتن">کارتن</option>
                    <option value="کیسه">کیسه</option>
                    <option value="دست">دست</option>
                  </select>
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-2">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                      موجودی اولیه
                    </label>
                    <input
                      type="number"
                      value={formQty}
                      onChange={(e) => setFormQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                      هشدار حداقل
                    </label>
                    <input
                      type="number"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                      تاریخ ورود
                    </label>
                    <input
                      type="text"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold w-full sm:w-auto cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 w-full sm:w-auto cursor-pointer"
                >
                  {editingProduct ? "ذخیره تغییرات" : "افزودن به انبار"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= مودال ۲: ورود/خروج قطعه ================= */}
      {stockModal.isOpen && stockModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm sm:max-w-md p-5 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                {stockModal.type === "IN" ? (
                  <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowUpFromLine className="w-5 h-5 text-amber-600" />
                )}
                {stockModal.type === "IN" ? "ثبت ورود (+)" : "ثبت خروج (-)"}
              </h3>
              <button
                onClick={() =>
                  setStockModal({ isOpen: false, product: null, type: "IN" })
                }
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 mb-5">
              <p
                className="text-sm font-black text-slate-800 line-clamp-1"
                title={stockModal.product.name}
              >
                {stockModal.product.name}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                موجودی فعلی:{" "}
                <span className="font-black text-blue-600">
                  {stockModal.product.quantity.toLocaleString("fa-IR")}{" "}
                  {stockModal.product.unit}
                </span>
              </p>
            </div>

            {stockError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                {stockError}
              </div>
            )}

            <form onSubmit={handleConfirmStockAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    تعداد *
                  </label>
                  <input
                    type="number"
                    autoFocus
                    value={stockAmount}
                    onChange={(e) => setStockAmount(e.target.value)}
                    placeholder="مثال: 50"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                    تاریخ
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={stockDate}
                      onChange={(e) => setStockDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:border-blue-600 focus:outline-none"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">
                  توضیحات (اختیاری)
                </label>
                <input
                  type="text"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  placeholder={
                    stockModal.type === "IN"
                      ? "تولید شیفت صبح"
                      : "حواله خروج دستی"
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setStockModal({ isOpen: false, product: null, type: "IN" })
                  }
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer ${stockModal.type === "IN" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"}`}
                >
                  {stockModal.type === "IN"
                    ? "افزودن به موجودی"
                    : "کسر از موجودی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
