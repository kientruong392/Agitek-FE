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
  productName: string;
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

// Role Name Enum
export enum RoleName {
  SuperAdmin = 0,
  Admin = 1,
  Manager = 2,
  Staff = 3,
  Delivery = 4,
  Customer = 5,
  Guest = 6,
}

export const RoleNameLabels: Record<RoleName, string> = {
  [RoleName.SuperAdmin]: "Super Admin",
  [RoleName.Admin]: "Admin",
  [RoleName.Manager]: "Quản lý",
  [RoleName.Staff]: "Nhân viên",
  [RoleName.Delivery]: "Giao hàng",
  [RoleName.Customer]: "Khách hàng",
  [RoleName.Guest]: "Khách",
};

// Gender Type Enum
export enum GenderType {
  Male = 0,
  Female = 1,
  Other = 2,
}

export const GenderTypeLabels: Record<GenderType, string> = {
  [GenderType.Male]: "Nam",
  [GenderType.Female]: "Nữ",
  [GenderType.Other]: "Khác",
};

// User Profile
export interface UserProfile {
  userId: number;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: GenderType;
  dateOfBirth?: string;
}

// Granted By User (simplified)
export interface GrantedByUser {
  id: number;
  username: string;
}

// User DTO
export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: RoleName;
  roleGrantedAt?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  grantedByUser?: GrantedByUser;
  profile: UserProfile;
}
