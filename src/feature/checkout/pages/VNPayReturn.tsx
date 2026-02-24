import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFailure from "./PaymentFailure";

export default function VNPayReturn() {
    const [searchParams] = useSearchParams();

    const transactionStatus = searchParams.get("vnp_TransactionStatus");

    useEffect(() => {
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

        // Optional: Send verification to backend
        // You can add additional verification logic here
    }, [searchParams]);

    // If transactionStatus is "00", show success page
    if (transactionStatus === "00") {
        return <PaymentSuccess />;
    }

    // Otherwise, show failure page
    return <PaymentFailure />;
}
