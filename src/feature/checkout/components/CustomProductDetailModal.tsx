'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { productService } from '@/api/productService';

interface ProductDetail {
    productdetailid: number;
    productparentid: number;
    productid: number;
    categoryid: number;
    productname: string;
    unit: number;
    price: number;
    imageurl: string;
    quantity: number;
    childProduct: any;
}

interface ProductData {
    productid: number;
    categoryid: number | null;
    configid: number;
    accountid: number;
    sku: string | null;
    productname: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    status: string;
    stocks: any[];
    totalQuantity: number;
    unit: number;
    isCustom: boolean;
    productDetails: ProductDetail[];
}

interface CustomProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
}

export default function CustomProductDetailModal({
    isOpen,
    onClose,
    productId,
    productName,
}: CustomProductDetailModalProps) {
    const [product, setProduct] = useState<ProductData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && productId) {
            loadProductDetails();
        }
    }, [isOpen, productId]);

    const loadProductDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await productService.getById(productId);

            // Handle different response structures
            const productData = response?.data || response;
            setProduct(productData);
        } catch (err: any) {
            console.error('Error loading product details:', err);
            setError('Không thể tải chi tiết sản phẩm. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-102 w-full max-w-2xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-auto">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-tet-primary">
                            Chi tiết Quà Tặng
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">{productName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-tet-primary" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                            {error}
                        </div>
                    ) : product?.productDetails && product.productDetails.length > 0 ? (
                        <div className="space-y-4">
                            {product.productDetails.map((detail) => {
                                const unitPrice = detail.quantity > 0 ? detail.price / detail.quantity : detail.price;
                                const totalPrice = detail.price;

                                return (
                                    <div
                                        key={detail.productdetailid}
                                        className="bg-gradient-to-r from-tet-primary/5 to-tet-secondary/5 border border-tet-primary/20 rounded-xl p-4 hover:border-tet-primary/40 transition-colors"
                                    >
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                {detail.imageurl ? (
                                                    <img
                                                        src={detail.imageurl}
                                                        alt={detail.productname}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tet-secondary to-tet-primary/10">
                                                        <span className="text-2xl">🎁</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1">
                                                <h3 className="font-bold text-tet-primary text-base">
                                                    {detail.productname}
                                                </h3>

                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    {/* Số lượng */}
                                                    <div className="bg-white rounded-lg p-3 border border-tet-primary/10">
                                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                                                            Số lượng
                                                        </p>
                                                        <p className="text-lg font-bold text-tet-primary">
                                                            {detail.quantity}
                                                        </p>
                                                    </div>

                                                    {/* Giá mỗi cái */}
                                                    <div className="bg-white rounded-lg p-3 border border-tet-primary/10">
                                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                                                            Giá mỗi cái
                                                        </p>
                                                        <p className="text-lg font-bold text-tet-primary">
                                                            {unitPrice.toLocaleString()}đ
                                                        </p>
                                                    </div>

                                                    {/* Tổng tiền */}
                                                    <div className="col-span-2 bg-gradient-to-r from-tet-primary/10 to-tet-secondary/10 rounded-lg p-3 border border-tet-primary/20">
                                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                                                            Tổng tiền
                                                        </p>
                                                        <p className="text-2xl font-bold text-tet-primary italic">
                                                            {totalPrice.toLocaleString()}đ
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Total Section */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-tet-primary/10 to-tet-secondary/10 rounded-xl border border-tet-primary/20">
                                    <span className="text-lg font-serif font-bold text-tet-primary uppercase">
                                        Tổng Cộng
                                    </span>
                                    <p className="text-2xl font-black text-tet-primary italic">
                                        {product.price.toLocaleString()}đ
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>Không có chi tiết sản phẩm</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
