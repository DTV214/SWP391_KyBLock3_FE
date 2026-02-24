import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PaymentFailure() {
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
        </div>

        {/* Các nút hành động khắc phục */}
        <div className="flex flex-col gap-4 pt-6">
          <Button className="bg-[#4a0d06] hover:bg-tet-accent text-white py-7 rounded-2xl text-base font-bold shadow-lg">
            Thanh toán lại
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
