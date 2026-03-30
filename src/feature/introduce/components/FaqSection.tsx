import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Đảm bảo bạn đã cài đặt: npx shadcn-ui@latest add accordion
import { HelpCircle } from "lucide-react";

export default function FaqSection() {
  const faqs = [
    {
      question: "Tôi có thể đặt hàng trước bao lâu?",
      answer:
        "Bạn có thể đặt hàng trước từ 1-2 tháng để đảm bảo chọn được những mẫu hộp quà ưng ý nhất và nhận ưu đãi đặt sớm.",
    },
    {
      question: "Có giao hàng toàn quốc không?",
      answer:
        "Chúng tôi hỗ trợ giao hàng tận nơi trên toàn quốc, đảm bảo chất lượng sản phẩm nguyên vẹn khi đến tay người nhận.",
    },
    {
      question: "Tôi có thể tùy chỉnh hộp quà không?",
      answer:
        "Hoàn toàn có thể! Bạn có thể sử dụng tính năng 'Tạo Hộp Quà Riêng' để tự chọn sản phẩm và trang trí theo ý thích.",
    },
    {
      question: "Chính sách đổi trả như thế nào?",
      answer:
        "Happybox cam kết đổi trả 1-1 nếu sản phẩm gặp lỗi do nhà sản xuất hoặc hư hỏng trong quá trình vận chuyển.",
    },
    {
      question: "Có hỗ trợ đặt hàng số lượng lớn không?",
      answer:
        "Chúng tôi chuyên cung cấp giải pháp quà tặng doanh nghiệp số lượng lớn với mức chiết khấu cực kỳ hấp dẫn.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#FBF5E8]/30 overflow-hidden">
      <div className="container mx-auto max-w-4xl px-6 relative z-10">
        {/* Tiêu đề Banner */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 text-tet-accent mb-4"
          >
            <HelpCircle size={24} />
            <span className="font-serif italic text-lg tracking-widest uppercase">
              Giải đáp thắc mắc
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif text-tet-primary mb-6 font-bold"
          >
            Câu Hỏi Thường Gặp
          </motion.h2>
          <div className="w-24 h-1 bg-tet-secondary mx-auto rounded-full"></div>
        </div>

        {/* Giao diện Accordion Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-tet-secondary/20"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-tet-secondary/10 last:border-0 pb-2"
              >
                <AccordionTrigger className="text-left font-serif text-xl md:text-2xl text-tet-primary hover:text-tet-accent transition-colors py-6 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base md:text-lg leading-relaxed italic pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Nút hỗ trợ trực tiếp */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-6 italic">
            Bạn vẫn còn thắc mắc khác?
          </p>
          <button
            className="bg-tet-primary text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-tet-accent transition-all hover:-translate-y-1"
            onClick={() => window.location.href = '/contact'}
          >
            Liên hệ với chúng tôi ngay
          </button>
        </div>
      </div>
    </section>
  );
}
