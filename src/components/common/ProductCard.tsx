// src/components/common/ProductCard.tsx
import { useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProductCard({
  id,
  title,
  price,
  image,
  onAddToCart,
}: {
  id?: number | string;
  title: string;
  price: string;
  image: string;
  onAddToCart?: (quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () => setQuantity((q) => q + 1);

  return (
    <Link to={id ? `/product/${id}` : "#"}
      className="block group"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-transparent hover:border-tet-secondary hover:shadow-xl transition-all group relative">
        {/* Best Seller badge removed */}

        <div className="aspect-square overflow-hidden rounded-xl mb-4">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        <h3 className="font-serif text-tet-primary text-lg mb-2 line-clamp-1">
          {title}
        </h3>
        <p className="text-tet-accent font-bold text-xl mb-4">{price}đ</p>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-full px-2 py-1 gap-3">
            <button onClick={e => { e.preventDefault(); decrease(); }} className="text-gray-400 hover:text-tet-primary transition-colors">
              <Minus size={14} />
            </button>
            <span className="text-sm font-bold w-4 text-center">{quantity}</span>
            <button onClick={e => { e.preventDefault(); increase(); }} className="text-gray-400 hover:text-tet-primary transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={e => { e.preventDefault(); onAddToCart?.(quantity); }}
            className="flex-1 bg-tet-primary text-white py-2 rounded-full flex items-center justify-center gap-2 text-sm font-bold hover:brightness-110 transition-all"
          >
            <ShoppingCart size={16} /> Thêm vào giỏ
          </button>
        </div>
        {/* Delivery info removed */}
      </div>
    </Link>
  );
}
