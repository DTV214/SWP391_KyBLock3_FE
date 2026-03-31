import type { StockDto, ProductDto } from "@/api/dtos/product.dto";

/**
 * Utility to calculate and filter products based on their actual inventory status on the FE.
 */
export const stockUtils = {
  /**
   * Aggregates total available quantity from a list of stocks.
   * Filters out deleted and expired batches.
   */
  calculateTotalAvailableQuantity: (stocks: StockDto[]): number => {
    const now = new Date();
    return stocks.reduce((sum, stock) => {
      // Basic status check
      if (stock.status !== "ACTIVE") return sum;

      // Expiry check
      if (stock.expiryDate) {
        const expiry = new Date(stock.expiryDate);
        if (expiry < now) return sum;
      }

      return sum + (stock.quantity || 0);
    }, 0);
  },

  /**
   * Filters a list of products to only include those that are currently in stock.
   * This is useful for customer-facing pages.
   */
  filterInStockProducts: (products: ProductDto[], allStocks: StockDto[]): ProductDto[] => {
    // 1. Create a map of product availability for quick lookup
    const availabilityMap = new Map<number, number>();
    
    // Group and sum quantities
    allStocks.forEach(stock => {
      if (!stock.productId) return;
      
      const currentSum = availabilityMap.get(stock.productId) || 0;
      const isAvailable = stock.status === "ACTIVE" && 
                          (!stock.expiryDate || new Date(stock.expiryDate) >= new Date());
      
      if (isAvailable) {
        availabilityMap.set(stock.productId, currentSum + (stock.quantity || 0));
      }
    });

    // 2. Filter products
    return products.filter(product => {
      if (!product.productid) return false;

      // Check if it's a simple product
      if (!product.configid) {
        const qty = availabilityMap.get(product.productid) || 0;
        return qty > 0;
      }

      // If it's a Basket/Combo template, we implicitly trust the ACTIVE status or 
      // if it has its own stock record, we check it.
      // If the template relies on its children, we check them.
      if (product.productDetails && product.productDetails.length > 0) {
        return product.productDetails.every(pd => {
          if (!pd.productid) return true;
          return (availabilityMap.get(pd.productid) || 0) >= (pd.quantity || 1);
        });
      }

      // Default to checking the product's own quantity if available
      return (product.totalQuantity || 0) > 0 || (availabilityMap.get(product.productid) || 0) > 0;
    });
  }
};
