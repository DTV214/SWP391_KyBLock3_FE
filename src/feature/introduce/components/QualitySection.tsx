import { motion } from "framer-motion";

export default function QualitySection() {
  const qualityItems = [
    {
      title: "Hộp Quà Cao Cấp",
      desc: "Chất liệu giấy mỹ thuật dày dặn, ép kim sang trọng.",
      image:
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2000",
    },
    {
      title: "Chi Tiết Tinh Tế",
      desc: "Nơ lụa và phụ kiện trang trí được thắt thủ công tỉ mỉ.",
      image:
        "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2000",
    },
    {
      title: "Sản Phẩm Chọn Lọc",
      desc: "Thành phần bên trong đảm bảo vệ sinh và nguồn gốc thượng hạng.",
      image:
        "https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=2000",
    },
    {
      title: "Thiệp Chúc Đặc Biệt",
      desc: "Thiết kế riêng biệt giúp bạn gửi gắm tâm tình trọn vẹn.",
      image:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#FBF5E8]/30">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Tiêu đề Banner */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif text-tet-primary mb-4 font-bold"
          >
            Đóng Gói & Chất Lượng
          </motion.h2>
          <p className="text-gray-500 italic text-lg max-w-2xl mx-auto leading-relaxed">
            Mỗi chi tiết đều được chăm chút tỉ mỉ để tạo nên món quà hoàn hảo.
          </p>
          <div className="w-24 h-1 bg-tet-secondary mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Lưới hình ảnh chất lượng (Responsive: 1 cột mobile, 2 cột tablet, 4 cột desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {qualityItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="group relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-xl border-4 border-white cursor-pointer"
              onClick={() => window.location.href = '/products'}
            >
              {/* Hình ảnh nền */}
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
              />

              {/* Lớp phủ Gradient sâu sắc */}
              <div className="absolute inset-0 bg-gradient-to-t from-tet-primary/90 via-tet-primary/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Nội dung text đè trên ảnh */}
              <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-white text-2xl font-serif font-bold mb-3">
                  {item.title}
                </h3>
                <p className="text-tet-secondary text-sm leading-relaxed italic opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                  {item.desc}
                </p>
                <div className="w-0 group-hover:w-full h-0.5 bg-tet-secondary mt-4 transition-all duration-700 rounded-full"></div>
              </div>

              {/* Icon trang trí nhỏ ở góc */}
              <div className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                ✨
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
