import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from '@/api/productService';
import { cartService, type CartResponse, type AddToCartRequest } from '@/api/cartService';

export interface CartItem extends Product {
    cartQuantity: number;
    cartDetailId?: number;
}

interface CartContextType {
    items: CartItem[];
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    addToCart: (product: Product, quantity?: number) => Promise<void>;
    removeFromCart: (productId: number) => Promise<void>;
    updateQuantity: (productId: number, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    openCart: () => void;
    closeCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
    syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [itemCount, setItemCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper: Get token
    const getToken = () => localStorage.getItem('token');

    // Hàm cập nhật state chung từ CartResponse
    const updateCartState = (response: CartResponse) => {
        const updatedItems = response.items.map((item) => ({
            productid: item.productId,
            productname: item.productName,
            price: item.price,
            imageUrl: item.imageUrl1,
            sku: item.sku,
            cartQuantity: item.quantity,
            cartDetailId: item.cartDetailId,
        }));
        setItems(updatedItems);
        setItemCount(response.itemCount || 0); // Cập nhật số lượng mới từ API
    };

    // Hàm lấy riêng số lượng (nhanh hơn lấy toàn bộ giỏ hàng)
    const fetchCount = async () => {
        const token = getToken();
        if (token) {
            try {
                console.log('✅ Cart count fetching...');
                const count = await cartService.getCartCount(token);
                console.log('✅ Cart count fetched:', count);
                setItemCount(count);
            } catch (err: any) {
                console.error(err.response?.data || err.message || 'Error fetching cart count');
            }
        }
    };

    useEffect(() => {
        fetchCount();
    }, []);

    /**
     * Thêm sản phẩm vào giỏ hàng (gọi API)
     */
    const addToCart = async (product: Product, quantity: number = 1) => {
        try {
            setIsLoading(true);
            setError(null);

            const token = getToken();
            if (!token) {
                setError('Vui lòng đăng nhập để sử dụng giỏ hàng');
                return;
            }

            const request: AddToCartRequest = {
                productId: product.productid!,
                quantity,
            };

            console.log('📤 Adding to cart:', request);
            const response = await cartService.addToCart(request, token);
            console.log('✅ Cart response:', response);

            // Update local state from server response
            updateCartState(response);

            // Tự động mở sidebar
            setIsOpen(true);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Lỗi khi thêm vào giỏ hàng';
            setError(message);
            console.error('❌ Error adding to cart:', message);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Xóa sản phẩm khỏi giỏ hàng (gọi API)
     */
    const removeFromCart = async (productId: number) => {
        try {
            setIsLoading(true);
            setError(null);

            const token = getToken();
            if (!token) {
                setError('Vui lòng đăng nhập');
                return;
            }

            // Tìm cartDetailId từ items
            const item = items.find((i) => i.productid === productId);
            if (!item?.cartDetailId) {
                setError('Không tìm thấy sản phẩm trong giỏ');
                return;
            }

            console.log('🗑️ Removing from cart:', item.cartDetailId);
            const response = await cartService.removeCartItem(item.cartDetailId, token);
            console.log('✅ Cart after removal:', response);

            updateCartState(response);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Lỗi khi xóa sản phẩm';
            setError(message);
            console.error('❌ Error removing from cart:', message);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Cập nhật số lượng sản phẩm (gọi API)
     */
    const updateQuantity = async (productId: number, quantity: number) => {
        try {
            setIsLoading(true);
            setError(null);

            if (quantity < 1) {
                await removeFromCart(productId);
                return;
            }

            const token = getToken();
            if (!token) {
                setError('Vui lòng đăng nhập');
                return;
            }

            const item = items.find((i) => i.productid === productId);
            if (!item?.cartDetailId) {
                setError('Không tìm thấy sản phẩm trong giỏ');
                return;
            }

            console.log('📝 Updating quantity:', item.cartDetailId, quantity);
            const response = await cartService.updateCartItem(item.cartDetailId, quantity, token);
            console.log('✅ Cart after update:', response);

            updateCartState(response);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Lỗi khi cập nhật số lượng';
            setError(message);
            console.error('❌ Error updating quantity:', message);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Xóa toàn bộ giỏ hàng (gọi API)
     */
    const clearCart = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = getToken();
            if (!token) {
                setError('Vui lòng đăng nhập');
                return;
            }

            console.log('🗑️ Clearing entire cart');
            await cartService.clearCart(token);
            console.log('✅ Cart cleared');

            setItems([]);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Lỗi khi xóa giỏ hàng';
            setError(message);
            console.error('❌ Error clearing cart:', message);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Đồng bộ giỏ hàng từ server (gọi khi app load)
     */
    const syncCart = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = getToken();
            if (!token) {
                // User chưa đăng nhập, giỏ hàng rỗng
                setItems([]);
                return;
            }

            console.log('🔄 Syncing cart from server');
            const response = await cartService.getCart(token);
            console.log('✅ Cart synced:', response);

            updateCartState(response);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Lỗi khi đồng bộ giỏ hàng';
            console.error('❌ Error syncing cart:', message);
            // Không set error vì sync cache không critical
        } finally {
            setIsLoading(false);
        }
    };

    const openCart = async () => {
        await syncCart();
        setIsOpen(true);
    }
    const closeCart = () => setIsOpen(false);

    const getTotalPrice = () => {
        return items.reduce((total, item) => {
            return total + ((item.price || 0) * item.cartQuantity);
        }, 0);
    };

    const getTotalItems = () => itemCount || 0;

    const value: CartContextType = {
        items,
        isOpen,
        isLoading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        getTotalPrice,
        getTotalItems,
        syncCart
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
