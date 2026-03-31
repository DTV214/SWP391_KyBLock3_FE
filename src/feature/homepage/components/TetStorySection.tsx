import { motion } from "framer-motion";

export default function TetStorySection() {
  return (
    <section className="relative py-16 md:py-28 px-4 bg-white overflow-hidden border-b border-gray-100">
      

      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-center relative z-10">
          {/* Cột Nội dung: Căn giữa trên mobile, căn trái từ màn hình md trở lên */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full md:w-1/3 space-y-6 md:space-y-8 text-center md:text-left"
          >
            <div className="inline-block px-4 py-1 bg-tet-secondary/30 text-tet-primary rounded-full text-xs md:text-sm font-bold tracking-widest uppercase">
              Chuyện Ngày Tết
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-tet-primary leading-tight">
              Ý Nghĩa Ngày Tết <br className="hidden md:block" /> & Lời Chúc
              Đoàn Viên
            </h2>

            <p className="text-gray-600 text-base md:text-lg leading-relaxed italic border-l-0 md:border-l-4 border-tet-secondary md:pl-6 max-w-lg mx-auto md:mx-0">
              Tết không chỉ là thời khắc chuyển giao năm mới, mà còn là dịp để
              tri ân, gắn kết tình thân qua những món quà ý nghĩa nhất.
            </p>

            
          </motion.div>

          {/* Cột Lưới Ảnh: Chiều cao co giãn linh hoạt theo thiết bị */}
          <div className="w-full md:w-2/3 grid grid-cols-2 gap-3 md:gap-6 h-[380px] sm:h-[480px] md:h-[550px] overflow-hidden rounded-[2rem] shadow-xl md:shadow-2xl bg-gray-50 border border-gray-100">
            {/* Ảnh lớn bên trái */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="h-full w-full overflow-hidden"
            >
              <img
                src="https://res.cloudinary.com/dratbz8bh/image/upload/v1769521485/chup-anh-gia-dinh-4-nguoi-3_orhvcx.png"
                className="h-full w-full object-cover"
                alt="Gia đình sum vầy"
              />
            </motion.div>

            {/* Cột ảnh nhỏ và câu chúc bên phải */}
            <div className="grid grid-rows-2 gap-3 md:gap-6 overflow-hidden">
              {/* Box câu chúc: Tự động điều chỉnh kích thước chữ cho màn hình nhỏ */}
              <div className="bg-tet-primary rounded-2xl flex flex-col items-center justify-center p-4 md:p-8 text-tet-secondary text-center border-2 md:border-4 border-double border-tet-secondary/30 relative overflow-hidden group">
                {/* Họa tiết mây chìm trang nhã */}
                <div className="absolute inset-0 bg-cloud-pattern opacity-10 group-hover:opacity-20 transition-opacity"></div>

                <span className="text-2xl md:text-5xl mb-1 md:mb-4 font-serif relative z-10 italic">
                  "
                </span>
                <p className="font-serif text-lg sm:text-2xl md:text-2xl lg:text-3xl leading-snug md:leading-relaxed relative z-10 px-2">
                  Cung Chúc Tân Xuân <br /> Vạn Sự Như Ý
                </p>
                <span className="text-2xl md:text-5xl mt-1 md:mt-4 font-serif relative z-10 italic">
                  "
                </span>
              </div>

              {/* Ảnh nhỏ bên dưới */}
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white group">
                <img
                  src="https://res.cloudinary.com/dratbz8bh/image/upload/v1769521491/Gia-Dinh-Doan-Vien-T_v0n9to.png"
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Hộp quà cao cấp"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
