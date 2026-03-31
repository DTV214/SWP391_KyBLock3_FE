import { useState } from "react";
import {
  Send,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import {
  contactService,
  type CreateContactRequest,
} from "@/api/contactService";

export default function ContactForm() {
  const [formData, setFormData] = useState<CreateContactRequest>({
    customerName: "",
    email: "",
    phone: "",
    note: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const validateForm = () => {
    if (!formData.customerName.trim()) return "Vui lòng nhập họ tên.";
    if (!formData.phone.trim()) return "Vui lòng nhập số điện thoại.";
    if (!formData.email.trim()) return "Vui lòng nhập email.";

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(formData.phone)) return "Số điện thoại không hợp lệ.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Email không hợp lệ.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await contactService.submitContact(formData);
      setSuccess(true);
      setFormData({ customerName: "", email: "", phone: "", note: "" }); // Reset form
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#FBF5E8] border border-tet-accent p-8 rounded-3xl text-center animate-in fade-in zoom-in duration-300">
        <CheckCircle2 size={48} className="mx-auto text-green-600 mb-4" />
        <h3 className="text-2xl font-serif font-bold text-tet-primary mb-2">
          Gửi yêu cầu thành công!
        </h3>
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã liên hệ. Đội ngũ Happybox sẽ phản hồi lại bạn qua Email
          trong thời gian sớm nhất.Hãy kiểm tra hộp thư đến và hộp thư rác của
          bạn nhé!
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2 bg-tet-primary text-white rounded-full font-bold hover:bg-tet-accent transition-all"
        >
          Gửi yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
      <h3 className="text-3xl font-serif font-bold text-tet-primary mb-2">
        Liên hệ với chúng tôi
      </h3>
      <p className="text-gray-500 mb-8 italic">
        Vui lòng để lại thông tin, chúng tôi sẽ hỗ trợ bạn ngay.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none transition-all"
              placeholder="Nguyễn Văn A"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none transition-all"
                placeholder="0987654321"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Lời nhắn
          </label>
          <div className="relative">
            <MessageSquare
              className="absolute left-4 top-4 text-gray-400"
              size={18}
            />
            <textarea
              value={formData.note || ""}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              rows={4}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tet-accent outline-none transition-all"
              placeholder="Bạn cần chúng tôi hỗ trợ vấn đề gì?"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-tet-primary text-white rounded-xl font-bold hover:bg-tet-accent transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send size={18} />
          )}
          {loading ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </form>
    </div>
  );
}
