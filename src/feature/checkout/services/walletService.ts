import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/apiConfig';

// DTO interfaces for Wallet
export interface WalletResponse {
    walletId: number;
    accountId: number;
    balance: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Lấy thông tin ví của người dùng
 * GET /api/wallet
 */
export const getWallet = async (token?: string): Promise<WalletResponse | null> => {
    try {
        const response = await axiosClient.get<WalletResponse>(
            API_ENDPOINTS.WALLET.GET,
            {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching wallet:', error);
        return null;
    }
};

// Export all as object for easier importing
export const walletService = {
    getWallet,
};
