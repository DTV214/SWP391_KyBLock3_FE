import { motion } from "framer-motion";
import { CheckCircle2, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { orderService } from "../services/orderService";

interface PaymentSuccessProps {
  orderId?: number | string | null;
}

export default function PaymentSuccess({ orderId: propOrderId }: PaymentSuccessProps = {}) {
  const [searchParams] = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Ưu tiên lấy orderId từ prop (được truyền từ trang VNPayReturn đã verify backend)
  // Nếu không có, dự phòng trích xuất từ vnp_OrderInfo (ví dụ: "Thanh toan don hang #109")
  let orderId = propOrderId?.toString();
  if (!orderId) {
    const orderInfo = searchParams.get("vnp_OrderInfo");
    if (orderInfo) {
      const match = orderInfo.match(/#(\d+)/);
      if (match && match[1]) {
        orderId = match[1];
      }
    }
  }

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('token') || undefined;
      await orderService.downloadInvoice(Number(orderId), token);
    } catch (error) {
      console.error("Lỗi khi tải hóa đơn:", error);
      // Hiển thị fallback thông báo lỗi, thay vì import thêm Toast (để đơn giản và an toàn)
      alert("Đã xảy ra lỗi khi tải hóa đơn. Vui lòng thử lại sau.");
    } finally {
      setIsDownloading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#FBF5E8]/30 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg p-10 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 text-center space-y-8"
      >
        {/* Icon thành công */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-inner">
            <CheckCircle2 size={56} strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-tet-primary">
            Thanh toán <br /> thành công
          </h1>
          <p className="text-gray-500 italic text-lg font-medium">
            Cảm ơn bạn đã mua hàng
          </p>
        </div>

        {/* Nút điều hướng */}
        <div className="flex flex-col gap-4 pt-6">
          {orderId && (
            <Button
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className="bg-tet-primary hover:bg-[#A30D25] text-white py-6 rounded-2xl text-lg font-bold shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileDown className="w-5 h-5" />
              )}
              {isDownloading ? "Đang xử lý..." : "In hóa đơn"}
            </Button>
          )}

          <Button
            asChild
            className="bg-[#4CAF50] hover:bg-[#43A047] text-white py-8 rounded-2xl text-lg font-bold shadow-lg transition-transform hover:scale-[1.02]"
          >
            <Link to="/products" className="flex items-center justify-center gap-2 w-full h-full">
              Tiếp tục mua sắm
            </Link>
          </Button>

          <Link
            to="/home"
            className="text-tet-primary font-bold hover:underline transition-all mt-2"
          >
            Quay về trang chủ
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
