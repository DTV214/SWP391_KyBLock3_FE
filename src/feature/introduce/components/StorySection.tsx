import { motion } from "framer-motion";

export default function StorySection() {
  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* 1. Phần bên trái: Hình ảnh hộp quà trao yêu thương */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 relative group"
          >
            {/* Khung trang trí phía sau ảnh */}
            <div className="absolute -inset-4 border-2 border-tet-secondary rounded-[3rem] rotate-3 opacity-30 group-hover:rotate-0 transition-transform duration-500"></div>

            <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-white">
              <motion.img
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.6 }}
                src="https://res.cloudinary.com/dratbz8bh/image/upload/v1769521637/IN-VO-HOP-QUA-TET_z1cmai.jpg"
                alt="Câu chuyện quà Tết"
                className="w-full h-[400px] md:h-[550px] object-cover cursor-pointer"
              />
            </div>

            
          </motion.div>

          {/* 2. Phần bên phải: Title và Description */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 space-y-6 md:space-y-8"
          >
            <div className="space-y-4">
              <h4 className="text-tet-accent font-serif italic text-xl tracking-wide">
                Về Happybox
              </h4>
              <h2 className="text-4xl md:text-5xl font-serif text-tet-primary leading-tight font-bold">
                Câu Chuyện <br /> Của Chúng Tôi
              </h2>
              <div className="w-20 h-1 bg-tet-secondary rounded-full"></div>
            </div>

            <div className="text-gray-600 space-y-5 text-base md:text-lg leading-relaxed">
              <p>
                <strong>Happybox</strong> được sinh ra từ mong muốn mang đến
                những món quà Tết chất lượng, ý nghĩa và tinh tế cho mọi gia
                đình Việt. Chúng tôi hiểu rằng Tết không chỉ là dịp sum họp, mà
                còn là thời điểm để gửi gắm những lời chúc tốt đẹp nhất đến
                người thân, đối tác và bạn bè.
              </p>
              <p className="italic">
                "Mỗi sản phẩm trong bộ sưu tập của chúng tôi đều được tuyển chọn
                kỹ lưỡng từ các nhà cung cấp uy tín, đảm bảo chất lượng cao
                nhất. Chúng tôi cam kết mang đến trải nghiệm mua sắm quà Tết dễ
                dàng, tiện lợi và đáng tin cậy nhất."
              </p>
            </div>

            {/* Thông số ấn tượng */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-tet-primary">
                  5+
                </p>
                <p className="text-xs md:text-sm text-gray-500 uppercase tracking-tighter">
                  Năm kinh nghiệm
                </p>
              </div>
              <div className="text-center border-x border-gray-100 px-2">
                <p className="text-2xl md:text-3xl font-bold text-tet-primary">
                  10K+
                </p>
                <p className="text-xs md:text-sm text-gray-500 uppercase tracking-tighter">
                  Khách hàng
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-tet-primary">
                  500+
                </p>
                <p className="text-xs md:text-sm text-gray-500 uppercase tracking-tighter">
                  Sản phẩm
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
