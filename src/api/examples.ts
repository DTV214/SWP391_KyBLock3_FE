// Example usage of the API services
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  productService,
  categoryService,
  configService,
  configDetailService,
  productDetailService,
  type ValidationStatus,
} from '@/api';

// ===================================
// 1. PRODUCTS - Basic Operations
// ===================================

// Get all products (public)
export const fetchAllProducts = async () => {
  try {
    const products = await productService.getAll();
    console.log('All products:', products);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get product by ID
export const fetchProductById = async (productId: number) => {
  try {
    const product = await productService.getById(productId);
    console.log('Product detail:', product);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// ===================================
// 2. TEMPLATES - Clone Feature
// ===================================

// Get all template baskets
export const fetchTemplates = async () => {
  try {
    const templates = await productService.templates.getAll();
    console.log('Available templates:', templates);
    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Clone a template (Customer)
export const cloneTemplate = async (templateId: number, customName?: string, token?: string) => {
  try {
    const userToken = token || localStorage.getItem('token') || '';
    const result = await productService.templates.clone(
      templateId,
      { customName },
      userToken
    );
    console.log('Cloned basket:', result);
    return result;
  } catch (error) {
    console.error('Error cloning template:', error);
    throw error;
  }
};

// ===================================
// 3. BASKET CUSTOMIZATION
// ===================================

// Get items in a basket
export const fetchBasketItems = async (basketId: number) => {
  try {
    const items = await productDetailService.getByParent(basketId);
    console.log('Basket items:', items);
    return items;
  } catch (error) {
    console.error('Error fetching basket items:', error);
    throw error;
  }
};

// Add product to basket
export const addProductToBasket = async (
  basketId: number,
  productId: number,
  quantity: number,
  token?: string
) => {
  try {
    const userToken = token || localStorage.getItem('token') || '';
    const result = await productDetailService.create(
      {
        productparentid: basketId,
        productid: productId,
        quantity: quantity,
      },
      userToken
    );
    console.log('Product added to basket:', result);
    return result;
  } catch (error) {
    console.error('Error adding product to basket:', error);
    throw error;
  }
};

// Update product quantity in basket
export const updateBasketItemQuantity = async (
  detailId: number,
  newQuantity: number,
  token?: string
) => {
  try {
    const userToken = token || localStorage.getItem('token') || '';
    const result = await productDetailService.update(
      {
        productdetailid: detailId,
        quantity: newQuantity,
      },
      userToken
    );
    console.log('Quantity updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating quantity:', error);
    throw error;
  }
};

// Remove product from basket
export const removeFromBasket = async (detailId: number, token?: string) => {
  try {
    const userToken = token || localStorage.getItem('token') || '';
    const result = await productDetailService.delete(detailId, userToken);
    console.log('Product removed from basket:', result);
    return result;
  } catch (error) {
    console.error('Error removing product:', error);
    throw error;
  }
};

// ===================================
// 4. VALIDATION
// ===================================

// Check if basket is valid according to config rules
export const validateBasket = async (basketId: number) => {
  try {
    const status = (await productService.getValidationStatus(basketId)) as unknown as ValidationStatus;
    console.log('Validation status:', status);
    
    if (!status.isValid) {
      console.warn('Basket is not valid:');
      status.warnings.forEach((warning: string) => console.warn('- ' + warning));
    }
    
    if (status.weightExceeded) {
      console.error(`Weight exceeded: ${status.currentWeight}g / ${status.maxWeight}g`);
    }
    
    return status;
  } catch (error) {
    console.error('Error validating basket:', error);
    throw error;
  }
};

// ===================================
// 5. CATEGORIES
// ===================================

// Get all categories
export const fetchCategories = async () => {
  try {
    const categories = await categoryService.getAll();
    console.log('Categories:', categories);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// ===================================
// 6. CONFIGS
// ===================================

// Get all configs (basket templates)
export const fetchConfigs = async () => {
  try {
    const configs = await configService.getAll();
    console.log('Configs:', configs);
    return configs;
  } catch (error) {
    console.error('Error fetching configs:', error);
    throw error;
  }
};

// Get config details (rules)
export const fetchConfigDetails = async (configId: number) => {
  try {
    const details = await configDetailService.getByConfig(configId);
    console.log('Config details:', details);
    return details;
  } catch (error) {
    console.error('Error fetching config details:', error);
    throw error;
  }
};

// ===================================
// 7. COMPLETE FLOW EXAMPLE
// ===================================

// Complete flow: Browse templates → Clone → Customize → Validate
export const completeBasketFlow = async () => {
  try {
    // 1. Browse available templates
    const templates = (await fetchTemplates()) as unknown as any[];
    const selectedTemplate = templates[0] as any; // User selects first template
    
    // 2. Clone the template
    const cloneResult = (await cloneTemplate(
      selectedTemplate.productid,
      'My Custom Basket'
    )) as any;
    const newBasketId = cloneResult?.basketId ?? cloneResult?.data?.basketId;
    
    // 3. View items in the cloned basket
    const items = (await fetchBasketItems(newBasketId)) as unknown as any[];
    console.log(`Basket has ${items.length} items`);
    
    // 4. Customize: Remove an item
    if (items.length > 0) {
      await removeFromBasket(items[0].productdetailid);
    }
    
    // 5. Customize: Add a new product
    await addProductToBasket(newBasketId, 25, 2); // productId=25, quantity=2
    
    // 6. Validate before checkout
    const validation = await validateBasket(newBasketId);
    
    if (validation.isValid) {
      console.log('✅ Basket is ready for checkout!');
      return { success: true, basketId: newBasketId };
    } else {
      console.log('❌ Please fix validation errors before checkout');
      return { success: false, warnings: validation.warnings };
    }
  } catch (error) {
    console.error('Flow error:', error);
    throw error;
  }
};

// ===================================
// 8. ADMIN OPERATIONS
// ===================================

// Set a basket as template (Admin/Staff only)
export const setAsTemplate = async (productId: number, token?: string) => {
  try {
    const adminToken = token || localStorage.getItem('token') || '';
    const result = await productService.templates.setAsTemplate(productId, adminToken);
    console.log('Product set as template:', result);
    return result;
  } catch (error) {
    console.error('Error setting template:', error);
    throw error;
  }
};

// Create a new category (Admin/Staff only)
export const createCategory = async (categoryName: string, token?: string) => {
  try {
    const adminToken = token || localStorage.getItem('token') || '';
    const result = await categoryService.create(
      { categoryname: categoryName },
      adminToken
    );
    console.log('Category created:', result);
    return result;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};
