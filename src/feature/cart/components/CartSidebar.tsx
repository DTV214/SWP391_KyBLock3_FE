import { X, Plus, Minus, Trash2, Ticket } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function CartSidebar() {
    const { items, isOpen, isLoading, closeCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, applyPromo } = useCart();
    const [promoCode, setPromoCode] = useState('');
    const [promoError, setPromoError] = useState('');

    if (!isOpen) return null;

    const totalPrice = getTotalPrice();
    const totalItems = getTotalItems();
    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        try {
            setPromoError('');
            await applyPromo(promoCode);
        } catch (err: any) {
            setPromoError(err.message);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
                onClick={closeCart}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-screen w-full sm:w-96 bg-white z-[9999] shadow-2xl flex flex-col animate-in slide-in-from-right">
                {/* Header */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-tet-primary">GIỎ HÀNG</h2>
                    <button
                        onClick={closeCart}
                        className="p-2 hover:bg-gray-100 rounded-full transition-all"
                        aria-label="Đóng giỏ hàng"
                    >
                        <X className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-lg">
                    {items.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="text-4xl mb-2">🛒</div>
                                <p className="text-gray-500">Giỏ hàng trống</p>
                            </div>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.productid}
                                className="flex gap-3 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
                            >
                                {/* Product Image */}
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.productname}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tet-secondary to-tet-primary/10">
                                            <span className="text-2xl">🎁</span>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm text-gray-900 line-clamp-2">
                                        {item.productname}
                                    </h3>
                                    <p className="text-sm font-bold text-tet-primary mt-1">
                                        {(item.price || 0).toLocaleString()}đ
                                    </p>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() =>
                                                updateQuantity(
                                                    item.productid!,
                                                    item.cartQuantity - 1
                                                )
                                            }
                                            className="p-1 hover:bg-gray-200 rounded transition-all"
                                            aria-label="Giảm số lượng"
                                        >
                                            <Minus className="h-4 w-4 text-gray-600" />
                                        </button>
                                        <span className="w-8 text-center font-bold text-sm">
                                            {item.cartQuantity}
                                        </span>
                                        <button
                                            onClick={() =>
                                                updateQuantity(
                                                    item.productid!,
                                                    item.cartQuantity + 1
                                                )
                                            }
                                            className="p-1 hover:bg-gray-200 rounded transition-all"
                                            aria-label="Tăng số lượng"
                                        >
                                            <Plus className="h-4 w-4 text-gray-600" />
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => removeFromCart(item.productid!)}
                                            className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                                            aria-label="Xóa sản phẩm"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="flex-shrink-0 border-t border-gray-200 p-6 space-y-4 bg-gray-50">
                        {/* Summary */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Số lượng:</span>
                                <span className="font-bold">{totalItems} sản phẩm</span>
                            </div>
                            <div className="flex justify-between text-lg">
                                <span className="font-bold text-gray-900">Tổng cộng:</span>
                                <span className="font-bold text-tet-primary">
                                    {totalPrice.toLocaleString()}đ
                                </span>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                            className="w-full py-3 bg-gradient-to-r bg-tet-primary text-white rounded-lg font-bold hover:shadow-lg transition-all active:scale-95"
                            onClick={() => {
                                // TODO: Redirect to checkout page
                                console.log('Thanh toán:', { items, totalPrice, totalItems });
                                alert('Chuyển tới trang thanh toán...');
                            }}
                        >
                            Thanh toán
                        </button>

                        {/* Continue Shopping Button */}
                        <button
                            onClick={closeCart}
                            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-100 transition-all"
                        >
                            Tiếp tục mua sắm
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
