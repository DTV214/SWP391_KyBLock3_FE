import { motion } from "framer-motion";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id?: number | string;
  title: string;
  price: string | number;
  img: string;
}

export default function ProductCard({ id, title, price, img }: ProductCardProps) {
  const content = (
    <>
      <div className="relative h-72 overflow-hidden">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      <div className="p-6 space-y-4 text-center">
        <h3 className="font-bold text-tet-primary text-lg">{title}</h3>
        <p className="text-2xl font-black text-tet-primary">{price}</p>
      </div>
    </>
  );

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 transition-all group"
    >
      {id ? (
        <Link to={`/product/${id}`} className="block text-inherit no-underline">
          {content}
        </Link>
      ) : (
        content
      )}

      <div className="px-6 pb-6 space-y-4 text-center">
        {/* Bộ tăng giảm số lượng & Nút thêm */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-center gap-4 bg-gray-50 py-2 rounded-full border border-gray-100">
            <button className="text-gray-400 hover:text-tet-primary">
              <Minus size={16} />
            </button>
            <span className="font-bold text-sm">1</span>
            <button className="text-gray-400 hover:text-tet-primary">
              <Plus size={16} />
            </button>
          </div>
          <button className="bg-tet-primary text-white py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-tet-accent transition-colors shadow-md">
            <ShoppingCart size={18} /> Thêm vào giỏ
          </button>
        </div>
      </div>
    </motion.div>
  );
}
