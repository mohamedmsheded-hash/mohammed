"use client";

import React, { useState } from "react";
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  FileCheck,
  Send,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatNumber, formatDate } from "@/lib/utils";
import { createDeliveryOrder, updateDeliveryStatus } from "@/server/actions/delivery";

interface DeliveryOrderRow {
  id: string;
  delivery_number: string;
  invoice_number: string;
  customer_name: string;
  destination_address: string;
  recipient_phone: string;
  driver_name: string;
  driver_phone: string;
  vehicle_plate: string;
  vehicle_model: string;
  max_payload_tons: number;
  total_weight_tons: number;
  items_summary: string;
  status: "PREPARING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  dispatched_at?: string | null;
  delivered_at?: string | null;
  proof_of_delivery_url?: string | null;
  notes?: string | null;
}

const initialDeliveries: DeliveryOrderRow[] = [
  {
    id: "del-001",
    delivery_number: "DEL-2026-0089",
    invoice_number: "INV-2026-0042",
    customer_name: "شركة المعمار الحديث للمقاولات",
    destination_address: "موقع كمبوند زهرة العاصمة - التجمع الخامس (قطعة 42B)",
    recipient_phone: "01099887766",
    driver_name: "محمد رجب عبد الله",
    driver_phone: "01233445566",
    vehicle_plate: "ط س ر 7841",
    vehicle_model: "مرسيدس أكتروس 3340",
    max_payload_tons: 30.0,
    total_weight_tons: 25.0,
    items_summary: "حديد تسليح عز 10 مم مشرشر أطوال (15 طن) + 12 مم (10 طن)",
    status: "DISPATCHED",
    dispatched_at: "2026-11-21T10:15:00Z",
    delivered_at: null,
    proof_of_delivery_url: null,
    notes: "تسليم للمهندس مصطفى - برجاء التحقق من كشف الأطوال والتفريد",
  },
  {
    id: "del-002",
    delivery_number: "DEL-2026-0088",
    invoice_number: "INV-2026-0039",
    customer_name: "مؤسسة الأمل للتشييد والتعمير",
    destination_address: "مشروع أبراج النيل - كورنيش المعادي",
    recipient_phone: "01122334455",
    driver_name: "عادل حسني الشريف",
    driver_phone: "01011223344",
    vehicle_plate: "ق د ع 3195",
    vehicle_model: "إيسوزو جامبو حمولة 5 طن",
    max_payload_tons: 6.0,
    total_weight_tons: 5.0,
    items_summary: "أسمنت السويدي مقاوم 42.5 (100 شيكارة)",
    status: "DELIVERED",
    dispatched_at: "2026-11-21T08:30:00Z",
    delivered_at: "2026-11-21T10:45:00Z",
    proof_of_delivery_url: "https://storage.placeholder/pod-del-0088.pdf",
    notes: "تم التعتيق بالكامل وتوقيع المهندس حسام مشرف الموقع",
  },
  {
    id: "del-003",
    delivery_number: "DEL-2026-0090",
    invoice_number: "INV-2026-0045",
    customer_name: "شركة الصفوة للاستثمار العقاري",
    destination_address: "موقع فيلات الشروق - الحي الثاني",
    recipient_phone: "01544332211",
    driver_name: "سمير جابر محمود",
    driver_phone: "01288776655",
    vehicle_plate: "ب ج ل 9923",
    vehicle_model: "قلاب مان 26 طن",
    max_payload_tons: 20.0,
    total_weight_tons: 18.0,
    items_summary: "رمل حرش محاجر فاخر (18 م³)",
    status: "PREPARING",
    dispatched_at: null,
    delivered_at: null,
    proof_of_delivery_url: null,
    notes: "جاري التحميل في محطة المحاجر بواسطة اللودر",
  },
];

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrderRow[]>(initialDeliveries);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrderRow | null>(null);
  const [podNotes, setPodNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Form State for New Delivery
  const [formData, setFormData] = useState({
    invoice_id: "inv-001",
    vehicle_id: "veh-001",
    driver_id: "drv-001",
    destination_address: "",
    recipient_phone: "",
    items_summary: "أسمنت السويدي مقاوم 42.5 (100 شيكارة)",
    total_weight_tons: 5.0,
    notes: "",
  });

  const filteredDeliveries = deliveries.filter((item) => {
    const matchesSearch =
      item.delivery_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name.includes(searchTerm) ||
      item.driver_name.includes(searchTerm) ||
      item.vehicle_plate.includes(searchTerm);

    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const preparingCount = deliveries.filter((d) => d.status === "PREPARING").length;
  const dispatchedCount = deliveries.filter((d) => d.status === "DISPATCHED").length;
  const deliveredCount = deliveries.filter((d) => d.status === "DELIVERED").length;
  const totalTons = deliveries.reduce((sum, d) => sum + d.total_weight_tons, 0);

  const handleDispatch = async (delivery: DeliveryOrderRow) => {
    if (!confirm(`هل أنت متأكد من خروج الشحنة ${delivery.delivery_number} مع السائق ${delivery.driver_name}؟`)) {
      return;
    }
    setActionLoading(true);
    try {
      // In production calls server action updateDeliveryStatus
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === delivery.id
            ? { ...d, status: "DISPATCHED", dispatched_at: new Date().toISOString() }
            : d
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPod = async () => {
    if (!selectedDelivery) return;
    setActionLoading(true);
    try {
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === selectedDelivery.id
            ? {
                ...d,
                status: "DELIVERED",
                delivered_at: new Date().toISOString(),
                proof_of_delivery_url: "https://storage.placeholder/pod-confirmed.pdf",
                notes: podNotes ? `${d.notes || ""} | إثبات التسليم: ${podNotes}` : d.notes,
              }
            : d
        )
      );
      setIsPodModalOpen(false);
      setSelectedDelivery(null);
      setPodNotes("");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destination_address) {
      alert("برجاء إدخال عنوان الموقع وجهة التسليم");
      return;
    }

    const newOrder: DeliveryOrderRow = {
      id: `del-${Date.now()}`,
      delivery_number: `DEL-2026-00${deliveries.length + 91}`,
      invoice_number: "INV-2026-0042",
      customer_name: "شركة المعمار الحديث للمقاولات",
      destination_address: formData.destination_address,
      recipient_phone: formData.recipient_phone || "01000000000",
      driver_name: formData.driver_id === "drv-001" ? "محمد رجب عبد الله" : "عادل حسني الشريف",
      driver_phone: "01233445566",
      vehicle_plate: "ط س ر 7841",
      vehicle_model: "مرسيدس أكتروس 3340",
      max_payload_tons: 30.0,
      total_weight_tons: Number(formData.total_weight_tons) || 10,
      items_summary: formData.items_summary,
      status: "PREPARING",
      notes: formData.notes,
    };

    setDeliveries([newOrder, ...deliveries]);
    setIsNewModalOpen(false);
    setFormData({
      invoice_id: "inv-001",
      vehicle_id: "veh-001",
      driver_id: "drv-001",
      destination_address: "",
      recipient_phone: "",
      items_summary: "أسمنت السويدي مقاوم 42.5 (100 شيكارة)",
      total_weight_tons: 5.0,
      notes: "",
    });
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الخدمات اللوجستية والتوصيل" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-7 h-7 text-primary" />
              الخدمات اللوجستية وإدارة أسطول النقل والتوصيل
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              جدولة شاحنات التوصيل، متابعة خروج الشحنات للمواقع، وتوثيق إثباتات التسليم (POD)
            </p>
          </div>

          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>أمر توصيل جديد</span>
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="أوامر قيد التجهيز"
            value={preparingCount}
            subtitle="جاري التحميل بالمستودع"
            icon={Clock}
            color="warning"
          />
          <StatCard
            title="شحنات في الطريق"
            value={dispatchedCount}
            subtitle="متوجهة لمواقع العملاء"
            icon={Truck}
            color="primary"
          />
          <StatCard
            title="شحنات تم تسليمها اليوم"
            value={deliveredCount}
            subtitle="موثقة بإثبات التسليم POD"
            icon={CheckCircle2}
            color="success"
          />
          <StatCard
            title="إجمالي الحمولة المنقولة"
            value={`${formatNumber(totalTons, 1)} طن`}
            subtitle="حديد وأسمنت ورمل"
            icon={FileCheck}
            color="neutral"
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث برقم التوصيل، الفاتورة، العميل، السائق، أو رقم اللوحة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary bg-white min-w-[160px]"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="PREPARING">قيد التجهيز بالمستودع</option>
              <option value="DISPATCHED">في الطريق بالموقع</option>
              <option value="DELIVERED">تم التسليم بنجاح</option>
              <option value="CANCELLED">ملغية</option>
            </select>
          </div>
        </div>

        {/* Delivery Orders List */}
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 hover:border-gray-300 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-primary font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-lg">
                        {delivery.delivery_number}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                        فاتورة: {delivery.invoice_number}
                      </span>
                      <StatusBadge status={delivery.status} />
                    </div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">
                      {delivery.customer_name}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {delivery.status === "PREPARING" && (
                    <Button
                      onClick={() => handleDispatch(delivery)}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>خروج الشحنة (Dispatch)</span>
                    </Button>
                  )}

                  {delivery.status === "DISPATCHED" && (
                    <Button
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        setIsPodModalOpen(true);
                      }}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>إثبات التسليم بالموقع (POD)</span>
                    </Button>
                  )}

                  {delivery.status === "DELIVERED" && delivery.proof_of_delivery_url && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                      <FileCheck className="w-4 h-4" />
                      موثق وموقع
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
                {/* Destination */}
                <div className="space-y-1">
                  <div className="text-gray-500 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>وجهة التسليم والموقع:</span>
                  </div>
                  <div className="text-gray-900 font-medium pr-4 leading-relaxed">
                    {delivery.destination_address}
                  </div>
                  {delivery.recipient_phone && (
                    <div className="text-gray-600 flex items-center gap-1 pr-4">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span dir="ltr">{delivery.recipient_phone}</span>
                    </div>
                  )}
                </div>

                {/* Driver & Vehicle */}
                <div className="space-y-1">
                  <div className="text-gray-500 font-medium flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>الشاحنة والسائق:</span>
                  </div>
                  <div className="text-gray-900 font-semibold pr-4">
                    {delivery.driver_name}
                  </div>
                  <div className="text-gray-600 pr-4">
                    {delivery.vehicle_model} ({delivery.vehicle_plate})
                  </div>
                  <div className="text-gray-500 pr-4">
                    حمولة الشاحنة: {delivery.max_payload_tons} طن | هاتف: {delivery.driver_phone}
                  </div>
                </div>

                {/* Cargo */}
                <div className="space-y-1">
                  <div className="text-gray-500 font-medium flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>حمولة النقل (الوزن: {delivery.total_weight_tons} طن):</span>
                  </div>
                  <div className="text-gray-800 font-medium pr-4 bg-gray-50 p-2 rounded-md border border-gray-100">
                    {delivery.items_summary}
                  </div>
                </div>

                {/* Timestamps & Notes */}
                <div className="space-y-1">
                  <div className="text-gray-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>التوقيت والملاحظات:</span>
                  </div>
                  {delivery.dispatched_at && (
                    <div className="text-gray-700 pr-4">
                      انطلاق: {formatDate(delivery.dispatched_at)}
                    </div>
                  )}
                  {delivery.delivered_at && (
                    <div className="text-emerald-700 font-medium pr-4">
                      تسليم: {formatDate(delivery.delivered_at)}
                    </div>
                  )}
                  {delivery.notes && (
                    <div className="text-gray-500 italic pr-4 mt-1">
                      &quot;{delivery.notes}&quot;
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredDeliveries.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-semibold">لا توجد أوامر توصيل مطابقة للبحث</p>
              <p className="text-xs text-gray-400 mt-1">يمكنك إنشاء أمر توصيل جديد لفاتورة معتمدة</p>
            </div>
          )}
        </div>
      </div>

      {/* New Delivery Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-lg">إنشاء أمر توصيل ونقل جديد</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  فاتورة المبيعات المعتمدة *
                </label>
                <select
                  value={formData.invoice_id}
                  onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                >
                  <option value="inv-001">INV-2026-0042 - شركة المعمار الحديث (حديد تسليح 25 طن)</option>
                  <option value="inv-002">INV-2026-0043 - شركة الأمل للتشييد (أسمنت السويدي 100 شيكارة)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الشاحنة والمركبة *
                  </label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                  >
                    <option value="veh-001">مرسيدس أكتروس 3340 (ط س ر 7841) - 30 طن</option>
                    <option value="veh-002">إيسوزو جامبو (ق د ع 3195) - 6 طن</option>
                    <option value="veh-003">قلاب مان (ب ج ل 9923) - 20 طن</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    السائق المعتمد *
                  </label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary bg-white"
                  >
                    <option value="drv-001">محمد رجب عبد الله (01233445566)</option>
                    <option value="drv-002">عادل حسني الشريف (01011223344)</option>
                    <option value="drv-003">سمير جابر محمود (01288776655)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  عنوان الموقع وجهة التسليم *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: التجمع الخامس، كمبوند النرجس، قطعة رقم 18B"
                  value={formData.destination_address}
                  onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    هاتف مستلم الموقع
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="010XXXXXXXX"
                    value={formData.recipient_phone}
                    onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    الوزن الإجمالي للشحنة (طن)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.total_weight_tons}
                    onChange={(e) => setFormData({ ...formData, total_weight_tons: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  بيان البضاعة المشحونة
                </label>
                <input
                  type="text"
                  value={formData.items_summary}
                  onChange={(e) => setFormData({ ...formData, items_summary: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  تعليمات وملاحظات التسليم
                </label>
                <textarea
                  rows={2}
                  placeholder="تعليمات التعتيق والتفريغ، مواعيد الورشة، إلخ..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover text-white">
                  تأكيد وحفظ أمر التوصيل
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof of Delivery (POD) Modal */}
      {isPodModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  إثبات التسليم (Proof of Delivery)
                </h3>
              </div>
              <button
                onClick={() => setIsPodModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                <div>
                  <span className="font-bold">أمر التوصيل:</span> {selectedDelivery.delivery_number}
                </div>
                <div>
                  <span className="font-bold">العميل:</span> {selectedDelivery.customer_name}
                </div>
                <div>
                  <span className="font-bold">الموقع:</span> {selectedDelivery.destination_address}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  اسم المستلم وصفته بالموقع *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م/ حسام أحمد - مهندس تنفيذ الموقع"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ملاحظات الاستلام والتعتيق
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: تم التعتيق والفرز بالكامل واستلام أذونات الوزن المرفقة سليمة دون عجز..."
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPodModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleConfirmPod}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  اعتماد التسليم وتوثيق الـ POD
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
