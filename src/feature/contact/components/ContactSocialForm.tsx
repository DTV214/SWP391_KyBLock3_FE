import { motion } from "framer-motion";
import { Facebook, Instagram, Youtube, Music2 } from "lucide-react";

export default function ContactSocialForm() {
  const socialLinks = [
    { name: "Facebook", icon: <Facebook />, color: "hover:bg-[#1877F2]" },
    { name: "Instagram", icon: <Instagram />, color: "hover:bg-[#E4405F]" },
    { name: "TikTok", icon: <Music2 />, color: "hover:bg-black" },
    { name: "YouTube", icon: <Youtube />, color: "hover:bg-[#FF0000]" },
  ];

  return (
    <section className="relative overflow-hidden bg-tet-primary py-16 md:py-24">
      <div className="absolute inset-0 bg-cloud-pattern opacity-[0.03] pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl space-y-10 text-center">
            <div className="space-y-4">
              <h3 className="flex items-center justify-center gap-3 text-tet-secondary text-2xl md:text-3xl font-serif font-bold">
                <span className="h-[1px] w-10 bg-tet-secondary/70" />
                Kết Nối Với Chúng Tôi
                <span className="h-[1px] w-10 bg-tet-secondary/70" />
              </h3>
              <p className="text-[#FBF5E8] opacity-70 italic text-sm md:text-base">
                Theo dõi Happybox trên các nền tảng mạng xã hội để cập nhật
                những mẫu quà Tết mới nhất và các chương trình ưu đãi đặc quyền.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href="#"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className={`flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl text-white transition-all duration-300 ${social.color} group shadow-lg`}
                >
                  <div className="mb-3 group-hover:scale-110 transition-transform">
                    {social.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">
                    {social.name}
                  </span>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
