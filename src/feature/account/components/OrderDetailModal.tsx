import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Edit2, Save, X as XIcon, Package } from "lucide-react";
import {
  type OrderResponse,
  type OrderItem,
  orderService,
} from "@/feature/checkout/services/orderService";
import { formatOrderDate } from "../utils/orderFilterUtils";
import {
  translateOrderStatus,
  getStatusColorClass,
} from "../utils/orderStatusUtils";
import {
  paymentService,
  type PaymentTransaction,
} from "@/feature/checkout/services/paymentService";
import {
  stockMovementService,
  type StockMovement,
} from "@/feature/admin/services/stockMovementService";
import OrderPaymentHistory from "./OrderPaymentHistory";

interface OrderDetailModalProps {
  order: OrderResponse;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedOrder: OrderResponse) => void;
  isAdmin?: boolean;
}

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdate,
  isAdmin = false,
}: OrderDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<OrderResponse>(order);
  const [editData, setEditData] = useState({
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    note: order.note,
  });
  const [stockMovementModal, setStockMovementModal] = useState({
    isOpen: false,
    productId: 0,
    productName: "",
  });
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockMovementsLoading, setStockMovementsLoading] = useState(false);

  // Sync displayOrder with order prop when it changes
  useEffect(() => {
    setDisplayOrder(order);
    setEditData({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      note: order.note,
    });
  }, [order]);

  // Load payments
  useEffect(() => {
    if (isOpen) {
      loadPayments();
    }
  }, [isOpen, order.orderId]);

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      const token = localStorage.getItem("token") || undefined;
      const data = await paymentService.getPaymentsByOrder(
        order.orderId,
        token,
      );
      setPayments(data);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadStockMovements = async (productId: number, productName: string) => {
    try {
      setStockMovementsLoading(true);
      const token = localStorage.getItem("token") || undefined;
      const data =
        await stockMovementService.getStockMovementsByOrderAndProduct(
          order.orderId,
          productId,
          token,
        );
      setStockMovements(data);
      setStockMovementModal({ isOpen: true, productId, productName });
    } catch (error) {
      console.error("Error loading stock movements:", error);
      alert("Không thể tải lịch sử di chuyển kho. Vui lòng thử lại!");
    } finally {
      setStockMovementsLoading(false);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token") || undefined;
      const response = await orderService.updateOrderShippingInfo(
        order.orderId,
        editData,
        token,
      );

      if (response) {
        setDisplayOrder(response);
        if (onUpdate) {
          onUpdate(response);
        }
        alert("Cập nhật thông tin giao hàng thành công!");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving order changes:", error);
      alert("Cập nhật thông tin giao hàng thất bại. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      customerName: displayOrder.customerName,
      customerPhone: displayOrder.customerPhone,
      customerEmail: displayOrder.customerEmail,
      customerAddress: displayOrder.customerAddress,
      note: displayOrder.note,
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-4xl shadow-2xl max-h-[90vh] w-full max-w-4xl overflow-y-auto custom-scrollbar"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Mã đơn: #{displayOrder.orderId}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatOrderDate(displayOrder.orderDateTime)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-8">
          {/* Status Section */}
          <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Trạng thái đơn hàng
              </p>
              <p
                className={`text-sm px-4 py-1.5 rounded-full border font-bold inline-block mt-2 shadow-sm ${getStatusColorClass(displayOrder.status)}`}
              >
                {translateOrderStatus(displayOrder.status)}
              </p>
            </div>
            {displayOrder.promotionCode && (
              <div className="ml-auto text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Mã giảm giá
                </p>
                <p className="text-sm font-black text-green-600 mt-2 bg-green-50 px-3 py-1 rounded-full inline-block border border-green-100">
                  {displayOrder.promotionCode}
                </p>
              </div>
            )}
          </div>

          {/* Order Info Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-serif font-bold text-tet-primary">
                Thông tin giao hàng
              </h3>
              {!isEditing && !isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-tet-primary/10 text-tet-primary rounded-xl hover:bg-tet-primary hover:text-white transition-all text-sm font-bold"
                >
                  <Edit2 size={16} /> Chỉnh sửa
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
              {/* Editable Fields */}
              {isEditing ? (
                <>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={editData.customerName}
                      onChange={(e) =>
                        handleEditChange("customerName", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={editData.customerPhone}
                      onChange={(e) =>
                        handleEditChange("customerPhone", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editData.customerEmail}
                      onChange={(e) =>
                        handleEditChange("customerEmail", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Địa chỉ giao hàng
                    </label>
                    <input
                      type="text"
                      value={editData.customerAddress}
                      onChange={(e) =>
                        handleEditChange("customerAddress", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Ghi chú
                    </label>
                    <textarea
                      value={editData.note}
                      onChange={(e) => handleEditChange("note", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none resize-none h-24 transition-all"
                    />
                  </div>

                  {/* Edit Buttons */}
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-md"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Đang
                          lưu...
                        </>
                      ) : (
                        <>
                          <Save size={18} /> Lưu thay đổi
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                    >
                      <XIcon size={18} /> Hủy
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Họ và tên
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-1">
                      {displayOrder.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Số điện thoại
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-1">
                      {displayOrder.customerPhone}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Email
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-1">
                      {displayOrder.customerEmail}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Địa chỉ giao hàng
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-1 leading-relaxed">
                      {displayOrder.customerAddress}
                    </p>
                  </div>
                  {displayOrder.note && (
                    <div className="md:col-span-2 bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                        Ghi chú từ khách
                      </p>
                      <p className="text-sm font-medium text-amber-900 mt-1 italic">
                        {displayOrder.note}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Order Items Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-tet-primary px-1">
              Sản phẩm đơn hàng
            </h3>
            <div className="space-y-4">
              {displayOrder.items.map((item: OrderItem) => (
                <div key={item.orderDetailId} className="space-y-2">
                  {/* Main item */}
                  <div className="flex gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-tet-secondary to-tet-primary/10">
                          <span className="text-2xl">🎁</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-gray-800 text-base">
                          {item.productName}
                        </h4>
                        {isAdmin &&
                          (!item.productDetails ||
                            item.productDetails.length === 0) && (
                            <button
                              onClick={() =>
                                loadStockMovements(
                                  item.productId,
                                  item.productName,
                                )
                              }
                              disabled={stockMovementsLoading}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-xs transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                              title="Xem lịch sử di chuyển kho"
                            >
                              <Package className="w-3.5 h-3.5" /> Kho
                            </button>
                          )}
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-3">
                        SKU: {item.sku}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                          {(item.amount / item.quantity).toLocaleString(
                            "vi-VN",
                          )}
                          đ <span className="text-xs">x</span>{" "}
                          <span className="font-bold text-gray-800">
                            {item.quantity}
                          </span>
                        </span>
                        <span className="font-black text-tet-primary text-lg ml-auto">
                          {item.amount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Details (nested items) */}
                  {item.productDetails && item.productDetails.length > 0 && (
                    <div className="ml-6 space-y-2.5 p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Package size={14} /> Thành phần trong giỏ:
                      </p>
                      {item.productDetails.map((detail: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-100 shadow-sm"
                        >
                          <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                            {detail.imageurl ? (
                              <img
                                src={detail.imageurl}
                                alt={detail.productname}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs">
                                📷
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-700 truncate">
                              {detail.productname}
                            </p>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs font-black text-tet-primary">
                                x{detail.quantity}
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() =>
                                    loadStockMovements(
                                      detail.productid || 0,
                                      detail.productname || "",
                                    )
                                  }
                                  disabled={stockMovementsLoading}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Package className="w-3 h-3" /> Lịch sử kho
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Price Summary Section */}
          <section className="p-6 bg-linear-to-br from-[#FBF5E8] to-white rounded-3xl border border-tet-secondary/20 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-tet-primary mb-4">
              Tính toán chi phí
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Tạm tính</span>
                <span className="font-bold text-gray-800">
                  {displayOrder.totalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>
              {displayOrder.discountValue && displayOrder.discountValue > 0 && (
                <div className="flex justify-between text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                  <span className="text-green-700 font-bold">
                    Giảm giá ({displayOrder.promotionCode})
                  </span>
                  <span className="font-black text-green-700">
                    -{displayOrder.discountValue.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  Tổng cộng
                </span>
                <span className="text-3xl font-black text-tet-primary">
                  {displayOrder.finalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </section>

          {/* Payments Section */}
          <OrderPaymentHistory
            payments={payments}
            isLoading={paymentsLoading}
            orderId={displayOrder.orderId}
            orderStatus={displayOrder.status}
            isAdmin={isAdmin}
          />
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-6 flex justify-end z-10">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-900 text-white rounded-full hover:bg-black transition-all font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Đóng cửa sổ
          </button>
        </div>
      </motion.div>

      {/* Stock Movement Modal */}
      {stockMovementModal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-110 flex items-center justify-center p-4"
          onClick={() =>
            setStockMovementModal({ ...stockMovementModal, isOpen: false })
          }
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-4xl shadow-2xl max-h-[80vh] w-full max-w-2xl overflow-y-auto custom-scrollbar"
          >
            {/* Stock Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-gray-900">
                    Lịch sử di chuyển kho
                  </h2>
                  <p className="text-sm font-bold text-tet-primary mt-1">
                    {stockMovementModal.productName}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setStockMovementModal({
                    ...stockMovementModal,
                    isOpen: false,
                  })
                }
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Stock Modal Content */}
            <div className="p-6">
              {stockMovementsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-tet-primary animate-spin mb-4" />
                  <p className="text-gray-500 font-medium">
                    Đang tải dữ liệu kho...
                  </p>
                </div>
              ) : stockMovements.length > 0 ? (
                <div className="space-y-4">
                  {stockMovements.map((movement) => (
                    <div
                      key={movement.stockmovementid}
                      className={`p-5 rounded-2xl border-l-4 shadow-sm ${
                        movement.quantity > 0
                          ? "bg-green-50 border-l-green-500 border-y-green-100 border-r-green-100"
                          : "bg-red-50 border-l-red-500 border-y-red-100 border-r-red-100"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl drop-shadow-sm">
                            {movement.quantity > 0 ? "📥" : "📤"}
                          </span>
                          <div>
                            <p className="font-bold text-gray-800">
                              {movement.note}
                            </p>
                            <p className="text-xs font-medium text-gray-500 mt-1">
                              {new Date(movement.movementdate).toLocaleString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-black text-xl px-3 py-1 rounded-lg ${
                            movement.quantity > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {movement.quantity > 0 ? "+" : ""}
                          {movement.quantity}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-gray-500 bg-white/50 p-2 rounded-lg mt-2 inline-block">
                        <span className="mr-4">Kho ID: {movement.stockid}</span>
                        <span>Giao dịch ID: {movement.stockmovementid}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    Không có lịch sử xuất/nhập kho cho sản phẩm này.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
