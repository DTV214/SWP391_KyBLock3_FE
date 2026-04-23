import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileDown,
  Home,
  Loader2,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { orderService } from "../services/orderService";

interface PaymentSuccessProps {
  orderId?: number | string | null;
}

export default function PaymentSuccess({
  orderId: propOrderId,
}: PaymentSuccessProps = {}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  const resolvedOrderId = useMemo(() => {
    const stateOrderId = (location.state as { orderId?: number | string } | null)
      ?.orderId;
    const directOrderId = propOrderId ?? stateOrderId;

    if (directOrderId != null) {
      return directOrderId.toString();
    }

    const orderInfo = searchParams.get("vnp_OrderInfo");
    if (!orderInfo) return undefined;

    const match = orderInfo.match(/#(\d+)/);
    return match?.[1];
  }, [location.state, propOrderId, searchParams]);

  const numericOrderId = resolvedOrderId ? Number(resolvedOrderId) : NaN;

  const handleDownloadInvoice = async () => {
    if (!resolvedOrderId || Number.isNaN(numericOrderId)) return;

    try {
      setIsDownloadingInvoice(true);
      const token = localStorage.getItem("token") || undefined;
      await orderService.downloadInvoice(numericOrderId, token);
    } catch (error) {
      console.error("Lỗi khi tải hóa đơn:", error);
      alert("Đã xảy ra lỗi khi tải hóa đơn. Vui lòng thử lại sau.");
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF5E8] bg-cloud-pattern flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#EDE5B5] bg-white shadow-[0_24px_80px_rgba(90,17,7,0.14)]"
      >
        <div className="h-2 bg-gradient-to-r from-[#5A1107] via-[#9F3025] to-[#2E7D32]" />

        <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
          <div className="flex justify-center">
            <div className="flex size-24 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600 shadow-inner">
              <CheckCircle2 size={56} strokeWidth={1.6} />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Giao dịch đã hoàn tất
            </p>
            <h1 className="font-serif text-4xl font-bold text-tet-primary sm:text-5xl">
              Thanh toán thành công
            </h1>
            <p className="mx-auto max-w-md text-base leading-7 text-gray-600">
              Cảm ơn bạn đã mua hàng. Hóa đơn bán hàng sẽ được gửi qua email;
              nếu có yêu cầu VAT, thông tin VAT đã được ghi nhận để xác thực.
            </p>
            {resolvedOrderId && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5B5] bg-[#FBF5E8]/70 px-4 py-2 text-sm font-semibold text-tet-primary">
                <ReceiptText className="size-4" />
                Mã đơn hàng #{resolvedOrderId}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {resolvedOrderId && (
              <Button
                onClick={handleDownloadInvoice}
                disabled={isDownloadingInvoice}
                className="h-14 w-full min-w-0 rounded-xl bg-[#006969] px-3 text-sm font-bold text-white shadow-md shadow-[#006969]/20 hover:bg-[#005858] sm:text-base"
              >
                {isDownloadingInvoice ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <FileDown className="size-5" />
                )}
                {isDownloadingInvoice
                  ? "Đang xử lý..."
                  : "Tải hóa đơn bán hàng"}
              </Button>
            )}

            <Button
              asChild
              className="h-14 w-full rounded-xl bg-[#2E7D32] text-base font-bold text-white shadow-lg shadow-green-700/20 hover:bg-[#256B2A]"
            >
              <Link to="/products">
                <ShoppingBag className="size-5" />
                Tiếp tục mua sắm
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 w-full rounded-xl border-[#EDE5B5] px-5 text-base font-bold text-tet-primary hover:bg-[#FBF5E8]"
            >
              <Link to="/home">
                <Home className="size-5" />
                Trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
