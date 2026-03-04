import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building,
  User,
  Calendar,
  Plus,
  Trash2,
  Send,
  ArrowLeft,
} from "lucide-react";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---
interface Fee {
  id: string; // Chuyển sang string vì sẽ dùng random UUID
  isSubtracted: number; // 0 = Giảm trừ, 1 = Cộng thêm
  price: number;
  description: string;
}

interface LineItem {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  originalTotal: number;
  fees: Fee[]; // Bỏ any
}

interface QuotationDetailType {
  quotationId: number;
  status: string;
  company: string;
  email: string;
  phone: string;
  requestDate: string;
  lines: LineItem[];
  note: string;
}

// --- MOCK DATA ĐỘNG ---
const INITIAL_MOCK_DETAIL: QuotationDetailType = {
  quotationId: 1002,
  status: "STAFF_REVIEWING",
  company: "Công ty Cổ phần Sữa Việt Nam (Vinamilk)",
  email: "purchasing@vinamilk.com.vn",
  phone: "0901234567",
  requestDate: "2026-03-02T10:15:00",
  lines: [
    {
      id: 1,
      productName: "Giỏ quà Vạn Sự Như Ý",
      sku: "GQ-VSNY",
      quantity: 100,
      unitPrice: 1500000,
      originalTotal: 150000000,
      fees: [], // Bắt đầu mảng rỗng
    },
  ],
  note: "Cần giao hàng trước 15 tháng Chạp.",
};

