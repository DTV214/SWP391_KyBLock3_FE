import { CheckCircle2, Circle, Clock, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  quotationService,
  type QuotationDetail,
} from "@/feature/quotation/services/quotationService";

type StatusState = {
  quotationId?: number;
  status?: string;
  company?: string;
  address?: string;
  email?: string;
  phone?: string;
  items?: Array<{ productname: string; sku?: string | null; quantity: number }>;
};

const statusSteps = [
  { key: "DRAFT", label: "Đã gửi", sub: "Chờ xử lý" },
  { key: "STAFF_PROPOSED", label: "Đã báo giá", sub: "Chờ phản hồi" },
  { key: "CUSTOMER_ACCEPTED", label: "Đã xác nhận", sub: "Chờ tạo đơn" },
  { key: "CONVERTED_TO_ORDER", label: "Đã tạo đơn", sub: "Chờ thanh toán" },
];

export default function QuotationStatusPage() {
  const { id } = useParams();
  const location = useLocation();
  const state = (location.state || {}) as StatusState;
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<QuotationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const response = await quotationService.getQuotationById(id);
        setDetail(response?.data || null);
      } catch (err) {
        console.error(err);
        setError("Không thể tải chi tiết báo giá.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const currentStatus = detail?.status || state.status || "DRAFT";
  const currentIndex = Math.max(
    0,
    statusSteps.findIndex((step) => step.key === currentStatus),
  );

  return (
    <div className="bg-[#FBF5E8]/40 text-[#4a0d06] min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="rounded-3xl border border-[#f1e1d6] bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Gửi yêu cầu thành công</h1>
            <p className="mt-2 text-sm text-[#7b5a4c]">
              Chúng tôi đã nhận được yêu cầu báo giá của bạn và sẽ xử lý trong
              thời gian sớm nhất.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#f1e1d6] bg-[#fff7ee] px-4 py-2 text-sm font-semibold text-[#7a160e]">
              Mã yêu cầu: Q-{id || state.quotationId}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-[#f1e1d6] bg-[#fffaf5] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">
              Trạng thái yêu cầu
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-4">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentIndex;
                return (
                  <div key={step.key} className="text-center">
                    <div
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${
                        isActive ? "bg-[#7a160e] text-white" : "bg-white text-[#b48a7a]"
                      } border border-[#f1e1d6]`}
                    >
                      {isActive ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold">{step.label}</p>
                    <p className="text-xs text-[#8a5b4f]">{step.sub}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-[#e5efe9] bg-[#f4fbf6] px-4 py-3 text-xs text-[#4c7b5a]">
              <Clock className="h-4 w-4" />
              Thời gian xử lý dự kiến: 1-2 ngày làm việc. Chúng tôi sẽ gửi email
              cập nhật khi có báo giá.
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">
                Thông tin yêu cầu
              </h3>
              <div className="mt-4 space-y-3 text-sm text-[#7b5a4c]">
                <div className="flex justify-between">
                  <span>Công ty</span>
                  <span className="font-semibold text-[#4a0d06]">
                    {detail?.company || state.company || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Email</span>
                  <span className="font-semibold text-[#4a0d06]">
                    {detail?.email || state.email || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Người liên hệ</span>
                  <span className="font-semibold text-[#4a0d06]">
                    {detail?.phone || state.phone || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Địa chỉ</span>
                  <span className="font-semibold text-[#4a0d06]">
                    {detail?.address || state.address || "Chưa cập nhật"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">
                Danh sách sản phẩm
              </h3>
              <div className="mt-4 space-y-3 text-sm text-[#7b5a4c]">
                {detail?.lines && detail.lines.length > 0 ? (
                  detail.lines.map((item) => (
                    <div
                      key={item.quotationItemId}
                      className="flex items-center justify-between rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[#4a0d06]">
                          {item.productName}
                        </p>
                        <p className="text-xs text-[#8a5b4f]">
                          {item.sku ? `Mã SP: ${item.sku}` : "Mã SP: N/A"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold">
                        Số lượng: {item.quantity}
                      </span>
                    </div>
                  ))
                ) : state.items && state.items.length > 0 ? (
                  state.items.map((item, index) => (
                    <div
                      key={`${item.productname}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[#4a0d06]">
                          {item.productname}
                        </p>
                        <p className="text-xs text-[#8a5b4f]">
                          {item.sku ? `Mã SP: ${item.sku}` : "Mã SP: N/A"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold">
                        Số lượng: {item.quantity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#f1e1d6] p-4 text-center text-xs text-[#8a5b4f]">
                    Không có dữ liệu sản phẩm.
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-6 rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 text-xs text-[#7b5a4c]">
              Đang tải chi tiết báo giá...
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d7b8a5] bg-white px-6 py-3 text-sm font-semibold text-[#7a160e] transition hover:bg-[#fff7ee]"
            >
              Tiếp tục mua sắm
            </Link>
            <Link
              to="/quotation/history"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7a160e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7a160e]/20 transition hover:-translate-y-0.5 hover:bg-[#5c0f09]"
            >
              <FileText className="h-4 w-4" />
              Xem lịch sử báo giá
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
