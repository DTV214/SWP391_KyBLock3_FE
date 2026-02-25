import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFailure from "./PaymentFailure";
import { paymentService } from "../services/paymentService";

export default function VNPayReturn() {
    const [searchParams] = useSearchParams();
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failure'>('pending');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Log transaction details for debugging
                const transactionDetails = {
                    amount: searchParams.get("vnp_Amount"),
                    bankCode: searchParams.get("vnp_BankCode"),
                    bankTranNo: searchParams.get("vnp_BankTranNo"),
                    cardType: searchParams.get("vnp_CardType"),
                    orderInfo: searchParams.get("vnp_OrderInfo"),
                    payDate: searchParams.get("vnp_PayDate"),
                    responseCode: searchParams.get("vnp_ResponseCode"),
                    tmnCode: searchParams.get("vnp_TmnCode"),
                    transactionNo: searchParams.get("vnp_TransactionNo"),
                    transactionStatus: searchParams.get("vnp_TransactionStatus"),
                    txnRef: searchParams.get("vnp_TxnRef"),
                };

                console.log("VNPay Transaction Details:", transactionDetails);

                // Get token from localStorage
                const token = localStorage.getItem('token');

                // Send verification to backend
                const result = await paymentService.verifyVNPayReturn(searchParams, token || undefined);

                if (result.success) {
                    setPaymentStatus('success');
                } else {
                    setPaymentStatus('failure');
                    console.error("Payment verification failed:", result.error);
                }
            } catch (error) {
                setPaymentStatus('failure');
                console.error("Error verifying payment:", error);
            }
        };

        verifyPayment();
    }, [searchParams]);

    // Show loading state while verifying
    if (paymentStatus === 'pending') {
        return <div className="flex items-center justify-center min-h-screen">Đang xác thực thanh toán...</div>;
    }

    // If payment verification success, show success page
    if (paymentStatus === 'success') {
        return <PaymentSuccess />;
    }

    // Otherwise, show failure page
    return <PaymentFailure />;
}
