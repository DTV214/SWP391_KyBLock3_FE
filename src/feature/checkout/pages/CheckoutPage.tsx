'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import { cartService, type CartItemResponse } from '@/feature/cart/services/cartService';
import { orderService } from '@/feature/checkout/services/orderService';
import { paymentService } from '@/feature/checkout/services/paymentService';
import { walletService, type WalletResponse } from '@/feature/checkout/services/walletService';
import type { PromotionResponse } from '@/feature/checkout/services/promotionService';
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import PromotionSelectionModal from '../components/PromotionSelectionModal';
import { Ticket } from 'lucide-react';

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  note: string;
  promotionCode: string;
  paymentMethod: 'VNPAY' | 'WALLET';
  province: string;
  district: string;
  ward: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<PromotionResponse | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<number | undefined>();
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    note: '',
    promotionCode: '',
    paymentMethod: 'VNPAY',
    province: '',
    district: '',
    ward: '',
  });

  // Load cart items and wallet on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vui lòng đăng nhập để tiếp tục');
          navigate('/login');
          return;
        }

        // Load cart
        const cartResponse = await cartService.getCart(token);
        setCartItems(cartResponse.items);

        // Load wallet
        setWalletLoading(true);
        const walletResponse = await walletService.getWallet(token);
        if (walletResponse) {
          setWallet(walletResponse);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
        setWalletLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentMethodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: value as 'VNPAY' | 'WALLET',
    }));
  };

  const handleSelectPromotionFromModal = (selectedPromotion: PromotionResponse | null) => {
    setPromotion(selectedPromotion);
    if (selectedPromotion) {
      setFormData(prev => ({
        ...prev,
        promotionCode: selectedPromotion.code
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        promotionCode: ''
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
      if (promotion.maxDiscountPrice && discountValue > promotion.maxDiscountPrice) {
        discountValue = promotion.maxDiscountPrice;
      }
    }

    const finalPrice = totalPrice - discountValue;

    return {
      totalPrice,
      discountValue,
      finalPrice,
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
      setError('Vui lòng điền đầy đủ thông tin liên hệ');
      return;
    }

    if (cartItems.length === 0) {
      setError('Giỏ hàng của bạn trống');
      return;
    }

    // Check wallet balance if paying by wallet
    if (formData.paymentMethod === 'WALLET') {
      if (!wallet || wallet.balance < finalPrice) {
        setError(`Số dư ví không đủ. Bạn cần ${(finalPrice - (wallet?.balance || 0)).toLocaleString()}đ nữa.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      // Step 1: Create order
      console.log('📝 Creating order...');
      const orderResponse = await orderService.createOrder(
        {
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          customerAddress: formData.customerAddress,
          note: formData.note,
          promotionCode: formData.promotionCode,
        },
        token
      );
      console.log('✅ Order created:', orderResponse);

      // Step 2: Pay based on selected method
      if (formData.paymentMethod === 'WALLET') {
        // Wallet payment
        console.log('💳 Processing wallet payment...');
        await paymentService.paymentByWallet(orderResponse.orderId, token);
        console.log('✅ Wallet payment successful');

        // Show success modal
        setSuccessOrderId(orderResponse.orderId);
        setPaymentSuccess(true);
      } else {
        // VNPAY payment
        console.log('💳 Creating payment...');
        const paymentResponse = await paymentService.createPayment(
          {
            orderId: orderResponse.orderId,
            paymentMethod: formData.paymentMethod,
          },
          token
        );
        console.log('✅ Payment created:', paymentResponse);

        // Step 3: Redirect to payment URL
        if (paymentResponse.paymentUrl || paymentResponse.paymentLink) {
          const paymentUrl = paymentResponse.paymentUrl || paymentResponse.paymentLink;
          console.log('🔗 Redirecting to payment URL:', paymentUrl);
          window.location.href = paymentUrl;
        } else {
          // If no payment URL, show success page
          navigate('/checkout/success', {
            state: { orderId: orderResponse.orderId }
          });
        }
      }
    } catch (err: any) {
      console.error('Error during checkout:', err);
      const errorMessage =
        err.response?.data?.msg ||
        err.message ||
        'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { totalPrice, discountValue, finalPrice } = calculateTotals();

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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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

              {/* 3. Phương thức giao hàng & Thanh toán */}
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
                    onValueChange={handlePaymentMethodChange}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="VNPAY" id="vnpay" />
                        <Label
                          htmlFor="vnpay"
                          className="font-bold text-sm cursor-pointer"
                        >
                          Thanh toán qua VNPAY
                        </Label>
                      </div>
                      <Wallet size={20} className="text-gray-400" />
                    </div>

                    <div
                      className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 transition-all ${wallet && wallet.balance < finalPrice
                        ? 'opacity-60 border-red-200'
                        : ''
                        }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <RadioGroupItem
                          value="WALLET"
                          id="wallet"
                          disabled={!wallet || wallet.balance < finalPrice}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor="wallet"
                            className="font-bold text-sm cursor-pointer block"
                          >
                            Thanh toán bằng ví
                          </Label>
                          {wallet && (
                            <p className={`text-xs mt-1 ${wallet.balance >= finalPrice
                              ? 'text-green-600 font-medium'
                              : 'text-red-600 font-medium'
                              }`}>
                              Số dư: {wallet.balance.toLocaleString()}đ
                            </p>
                          )}
                        </div>
                      </div>
                      <Wallet size={20} className={wallet && wallet.balance >= finalPrice ? 'text-tet-primary' : 'text-gray-400'} />
                    </div>

                    {wallet && wallet.balance < finalPrice && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <p className="font-bold">Số dư ví không đủ</p>
                          <p>Bạn cần thêm {(finalPrice - wallet.balance).toLocaleString()}đ</p>
                        </div>
                      </div>
                    )}
                  </RadioGroup>
                </section>
              </div>
            </div>

            {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (Sticky) */}
            <aside className="w-full lg:w-1/3 sticky top-28">
              {/* Wallet Balance Panel */}
              {wallet && (
                <div className={`mb-6 p-6 rounded-2xl shadow-md border-2 ${wallet.balance >= finalPrice
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
                  }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-lg font-bold ${wallet.balance >= finalPrice
                      ? 'text-green-900'
                      : 'text-orange-900'
                      }`}>
                      💳 Ví của bạn
                    </h4>
                    {walletLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  <p className={`text-3xl font-black ${wallet.balance >= finalPrice
                    ? 'text-green-600'
                    : 'text-orange-600'
                    }`}>
                    {wallet.balance.toLocaleString()}đ
                  </p>
                  <p className={`text-sm mt-2 ${wallet.balance >= finalPrice
                    ? 'text-green-700'
                    : 'text-orange-700'
                    }`}>
                    {wallet.balance >= finalPrice
                      ? '✅ Đủ để thanh toán'
                      : `⚠️ Thiếu ${(finalPrice - wallet.balance).toLocaleString()}đ`}
                  </p>
                </div>
              )}

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">
                <h3 className="text-xl font-serif font-bold text-tet-primary">
                  Đơn hàng của bạn
                </h3>

                {/* Danh sách sản phẩm */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cartItems.length > 0 ? (
                    cartItems.map((item) => (
                      <div key={item.cartDetailId} className="flex gap-3 pb-4 border-b last:border-b-0">
                        <div className="relative w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                          {item.imageUrl1 ? (
                            <img
                              src={item.imageUrl1}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tet-secondary to-tet-primary/10">
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
                          </h4>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">
                            SKU: {item.sku}
                          </p>
                          <p className="text-sm font-bold text-tet-primary mt-1">
                            {(item.subTotal || 0).toLocaleString()}đ
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
                    className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-tet-primary/10 to-tet-secondary/10 border-2 border-tet-primary/20 p-4 rounded-2xl hover:border-tet-primary/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-tet-primary/20 rounded-lg group-hover:bg-tet-primary/30 transition-all">
                        <Ticket size={20} className="text-tet-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-tet-primary">
                          {promotion ? `Mã: ${promotion.code}` : 'Chọn mã giảm giá'}
                        </p>
                        {promotion && (
                          <p className="text-xs text-gray-500">
                            Giảm {promotion.isPercentage ? `${promotion.discountValue}%` : `${Math.round(promotion.discountValue / 1000)}K`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-tet-primary px-3 py-1 bg-white rounded-lg">
                      {promotion ? '✓' : '+'}
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
                    <div className="space-y-3 pt-6 border-t border-gray-50">
                      <div className="flex justify-between text-sm text-gray-500 font-medium">
                        <span>Tạm tính</span>
                        <span>{totalPrice.toLocaleString()}đ</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 font-medium">
                        <span>Phí vận chuyển</span>
                        <span>0đ</span>
                      </div>
                      {discountValue > 0 && (
                        <div className="flex justify-between text-sm text-green-600 font-bold">
                          <span>Giảm giá</span>
                          <span>-{discountValue.toLocaleString()}đ</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-serif font-bold text-tet-primary uppercase">
                          Tổng cộng
                        </span>
                        <div className="text-right">
                          <p className="text-2xl font-black text-tet-primary italic">
                            {finalPrice.toLocaleString()}đ
                          </p>
                          {discountValue > 0 && (
                            <p className="text-[10px] text-green-600 font-bold tracking-tighter italic">
                              🌸 Tiết kiệm: {discountValue.toLocaleString()}đ
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || cartItems.length === 0}
                      className="w-full bg-[#4a0d06] text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-tet-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isSubmitting && (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      )}
                      {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
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
      />

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