export default function StaffQuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State quản lý toàn bộ dữ liệu báo giá
  const [detail, setDetail] =
    useState<QuotationDetailType>(INITIAL_MOCK_DETAIL);
  const [feeForm, setFeeForm] = useState({
    isSubtracted: 0,
    price: "",
    description: "",
  });
  const [adminNote, setAdminNote] = useState("");

  // Hàm xử lý logic Thêm Phí
  const handleAddFee = (lineId: number) => {
    if (!feeForm.price || Number(feeForm.price) <= 0)
      return alert("Vui lòng nhập giá trị phí hợp lệ!");
    if (!feeForm.description) return alert("Vui lòng nhập mô tả phí!");

    const newFee: Fee = {
      id: crypto.randomUUID(), // Khắc phục lỗi Date.now()
      isSubtracted: feeForm.isSubtracted,
      price: Number(feeForm.price),
      description: feeForm.description,
    };

    setDetail((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === lineId ? { ...line, fees: [...line.fees, newFee] } : line,
      ),
    }));

    setFeeForm({ isSubtracted: 0, price: "", description: "" }); // Reset form
  };

  // Hàm xử lý Xóa Phí
  const handleRemoveFee = (lineId: number, feeId: string) => {
    setDetail((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === lineId
          ? { ...line, fees: line.fees.filter((f) => f.id !== feeId) }
          : line,
      ),
    }));
  };

  // Tính toán lại Tổng tiền Auto
  const calculateTotals = () => {
    let totalGoc = 0;
    let totalCong = 0;
    let totalTru = 0;

    detail.lines.forEach((line) => {
      totalGoc += line.originalTotal;
      line.fees.forEach((fee) => {
        if (fee.isSubtracted === 1) totalCong += fee.price;
        else totalTru += fee.price;
      });
    });

    return {
      totalGoc,
      totalCong,
      totalTru,
      finalTotal: totalGoc + totalCong - totalTru,
    };
  };

  const totals = calculateTotals();

  // Nút Submit lên Admin
  const handleSubmitToAdmin = () => {
    if (confirm("Bạn có chắc chắn muốn trình Admin duyệt báo giá này?")) {
      alert("Đã gửi thành công lên Admin!");
      navigate("/staff/quotations");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-[#7a160e]">
              Xử lý Báo giá #{id || detail.quotationId}
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Trang điều chỉnh chiết khấu và phụ phí cho đơn hàng B2B.
          </p>
        </div>
        <span className="px-4 py-2 bg-amber-100 text-amber-800 font-bold rounded-full text-sm border border-amber-200">
          Đang xử lý
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin khách & Tổng hợp */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-[#7a160e] mb-4 border-b pb-2 uppercase text-sm">
              Thông tin khách hàng
            </h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Building size={16} className="text-gray-400" />{" "}
                <span className="font-semibold">{detail.company}</span>
              </p>
              <p className="flex items-center gap-2">
                <User size={16} className="text-gray-400" /> {detail.phone}
              </p>
              <p className="flex items-center gap-2 text-gray-500">
                <Calendar size={16} />{" "}
                {new Date(detail.requestDate).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
              <span className="font-bold text-gray-800">
                Ghi chú của khách:
              </span>{" "}
              {detail.note}
            </div>
          </div>

          <div className="bg-[#fffaf5] rounded-3xl border border-[#ead6c9] p-6 shadow-sm">
            <h3 className="font-bold text-[#7a160e] mb-4 border-b border-[#ead6c9] pb-2 uppercase text-sm">
              Tổng hợp giá
            </h3>
            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng gốc:</span>{" "}
                <span>{totals.totalGoc.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Tổng giảm trừ (Chiết khấu):</span>{" "}
                <span>- {totals.totalTru.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Tổng cộng thêm (Phí):</span>{" "}
                <span>+ {totals.totalCong.toLocaleString()}đ</span>
              </div>
              <div className="border-t border-[#ead6c9] pt-2 mt-2 flex justify-between font-bold text-lg text-[#7a160e]">
                <span>Thành tiền:</span>
                <span>{totals.finalTotal.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Danh sách sản phẩm & Form thêm phí */}
        <div className="lg:col-span-2 space-y-4">
          {detail.lines.map((line) => (
            <div
              key={line.id}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
            >
              {/* Thông tin SP */}
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h4 className="font-bold text-lg text-gray-800">
                    {line.productName}
                  </h4>
                  <p className="text-sm text-gray-500">SKU: {line.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">SL: {line.quantity}</p>
                  <p className="text-sm text-gray-500">
                    Đơn giá: {line.unitPrice.toLocaleString()}đ
                  </p>
                  <p className="font-bold text-[#7a160e] mt-1">
                    Tổng: {line.originalTotal.toLocaleString()}đ
                  </p>
                </div>
              </div>

              {/* Danh sách phí đã thêm */}
              <div className="mb-4 space-y-2">
                <p className="text-sm font-bold text-gray-700">
                  Các khoản điều chỉnh:
                </p>
                {line.fees.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    Chưa có điều chỉnh nào.
                  </p>
                )}
                {line.fees.map((fee) => (
                  <div
                    key={fee.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${fee.isSubtracted === 1 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {fee.isSubtracted === 1
                          ? "Phí cộng thêm"
                          : "Chiết khấu"}
                      </span>
                      <span className="text-sm ml-2 text-gray-600">
                        {fee.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold ${fee.isSubtracted === 1 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {fee.isSubtracted === 1 ? "+" : "-"}
                        {fee.price.toLocaleString()}đ
                      </span>
                      <button
                        onClick={() => handleRemoveFee(line.id, fee.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form thêm phí mới */}
              <div className="bg-[#FBF5E8]/50 p-4 rounded-2xl border border-gray-200">
                <p className="text-sm font-bold text-[#7a160e] mb-3 flex items-center gap-1">
                  <Plus size={16} /> Thêm điều chỉnh mới
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={feeForm.isSubtracted}
                    onChange={(e) =>
                      setFeeForm({
                        ...feeForm,
                        isSubtracted: Number(e.target.value),
                      })
                    }
                    className="col-span-1 rounded-xl border-gray-300 text-sm focus:ring-[#d77a45]"
                  >
                    <option value={0}>Chiết khấu (Trừ)</option>
                    <option value={1}>Phụ phí (Cộng)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Số tiền..."
                    value={feeForm.price}
                    onChange={(e) =>
                      setFeeForm({ ...feeForm, price: e.target.value })
                    }
                    className="col-span-1 rounded-xl border-gray-300 text-sm px-3 focus:ring-[#d77a45]"
                  />
                  <input
                    type="text"
                    placeholder="Lý do (VD: Khách sỉ, phí hộp gỗ...)"
                    value={feeForm.description}
                    onChange={(e) =>
                      setFeeForm({ ...feeForm, description: e.target.value })
                    }
                    className="col-span-1 md:col-span-2 rounded-xl border-gray-300 text-sm px-3 focus:ring-[#d77a45]"
                  />
                </div>
                <div className="mt-3 text-right">
                  <button
                    onClick={() => handleAddFee(line.id)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
                  >
                    Lưu điều chỉnh
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Khối Gửi Admin */}
          <div className="bg-violet-50 rounded-3xl border border-violet-100 p-6 shadow-sm mt-6">
            <h3 className="font-bold text-violet-800 mb-2">
              Trình Admin Phê Duyệt
            </h3>
            <textarea
              placeholder="Nhập ghi chú hoặc lý do đề xuất mức chiết khấu này để Admin xem xét..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="w-full rounded-xl border-violet-200 p-3 text-sm focus:ring-violet-400 mb-3"
              rows={3}
            />
            <button
              onClick={handleSubmitToAdmin}
              className="w-full flex justify-center items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
            >
              <Send size={18} /> Gửi phê duyệt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
