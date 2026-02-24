import { Link } from "react-router-dom";
import {
  Palette,
  ReceiptText,
  Truck,
  BadgeCheck,
  ClipboardList,
  MessageCircle,
  FileCheck2,
  Sparkles,
  PhoneCall,
  Mail,
  MapPin,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const highlights = [
  {
    icon: BadgeCheck,
    title: "Giảm giá số lượng",
    description: "Ưu đãi lên đến 15% cho đơn từ 50 hộp trở lên.",
  },
  {
    icon: Palette,
    title: "Cá nhân hóa thương hiệu",
    description: "In logo, thiệp chúc và thông điệp theo doanh nghiệp.",
  },
  {
    icon: ReceiptText,
    title: "Hóa đơn linh hoạt",
    description: "Hỗ trợ xuất VAT và điều khoản thanh toán doanh nghiệp.",
  },
  {
    icon: Truck,
    title: "Kế hoạch giao hàng",
    description: "Chia tuyến giao theo nhiều địa điểm, đúng thời gian.",
  },
];

const steps = [
  {
    id: "1",
    icon: ClipboardList,
    title: "Chọn sản phẩm",
    description: "Chọn sản phẩm phù hợp nhu cầu số lượng lớn.",
  },
  {
    id: "2",
    icon: MessageCircle,
    title: "Gửi yêu cầu",
    description: "Gửi số lượng, ngân sách và yêu cầu giao hàng.",
  },
  {
    id: "3",
    icon: FileCheck2,
    title: "Nhận báo giá",
    description: "Nhận báo giá kèm tuỳ chọn cá nhân hóa.",
  },
  {
    id: "4",
    icon: Sparkles,
    title: "Xác nhận & thanh toán",
    description: "Xác nhận báo giá và bắt đầu sản xuất.",
  },
];

const faqs = [
  {
    question: "Số lượng tối thiểu để đặt báo giá là bao nhiêu?",
    answer:
      "Đơn báo giá bắt đầu từ 30 hộp. Với số lượng ít hơn, vui lòng liên hệ để được tư vấn.",
  },
  {
    question: "Mất bao lâu để nhận báo giá?",
    answer:
      "Thông thường trong 24-48 giờ làm việc. Trường hợp gấp, hãy gọi hotline để được ưu tiên.",
  },
  {
    question: "Có thể in logo/branding lên hộp quà không?",
    answer:
      "Có. Chúng tôi hỗ trợ in logo, thiệp chúc và thông điệp cá nhân hóa.",
  },
  {
    question: "Thanh toán đơn doanh nghiệp bằng cách nào?",
    answer:
      "Hỗ trợ chuyển khoản doanh nghiệp, thẻ công ty và điều khoản thanh toán linh hoạt.",
  },
  {
    question: "Có giao nhiều địa điểm không?",
    answer:
      "Có. Chúng tôi giao nhiều địa điểm trên toàn quốc theo danh sách bạn cung cấp.",
  },
];

export default function QuotationIntroPage() {
  return (
    <div className="bg-[#FBF5E8]/40 text-[#4a0d06]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8e9dd] via-[#fdf8f1] to-[#f3e0d3]" />
        <div className="absolute -top-40 -right-24 h-72 w-72 rounded-full bg-[#7a160e]/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-52 w-52 rounded-full bg-[#b26b3d]/20 blur-3xl" />

        <div className="relative container mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7a160e]/20 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a160e] shadow-sm">
            Giải pháp quà tặng doanh nghiệp
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h1 className="text-3xl font-bold leading-tight md:text-5xl">
                Quà Tết Doanh Nghiệp — Yêu cầu báo giá
              </h1>
              <p className="mt-4 text-base text-[#6d3b2e] md:text-lg">
                Nhận báo giá nhanh cho quà Tết doanh nghiệp. Giá tốt cho đơn số
                lượng lớn, hỗ trợ branding và đồng hành xuyên suốt dự án.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/quotation/create"
                  className="rounded-full bg-[#7a160e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7a160e]/20 transition hover:-translate-y-0.5 hover:bg-[#5c0f09]"
                >
                  Tạo yêu cầu báo giá
                </Link>
                <Link
                  to="/contact"
                  className="rounded-full border border-[#7a160e] px-6 py-3 text-sm font-semibold text-[#7a160e] transition hover:bg-white"
                >
                  Liên hệ tư vấn
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs font-medium text-[#8a5b4f]">
                <span className="flex items-center gap-2">
                  <BadgeCheck size={16} /> Hơn 500+ doanh nghiệp tin chọn
                </span>
                <span className="flex items-center gap-2">
                  <BadgeCheck size={16} /> 24/7 hỗ trợ dự án lớn
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a160e]/70">
                    Xem trước báo giá
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">Bộ quà Tết 2026</h3>
                </div>
                <div className="rounded-2xl bg-[#7a160e] p-3 text-white shadow-lg">
                  <Sparkles size={20} />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Hộp quà Premium + trà thượng hạng",
                  "Yến sào + hạt dinh dưỡng",
                  "Bộ quà doanh nhân + lịch Tết",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl bg-[#fbf5e8] px-4 py-3 text-sm font-medium"
                  >
                    <span>{item}</span>
                    <span className="text-[#7a160e]">Từ 1.200.000đ</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#f7ebe2] px-4 py-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a160e]/60">
                    Ngân sách gợi ý
                  </p>
                  <p className="font-semibold">400.000.000đ / 200 suất</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7a160e]">
                  Nháp
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-[#f0e0d4] bg-white p-6 shadow-sm transition hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7a160e] text-white shadow-md">
                <item.icon size={22} />
              </div>
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[#7b5a4c]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a160e]/60">
              Quy trình
            </p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              4 bước hoàn tất báo giá
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className="rounded-3xl border border-[#f1e1d6] bg-[#fffaf5] p-6 text-center shadow-sm"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#7a160e] text-sm font-bold text-white">
                  {step.id}
                </div>
                <div className="mx-auto mt-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#7a160e] shadow">
                  <step.icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-[#7b5a4c]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#7a160e] via-[#6a130c] to-[#4a0d06] text-white">
        <div className="container mx-auto max-w-6xl px-4 py-12 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl">
                Sẵn sàng bắt đầu dự án quà tặng doanh nghiệp?
              </h2>
              <p className="mt-3 text-sm text-white/80">
                Hàng trăm doanh nghiệp đã tin chọn Happybox. Nhận báo giá cá nhân
                hóa ngay hôm nay để có một mùa Tết trọn vẹn.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  to="/quotation/create"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#7a160e] shadow-lg transition hover:-translate-y-0.5"
                >
                  Nhận báo giá
                </Link>
                <Link
                  to="/contact"
                  className="rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Liên hệ Sales
                </Link>
              </div>
            </div>
            <div className="rounded-3xl bg-white/10 p-6 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Cam kết dịch vụ
              </p>
              <ul className="mt-4 space-y-3 text-white/90">
                <li>• 100% kiểm soát chất lượng trước khi giao.</li>
                <li>• Hỗ trợ branding và cá nhân hóa.</li>
                <li>• Giao hàng toàn quốc, nhiều điểm nhận.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a160e]/60">
            Câu hỏi thường gặp
          </p>
          <h2 className="mt-3 text-2xl font-bold md:text-3xl">
            FAQ cho báo giá doanh nghiệp
          </h2>
        </div>

        <div className="mt-8 rounded-3xl border border-[#f1e1d6] bg-white p-6 shadow-sm">
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent className="text-[#7b5a4c]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-[#fff7ee]">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Vẫn cần tư vấn thêm?</h3>
              <p className="mt-2 text-sm text-[#7b5a4c]">
                Đội ngũ doanh nghiệp sẵn sàng tư vấn để bạn có trải nghiệm quà
                tặng trọn vẹn.
              </p>

              <div className="mt-6 space-y-4 text-sm text-[#6d3b2e]">
                <div className="flex items-center gap-3">
                  <PhoneCall size={18} />
                  <span>Hotline dự án: 1900 1234</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} />
                  <span>sales@happybox.vn</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} />
                  <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#f1e1d6] bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Form liên hệ nhanh</h3>
              <form className="mt-6 space-y-4">
                <input
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none"
                  placeholder="Tên công ty"
                />
                <input
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none"
                  placeholder="Người liên hệ"
                />
                <input
                  type="email"
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none"
                  placeholder="Email"
                />
                <input
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none"
                  placeholder="Số điện thoại"
                />
                <textarea
                  rows={4}
                  className="w-full rounded-2xl border border-[#f1e1d6] bg-[#fffaf5] px-4 py-3 text-sm focus:border-[#7a160e] focus:outline-none"
                  placeholder="Mô tả nhu cầu quà tặng"
                />
                <button
                  type="button"
                  className="w-full rounded-full bg-[#7a160e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7a160e]/20 transition hover:-translate-y-0.5 hover:bg-[#5c0f09]"
                >
                  Gửi thông tin
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
