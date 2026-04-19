import { Loader2, Copy, CreditCard } from "lucide-react";
import { useState } from "react";
import {
  type PaymentTransaction,
  createPayment,
} from "@/feature/checkout/services/paymentService";
import {
  translatePaymentStatus,
  getPaymentStatusColorClass,
  getPaymentStatusIcon,
} from "../utils/paymentStatusUtils";
import { formatOrderDate } from "../utils/orderFilterUtils";

interface OrderPaymentHistoryProps {
  payments: PaymentTransaction[];
  isLoading: boolean;
  orderId?: number;
  orderStatus?: string;
  isAdmin?: boolean;
}

export default function OrderPaymentHistory({
  payments,
  isLoading,
  orderId,
  orderStatus,
  isAdmin = false,
}: OrderPaymentHistoryProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetryPayment = async () => {
    if (!orderId) {
      setError("Không tìm thấy mã đơn hàng");
      return;
    }

    try {
      setIsRetrying(true);
      setError(null);

      const token = localStorage.getItem("token") || undefined;
      const response = await createPayment({ orderId, paymentMethod: "VNPAY" }, token);

      if (response && response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        setError("Lỗi khi tạo thanh toán. Vui lòng thử lại!");
      }
    } catch (err: unknown) {
      console.error("Error creating payment:", err);
      let errMsg = "Lỗi khi tạo thanh toán. Vui lòng thử lại!";
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const apiError = err as { response?: { data?: { message?: string } } };
        errMsg = apiError.response?.data?.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-bold text-tet-primary">
          Lịch sử giao dịch
        </h3>
        {orderStatus === "PENDING" && orderId && !isAdmin && (
          <button
            onClick={handleRetryPayment}
            disabled={isRetrying}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-md"
          >
            {isRetrying ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang chuyển hướng...
              </>
            ) : (
              <>
                <CreditCard size={16} /> Thanh toán lại
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-tet-primary" />
        </div>
      ) : payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment) => {
            const payableAmount =
              payment.finalPayableAmount > 0
                ? payment.finalPayableAmount
                : payment.amount;
            const baseAmount =
              payment.baseAmount > 0
                ? payment.baseAmount
                : Math.max(payableAmount - payment.vatAmount, 0);
            const shouldShowVatBreakdown =
              payment.requireVatInvoice && payment.vatAmount > 0;

            return (
              <div
                key={payment.paymentId}
                className={`p-4 rounded-2xl border flex items-center justify-between ${getPaymentStatusColorClass(payment.status)}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getPaymentStatusIcon(payment.status)}
                    </span>
                    <div>
                      <p className="font-bold text-sm">
                        {payment.paymentMethod || "VNPAY"}
                      </p>
                      <p className="text-xs opacity-75">
                        {translatePaymentStatus(payment.status)}
                        {payment.createdDate &&
                          ` • ${formatOrderDate(payment.createdDate)}`}
                      </p>
                      {payment.requireVatInvoice && (
                        <p className="text-[11px] opacity-75 mt-1">
                          Giao dịch có VAT
                        </p>
                      )}
                      {payment.transactionNo && (
                        <p className="text-xs opacity-75 mt-1 font-mono">
                          Mã GD: {payment.transactionNo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {payableAmount.toLocaleString("vi-VN")}đ
                  </p>
                  {shouldShowVatBreakdown && (
                    <div className="mt-1 text-[11px] opacity-75">
                      <p>
                        Trước VAT: {baseAmount.toLocaleString("vi-VN")}đ
                      </p>
                      <p>VAT: {payment.vatAmount.toLocaleString("vi-VN")}đ</p>
                    </div>
                  )}
                  {payment.transactionNo && (
                    <button
                      className="text-xs opacity-75 hover:opacity-100 transition-all ml-auto flex items-center gap-1 mt-2 cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(payment.transactionNo!);
                      }}
                    >
                      <Copy size={12} /> Sao chép mã
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center">
          <p className="text-gray-500 text-sm">
            Chưa có giao dịch nào cho đơn hàng này
          </p>
        </div>
      )}
    </section>
  );
}
