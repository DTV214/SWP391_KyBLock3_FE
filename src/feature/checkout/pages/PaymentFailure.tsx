import { motion } from "framer-motion";
import { XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { createPayment } from "@/feature/checkout/services/paymentService";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('vnp_OrderInfo')?.substring(21) || '0';
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPayment = async () => {
    if (!orderId) {
      alert('Không tìm thấy mã đơn hàng');
      return;
    }

    try {
      setIsRetrying(true);
      const response = await createPayment(
        {
          orderId: parseInt(orderId),
          paymentMethod: 'VNPAY'
        },
        localStorage.getItem('token') || undefined
      );

      if (response && response.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = response.paymentUrl;
      } else {
        alert('Lỗi khi tạo thanh toán. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Lỗi khi tạo thanh toán. Vui lòng thử lại!');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF5E8]/30 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-lg p-10 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 text-center space-y-8"
      >
        {/* Icon thất bại */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-600 shadow-inner">
            <XCircle size={56} strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-tet-primary">
            Thanh toán <br /> thất bại
          </h1>
          <p className="text-gray-500 italic text-sm leading-relaxed max-w-xs mx-auto">
            Bạn không thể thanh toán hãy kiểm tra lại đơn hàng hoặc VNPay
          </p>
          {orderId && (
            <p className="text-xs text-gray-400 font-mono mt-4">
              Mã đơn: #{orderId}
            </p>
          )}
        </div>

        {/* Các nút hành động khắc phục */}
        <div className="flex flex-col gap-4 pt-6">
          <Button
            onClick={handleRetryPayment}
            disabled={isRetrying || !orderId}
            className="bg-[#4a0d06] hover:bg-tet-accent disabled:opacity-50 disabled:cursor-not-allowed text-white py-7 rounded-2xl text-base font-bold shadow-lg"
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...
              </>
            ) : (
              'Thanh toán lại'
            )}
          </Button>

          <Link
            to="/home"
            className="text-tet-primary font-bold hover:underline transition-all pt-2"
          >
            Trở về trang chủ
          </Link>

          <div className="text-xs text-gray-400 font-medium">
            Cần giúp đỡ?{" "}
            <Link to="/contact" className="text-red-800 hover:underline">
              Liên hệ chúng tôi
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
