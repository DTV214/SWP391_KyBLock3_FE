"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, Ticket } from "lucide-react";
import {
  cartService,
  type CartItemResponse,
} from "@/feature/cart/services/cartService";
import { orderService } from "@/feature/checkout/services/orderService";
import { paymentService } from "@/feature/checkout/services/paymentService";
import type { PromotionResponse } from "@/feature/checkout/services/promotionService";
import PaymentSuccessModal from "../components/PaymentSuccessModal";
import PromotionSelectionModal from "../components/PromotionSelectionModal";
import CustomProductDetailModal from "../components/CustomProductDetailModal";

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  note: string;
  promotionCode: string;
  paymentMethod: "VNPAY";
  province: string;
  district: string;
  ward: string;
  requireVatInvoice: boolean;
  vatCompanyName: string;
  vatCompanyTaxCode: string;
  vatCompanyAddress: string;
  vatInvoiceEmail: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<PromotionResponse | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<number | undefined>();
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<CartItemResponse | null>(null);

  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    note: "",
    promotionCode: "",
    paymentMethod: "VNPAY",
    province: "",
    district: "",
    ward: "",
    requireVatInvoice: false,
    vatCompanyName: "",
    vatCompanyTaxCode: "",
    vatCompanyAddress: "",
    vatInvoiceEmail: "",
  });

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  // Load cart items on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Vui lòng đăng nhập để tiếp tục");
          navigate("/login");
          return;
        }

        // Load cart
        const cartResponse = await cartService.getCart(token);
        setCartItems(cartResponse.items);
      } catch (err: unknown) {
        console.error("Error loading data:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectPromotionFromModal = (
    selectedPromotion: PromotionResponse | null,
  ) => {
    setPromotion(selectedPromotion);
    if (selectedPromotion) {
      setFormData((prev) => ({
        ...prev,
        promotionCode: selectedPromotion.code,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        promotionCode: "",
      }));
    }
  };

  const calculateTotals = () => {
    const totalPrice = cartItems.reduce((sum, item) => sum + item.subTotal, 0);
    let discountValue = 0;

    if (promotion) {
      if (promotion.isPercentage) {
        // Nếu là phần trăm, tính discount từ totalPrice
        discountValue = totalPrice * (promotion.discountValue / 100);
      } else {
        // Nếu là số tiền cố định, dùng trực tiếp
        discountValue = promotion.discountValue;
      }

      // Nếu discount vượt quá maxDiscountPrice, giới hạn ở maxDiscountPrice
      if (
        promotion.maxDiscountPrice &&
        discountValue > promotion.maxDiscountPrice
      ) {
        discountValue = promotion.maxDiscountPrice;
      }
    }

    const finalPrice = Math.max(totalPrice - discountValue, 0);
    const vatRate = formData.requireVatInvoice ? 0.08 : 0;
    const vatAmount = formData.requireVatInvoice
      ? Math.round(finalPrice * vatRate)
      : 0;
    const finalPayableAmount = finalPrice + vatAmount;

    return {
      totalPrice,
      discountValue,
      finalPrice,
      vatRate,
      vatAmount,
      finalPayableAmount,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.customerName ||
      !formData.customerPhone ||
      !formData.customerEmail ||
      !formData.customerAddress
    ) {
      setError("Vui lòng điền đầy đủ thông tin liên hệ");
      return;
    }

    if (cartItems.length === 0) {
      setError("Giỏ hàng của bạn trống");
      return;
    }

    if (formData.requireVatInvoice) {
      if (
        !formData.vatCompanyName.trim() ||
        !formData.vatCompanyTaxCode.trim() ||
        !formData.vatCompanyAddress.trim() ||
        !formData.vatInvoiceEmail.trim()
      ) {
        setError("Vui lòng điền đầy đủ thông tin VAT");
        return;
      }
      if (!isValidEmail(formData.vatInvoiceEmail.trim())) {
        setError("Email xác thực VAT không hợp lệ");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      // Step 1: Create order
      console.log("📝 Creating order...");
      const orderResponse = await orderService.createOrder(
        {
          customerName: formData.customerName.trim(),
          customerPhone: formData.customerPhone.trim(),
          customerEmail: formData.customerEmail.trim(),
          customerAddress: formData.customerAddress.trim(),
          note: formData.note.trim() || null,
          promotionCode: formData.promotionCode.trim() || null,
          requireVatInvoice: formData.requireVatInvoice,
          vatCompanyName: formData.requireVatInvoice
            ? formData.vatCompanyName.trim()
            : null,
          vatCompanyTaxCode: formData.requireVatInvoice
            ? formData.vatCompanyTaxCode.trim()
            : null,
          vatCompanyAddress: formData.requireVatInvoice
            ? formData.vatCompanyAddress.trim()
            : null,
          vatInvoiceEmail: formData.requireVatInvoice
            ? formData.vatInvoiceEmail.trim()
            : null,
        },
        token,
      );
      console.log("✅ Order created:", orderResponse);

      // Step 2: VNPAY payment
      console.log("💳 Creating payment...");
      const paymentResponse = await paymentService.createPayment(
        {
          orderId: orderResponse.orderId,
          paymentMethod: "VNPAY", // Chỉ còn VNPay
        },
        token,
      );
      console.log("✅ Payment created:", paymentResponse);

      // Step 3: Redirect to payment URL
      const paymentUrl =
        paymentResponse.paymentUrl ?? paymentResponse.paymentLink ?? "";

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        // If no payment URL, show success page
        navigate("/checkout/success", {
          state: { orderId: orderResponse.orderId },
        });
      }
    } catch (err: unknown) {
      console.error("Error during checkout:", err);
      let errorMessage =
        "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const apiError = err as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { totalPrice, discountValue, finalPrice, vatAmount, finalPayableAmount } =
    calculateTotals();

  if (isLoading) {
    return (
      <div className="bg-[#FBF5E8]/30 min-h-screen py-10 md:py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-tet-primary" />
          <p className="text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FBF5E8]/30 min-h-screen py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <h1 className="text-3xl font-serif font-bold text-tet-primary mb-10">
          Thanh toán
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* CỘT TRÁI: THÔNG TIN VÀ PHƯƠNG THỨC */}
            <div className="w-full lg:w-2/3 space-y-8">
              {/* 1. Thông tin liên hệ */}
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-xl font-serif font-bold text-tet-primary">
                  Thông tin liên hệ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Họ và tên *
                    </Label>
                    <Input
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn A"
                      className="rounded-xl border-gray-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Số điện thoại *
                    </Label>
                    <Input
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="0912 345 678"
                      className="rounded-xl border-gray-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Email *
                    </Label>
                    <Input
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                      className="rounded-xl border-gray-200"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* 2. Địa chỉ giao hàng */}
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-xl font-serif font-bold text-tet-primary">
                  Địa chỉ giao hàng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Địa chỉ cụ thể *
                    </Label>
                    <Input
                      name="customerAddress"
                      value={formData.customerAddress}
                      onChange={handleInputChange}
                      placeholder="Số nhà, tên đường..."
                      className="rounded-xl border-gray-200"
                      required
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Ghi chú (tùy chọn)
                    </Label>
                    <Input
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder="Không nhận hàng vào thứ Sáu và Chủ nhật..."
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>
              </section>

              {/* 3. Thông tin VAT */}
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-xl font-serif font-bold text-tet-primary">
                  Thông tin VAT
                </h3>
                <div className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4 bg-gray-50/50">
                  <Checkbox
                    id="requireVatInvoice"
                    checked={formData.requireVatInvoice}
                    onCheckedChange={(checked) => {
                      const shouldRequireVat = checked === true;
                      setFormData((prev) => ({
                        ...prev,
                        requireVatInvoice: shouldRequireVat,
                        vatCompanyName: shouldRequireVat ? prev.vatCompanyName : "",
                        vatCompanyTaxCode: shouldRequireVat
                          ? prev.vatCompanyTaxCode
                          : "",
                        vatCompanyAddress: shouldRequireVat
                          ? prev.vatCompanyAddress
                          : "",
                        vatInvoiceEmail: shouldRequireVat
                          ? prev.vatInvoiceEmail
                          : "",
                      }));
                    }}
                    className="mt-0.5 border-gray-400 data-[state=checked]:bg-tet-primary data-[state=checked]:border-tet-primary"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="requireVatInvoice"
                      className="font-bold text-sm cursor-pointer"
                    >
                      Yêu cầu VAT (8%)
                    </Label>
                    <p className="text-xs text-gray-500">
                      Khi bật tùy chọn này, hệ thống sẽ tính thêm VAT 8% trên
                      thành tiền sau giảm giá.
                    </p>
                  </div>
                </div>

                {formData.requireVatInvoice && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Tên công ty *
                      </Label>
                      <Input
                        name="vatCompanyName"
                        value={formData.vatCompanyName}
                        onChange={handleInputChange}
                        placeholder="CONG TY TNHH ABC"
                        className="rounded-xl border-gray-200"
                        required={formData.requireVatInvoice}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Mã số thuế *
                      </Label>
                      <Input
                        name="vatCompanyTaxCode"
                        value={formData.vatCompanyTaxCode}
                        onChange={handleInputChange}
                        placeholder="0319999999"
                        className="rounded-xl border-gray-200"
                        required={formData.requireVatInvoice}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Email xác thực VAT *
                      </Label>
                      <Input
                        name="vatInvoiceEmail"
                        type="email"
                        value={formData.vatInvoiceEmail}
                        onChange={handleInputChange}
                        placeholder="ketoan@abc.com"
                        className="rounded-xl border-gray-200"
                        required={formData.requireVatInvoice}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Địa chỉ công ty *
                      </Label>
                      <Input
                        name="vatCompanyAddress"
                        value={formData.vatCompanyAddress}
                        onChange={handleInputChange}
                        placeholder="123 Le Loi, Quan 1, TP.HCM"
                        className="rounded-xl border-gray-200"
                        required={formData.requireVatInvoice}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* 4. Phương thức giao hàng & Thanh toán */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                  <h3 className="text-lg font-serif font-bold text-tet-primary">
                    Phương thức giao hàng
                  </h3>
                  <RadioGroup defaultValue="standard" className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 transition-all border-tet-primary bg-tet-bg/10">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="standard" id="standard" />
                        <Label
                          htmlFor="standard"
                          className="font-bold text-sm cursor-pointer"
                        >
                          Giao hàng tiêu chuẩn
                        </Label>
                      </div>
                      <span className="text-sm font-black">0đ</span>
                    </div>
                  </RadioGroup>
                </section>

                <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                  <h3 className="text-lg font-serif font-bold text-tet-primary">
                    Phương thức thanh toán
                  </h3>
                  <RadioGroup
                    value={formData.paymentMethod}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all border-blue-500 bg-blue-50/30">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="VNPAY" id="vnpay" />
                        <Label
                          htmlFor="vnpay"
                          className="font-bold text-sm cursor-pointer block"
                        >
                          Thanh toán qua VNPAY
                          <span className="block text-xs font-normal text-gray-500 mt-1">
                            An toàn & Nhanh chóng
                          </span>
                        </Label>
                      </div>
                      <img
                        src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418189687.png"
                        alt="VNPay"
                        className="h-6"
                      />
                    </div>
                  </RadioGroup>
                </section>
              </div>
            </div>

            {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (Sticky) */}
            <aside className="w-full lg:w-1/3 sticky top-28">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">
                <h3 className="text-xl font-serif font-bold text-tet-primary">
                  Đơn hàng của bạn
                </h3>

                {/* Danh sách sản phẩm */}
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {cartItems.length > 0 ? (
                    cartItems.map((item) => (
                      <div
                        key={item.cartDetailId}
                        className={`flex gap-3 pb-4 border-b border-gray-100 last:border-b-0 ${
                          item.isCustomItem
                            ? "cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                            : ""
                        }`}
                        onClick={() => {
                          if (item.isCustomItem) {
                            setSelectedDetailItem(item);
                            setIsDetailModalOpen(true);
                          }
                        }}
                      >
                        <div className="relative w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
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
                          <span className="absolute -top-2 -right-2 bg-tet-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-tet-primary line-clamp-2">
                            {item.productName}
                            {item.isCustomItem && (
                              <span className="ml-2 text-[10px] bg-tet-primary/10 text-tet-primary px-2 py-1 rounded-full font-medium">
                                Xem chi tiết
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">
                            SKU: {item.sku || "N/A"}
                          </p>
                          <p className="text-sm font-bold text-tet-primary mt-1">
                            {(item.subTotal || 0).toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🛒</div>
                      <p>Giỏ hàng trống</p>
                    </div>
                  )}
                </div>

                {/* Mã giảm giá */}
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPromotionModalOpen(true)}
                    className="w-full flex items-center justify-between gap-3 bg-linear-to-r from-tet-primary/5 to-tet-secondary/5 border-2 border-tet-primary/20 p-4 rounded-2xl hover:border-tet-primary/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-tet-primary/10 rounded-lg group-hover:bg-tet-primary/20 transition-all">
                        <Ticket size={20} className="text-tet-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-tet-primary">
                          {promotion
                            ? `Mã: ${promotion.code}`
                            : "Chọn mã giảm giá"}
                        </p>
                        {promotion && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Giảm{" "}
                            {promotion.isPercentage
                              ? `${promotion.discountValue}%`
                              : `${Math.round(promotion.discountValue / 1000)}K`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-tet-primary px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-100">
                      {promotion ? "✓" : "+"}
                    </span>
                  </button>
                )}

                {/* Tính toán tổng tiền */}
                {cartItems.length > 0 && (
                  <>
                    {promotion && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                        <p className="text-sm font-bold text-green-700">
                          ✅ Đã áp dụng mã: {promotion.code}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3 pt-6 border-t border-gray-100">
                      <div className="flex justify-between text-sm text-gray-500 font-medium">
                        <span>Tổng tiền hàng</span>
                        <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 font-medium">
                        <span>Giảm giá</span>
                        <span
                          className={
                            discountValue > 0
                              ? "text-green-600 font-bold"
                              : "text-gray-500"
                          }
                        >
                          {discountValue > 0
                            ? `-${discountValue.toLocaleString("vi-VN")}đ`
                            : "0đ"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 font-medium">
                        <span>Thành tiền sau giảm</span>
                        <span>{finalPrice.toLocaleString("vi-VN")}đ</span>
                      </div>
                      {formData.requireVatInvoice && (
                        <div className="flex justify-between text-sm text-gray-500 font-medium">
                          <span>VAT (8%)</span>
                          <span>{vatAmount.toLocaleString("vi-VN")}đ</span>
                        </div>
                      )}
                      <Separator className="bg-gray-100" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-serif font-bold text-tet-primary uppercase">
                          Tổng thanh toán
                        </span>
                        <div className="text-right">
                          <p className="text-2xl font-black text-tet-primary italic">
                            {finalPayableAmount.toLocaleString("vi-VN")}đ
                          </p>
                          {discountValue > 0 && (
                            <p className="text-[10px] text-green-600 font-bold tracking-tighter italic">
                              🌸 Tiết kiệm:{" "}
                              {discountValue.toLocaleString("vi-VN")}đ
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || cartItems.length === 0}
                      className="w-full bg-linear-to-r from-[#7a160e] to-tet-accent hover:from-[#4a0d06] hover:to-[#7a160e] text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      {isSubmitting && (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      )}
                      {isSubmitting ? "Đang xử lý..." : "Đặt hàng (VNPay)"}
                    </button>

                    <p className="text-[10px] text-center text-gray-400 italic font-medium">
                      🛡️ Thanh toán an toàn & bảo mật
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        </form>
      </div>

      {/* Promotion Selection Modal */}
      <PromotionSelectionModal
        isOpen={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        onSelect={handleSelectPromotionFromModal}
        selectedPromotionId={promotion?.promotionId}
        totalPrice={totalPrice}
      />

      {/* Custom Product Detail Modal */}
      {selectedDetailItem && (
        <CustomProductDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDetailItem(null);
          }}
          productId={selectedDetailItem.productId}
          productName={selectedDetailItem.productName}
        />
      )}

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={paymentSuccess}
        orderId={successOrderId}
        onClose={() => {
          setPaymentSuccess(false);
          setSuccessOrderId(undefined);
        }}
      />
    </div>
  );
}

