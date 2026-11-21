"use client";

import React, { useState } from "react";
import {
  Package,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Filter,
  History,
  TrendingUp,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import { updateProductPriceAction } from "@/server/actions/products";

interface MockProduct {
  id: string;
  code: string;
  name_ar: string;
  category: string;
  base_unit: string;
  current_sale_price: number;
  replacement_cost: number;
  stock_qty: number;
  min_reorder_qty: number;
  is_active: boolean;
  specs?: string;
}

const initialProducts: MockProduct[] = [
  {
    id: "p0000000-0000-0000-0000-000000000001",
    code: "PRD-CEM-SWD",
    name_ar: "أسمنت السويدي مقاوم 42.5",
    category: "أسمنت ومواد رابطة",
    base_unit: "شيكارة",
    current_sale_price: 145.0,
    replacement_cost: 138.0,
    stock_qty: 120,
    min_reorder_qty: 200,
    is_active: true,
    specs: "وزن الشيكارة 50 كجم — 1 طن = 20 شيكارة",
  },
  {
    id: "p0000000-0000-0000-0000-000000000002",
    code: "PRD-STL-EZZ-10",
    name_ar: "حديد تسليح عز 10 مم مشرشر أطوال",
    category: "حديد تسليح",
    base_unit: "طن",
    current_sale_price: 42500.0,
    replacement_cost: 41200.0,
    stock_qty: 4.0,
    min_reorder_qty: 15.0,
    is_active: true,
    specs: "قطر 10 مم — وزن اسمي 0.617 كجم/م",
  },
  {
    id: "p0000000-0000-0000-0000-000000000003",
    code: "PRD-STL-EZZ-12",
    name_ar: "حديد تسليح عز 12 مم مشرشر أطوال",
    category: "حديد تسليح",
    base_unit: "طن",
    current_sale_price: 42300.0,
    replacement_cost: 41000.0,
    stock_qty: 28.5,
    min_reorder_qty: 20.0,
    is_active: true,
    specs: "قطر 12 مم — وزن اسمي 0.888 كجم/م",
  },
  {
    id: "p0000000-0000-0000-0000-000000000004",
    code: "PRD-AGG-SND-01",
    name_ar: "رمل محاجر حرش مغسول",
    category: "رمل وزلط ومحاجر",
    base_unit: "متر مكعب",
    current_sale_price: 180.0,
    replacement_cost: 140.0,
    stock_qty: 15.0,
    min_reorder_qty: 50.0,
    is_active: true,
    specs: "سائب بالمتر المكعب — توريد مقالع",
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<MockProduct | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [priceType, setPriceType] = useState<"SALE_PRICE" | "REPLACEMENT_COST">("SALE_PRICE");
  const [priceReason, setPriceReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Categories
  const categories = ["الكل", "أسمنت ومواد رابطة", "حديد تسليح", "رمل وزلط ومحاجر", "طوب بناء"];

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "الكل" || p.category === selectedCategory;
    const matchesSearch =
      p.name_ar.includes(searchQuery) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenPriceModal = (prod: MockProduct) => {
    setEditingProduct(prod);
    setNewPrice(prod.current_sale_price.toString());
    setPriceType("SALE_PRICE");
    setPriceReason("");
    setFeedbackMsg(null);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert("يرجى إدخال سعر صحيح أكبر من أو يساوي الصفر");
      return;
    }

    if (!priceReason.trim()) {
      alert("يرجى كتابة سبب تغيير السعر لتوثيقه في سجل التدقيق وسجل الأسعار");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProductPriceAction({
        productId: editingProduct.id,
        priceType,
        newPrice: parsedPrice,
        reason: priceReason,
      });

      // Update local state for immediate feedback
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === editingProduct.id) {
            return {
              ...p,
              current_sale_price:
                priceType === "SALE_PRICE" ? parsedPrice : p.current_sale_price,
              replacement_cost:
                priceType === "REPLACEMENT_COST" ? parsedPrice : p.replacement_cost,
            };
          }
          return p;
        })
      );

      setFeedbackMsg(`تم تحديث السعر بنجاح وتوثيقه في سجل الأسعار التاريخي.`);
      setTimeout(() => {
        setEditingProduct(null);
        setFeedbackMsg(null);
      }, 1400);
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="المنتجات والتسعير" breadcrumb="المنتجات">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            دليل الأصناف والأسعار الحالية
          </h1>
          <p className="text-muted text-xs mt-1">
            إدارة مواد البناء، الوحدات ومعاملات التحويل، وسجل الأسعار وتكلفة الاستبدال المقدرة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="default">
            <PlusCircle className="w-4 h-4" />
            <span>صنف جديد</span>
          </Button>
          <Button variant="soft" size="default">
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي الأصناف المسجلة"
          value={products.length}
          subtitle="4 تصنيفات رئيسية"
          icon={<Package className="w-5 h-5 text-brand" />}
        />
        <StatCard
          title="أصناف نشطة ومتاحة"
          value={products.filter((p) => p.is_active).length}
          subtitle="متاحة في فواتير البيع"
          icon={<CheckCircle2 className="w-5 h-5 text-status-green" />}
        />
        <StatCard
          title="أصناف تحت حد الطلب"
          value={products.filter((p) => p.stock_qty <= p.min_reorder_qty).length}
          subtitle="تتطلب إصدار أوامر شراء"
          icon={<AlertTriangle className="w-5 h-5 text-status-amber" />}
        />
        <StatCard
          title="قيمة المخزون المقدرة"
          value={formatCurrency(1398000)}
          subtitle="حسب تكلفة الاستبدال الحالية"
          icon={<Boxes className="w-5 h-5 text-status-blue" />}
        />
      </div>

      {/* Invariant Alert Note */}
      <div className="mb-6 p-3 bg-white border border-border rounded-card flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-muted">
          <History className="w-4 h-4 text-brand" />
          <span>
            سجل الأسعار: أي تغيير في سعر البيع أو سعر المصنع بيتسجل تلقائياً ومبيأثرش على أي فواتير قديمة اتباعت.
          </span>
        </div>
        <span className="text-status-green font-bold text-[11px] bg-status-green-bg px-2.5 py-1 rounded-full">
          تسجيل تلقائي ✓
        </span>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-surface border border-border rounded-card p-4 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Categories Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-element text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-brand text-white shadow-btn"
                    : "bg-[#f8fafc] text-muted hover:text-foreground border border-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الكود..."
              className="w-full bg-[#f8fafc] border border-border rounded-element py-1.5 pr-8 pl-3 text-xs outline-none focus:border-brand transition-colors"
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#f8fafc] text-muted border-b border-border">
                <th className="py-3 px-4 font-bold">كود الصنف</th>
                <th className="py-3 px-4 font-bold">اسم المادة والمواصفات</th>
                <th className="py-3 px-4 font-bold">التصنيف</th>
                <th className="py-3 px-4 font-bold">وحدة الأساس</th>
                <th className="py-3 px-4 font-bold">سعر البيع الحالي</th>
                <th className="py-3 px-4 font-bold">تكلفة الاستبدال</th>
                <th className="py-3 px-4 font-bold">الرصيد المتاح</th>
                <th className="py-3 px-4 font-bold">حد الطلب</th>
                <th className="py-3 px-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock_qty <= p.min_reorder_qty;
                return (
                  <tr key={p.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-foreground">{p.code}</td>
                    <td className="py-3.5 px-4">
                      <strong className="block text-foreground font-bold">{p.name_ar}</strong>
                      {p.specs && <span className="text-[11px] text-muted">{p.specs}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-muted">{p.category}</td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">{p.base_unit}</td>
                    <td className="py-3.5 px-4 font-extrabold text-brand">
                      {formatCurrency(p.current_sale_price)}
                    </td>
                    <td className="py-3.5 px-4 text-muted">
                      {formatCurrency(p.replacement_cost)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          isLowStock ? "text-status-red" : "text-status-green"
                        }`}
                      >
                        {formatQuantity(p.stock_qty, p.base_unit)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted">
                      {formatQuantity(p.min_reorder_qty, p.base_unit)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenPriceModal(p)}
                        >
                          <span>تعديل السعر</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Update Modal Dialog */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 left-4 text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-foreground mb-1">
              تحديث سعر الصنف
            </h3>
            <p className="text-xs text-muted mb-4">{editingProduct.name_ar}</p>

            {feedbackMsg ? (
              <div className="p-3 bg-status-green-bg border border-[#c2ebd5] rounded-element text-status-green text-xs font-bold text-center">
                {feedbackMsg}
              </div>
            ) : (
              <form onSubmit={handleSavePrice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    نوع السعر المراد تحديثه
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPriceType("SALE_PRICE");
                        setNewPrice(editingProduct.current_sale_price.toString());
                      }}
                      className={`p-2 rounded-element text-xs font-bold border transition-colors ${
                        priceType === "SALE_PRICE"
                          ? "bg-brand text-white border-brand"
                          : "bg-[#f8fafc] text-muted border-border"
                      }`}
                    >
                      سعر البيع الحالي
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPriceType("REPLACEMENT_COST");
                        setNewPrice(editingProduct.replacement_cost.toString());
                      }}
                      className={`p-2 rounded-element text-xs font-bold border transition-colors ${
                        priceType === "REPLACEMENT_COST"
                          ? "bg-brand text-white border-brand"
                          : "bg-[#f8fafc] text-muted border-border"
                      }`}
                    >
                      تكلفة الاستبدال
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    السعر الجديد (ج.م)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-element p-2.5 text-sm font-bold text-foreground outline-none focus:border-brand"
                  />
                  <span className="text-[10px] text-muted block mt-1">
                    السعر السابق:{" "}
                    {formatCurrency(
                      priceType === "SALE_PRICE"
                        ? editingProduct.current_sale_price
                        : editingProduct.replacement_cost
                    )}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    سبب تغيير السعر (إلزامي للتدقيق المحاسبي)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={priceReason}
                    onChange={(e) => setPriceReason(e.target.value)}
                    placeholder="مثال: زيادة أسعار المصنع اعتباراً من بداية الأسبوع..."
                    className="w-full bg-[#f8fafc] border border-border rounded-element p-2 text-xs outline-none focus:border-brand"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" variant="default" disabled={isSubmitting}>
                    {isSubmitting ? "جارٍ الحفظ..." : "اعتماد وتوثيق السعر"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
