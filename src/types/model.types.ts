// API Response Envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  errorCode?: string;
  errors?: Record<string, string>;
  timestamp?: string;
}

// Product Status Enum
export enum ProductStatus {
  Pending = 0,
  InStock = 1,
  LowStock = 2,
  OutOfStock = 3,
  Hidden = 4,
  PreOrder = 5,
  Deleted = 6,
}

export const ProductStatusLabels: Record<ProductStatus, string> = {
  [ProductStatus.Pending]: "Đang chờ duyệt",
  [ProductStatus.InStock]: "Còn hàng",
  [ProductStatus.LowStock]: "Sắp hết",
  [ProductStatus.OutOfStock]: "Hết hàng",
  [ProductStatus.Hidden]: "Đã ẩn",
  [ProductStatus.PreOrder]: "Đặt trước",
  [ProductStatus.Deleted]: "Đã xóa",
};

// Product Image
export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

// Product Specification
export interface ProductSpecification {
  id: number;
  productId: number;
  specName: string;
  specValue: string;
}

// Product DTO
export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  originalPrice: number;
  discountPrice?: number;
  initialQuantity: number;
  stockQuantity: number;
  soldQuantity: number;
  description?: string;
  status: ProductStatus;
  warrantyPeriod: number;
  categoryId: number;
  brandId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  specifications: ProductSpecification[];
  images: ProductImage[];
  averageRating?: number;
}

// Category
export interface Category {
  id: number;
  code: string;
  categoryName: string;
  slug: string;
  parentCategoryId?: number;
  subCategories?: Category[];
  products?: Product[];
}

// Brand
export interface Brand {
  id: number;
  code: string;
  name: string;
  slug: string;
  logoUrl?: string;
  products?: Product[];
}

// Auth Token Response
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
