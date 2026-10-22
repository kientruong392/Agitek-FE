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

export enum OrderStatus {
  Ordered = 0,
  Confirmed = 1,
  Shipped = 2,
  InTransit = 3,
  Delivered = 4,
  Completed = 5,
  Returned = 6,
  Cancelled = 7,
  Refunded = 8,
  Paid = 9,
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Ordered]: "Chờ thanh toán",
  [OrderStatus.Confirmed]: "Đã xác nhận",
  [OrderStatus.Shipped]: "Đã giao cho đơn vị vận chuyển",
  [OrderStatus.InTransit]: "Đang vận chuyển",
  [OrderStatus.Delivered]: "Đã giao",
  [OrderStatus.Completed]: "Đã giao",
  [OrderStatus.Returned]: "Giao thất bại",
  [OrderStatus.Cancelled]: "Đã hủy",
  [OrderStatus.Refunded]: "Đã hoàn tiền",
  [OrderStatus.Paid]: "Đã thanh toán",
};

export enum PaymentMethod {
  COD = 0,
  Bank = 1,
  Momo = 2,
}

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: "Thanh toán khi nhận hàng",
  [PaymentMethod.Bank]: "Chuyển khoản ngân hàng",
  [PaymentMethod.Momo]: "MoMo",
};

export enum PaymentStatus {
  Pending = 0,
  Success = 1,
  Failed = 2,
  Refunded = 3,
  Expired = 4,
}

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: "Chờ thanh toán",
  [PaymentStatus.Success]: "Thành công",
  [PaymentStatus.Failed]: "Thất bại",
  [PaymentStatus.Refunded]: "Đã hoàn tiền",
  [PaymentStatus.Expired]: "Đã hết hạn",
};

export enum RefundStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export const RefundStatusLabels: Record<RefundStatus, string> = {
  [RefundStatus.Pending]: "Chờ duyệt",
  [RefundStatus.Approved]: "Đã duyệt",
  [RefundStatus.Rejected]: "Từ chối",
};

export enum WarrantyStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Rejected = 3,
}

export const WarrantyStatusLabels: Record<WarrantyStatus, string> = {
  [WarrantyStatus.Pending]: "Chờ duyệt",
  [WarrantyStatus.Processing]: "Đang bảo hành",
  [WarrantyStatus.Completed]: "Hoàn tất",
  [WarrantyStatus.Rejected]: "Từ chối",
};

export interface OrderDetail {
  orderId: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImageUrl?: string | null;
  warrantyPeriod: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  hasReview: boolean;
  reviewId?: number | null;
  hasRefund: boolean;
  refundStatus?: RefundStatus | null;
}

export interface Payment {
  id: number;
  orderId: number;
  orderUserId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  transactionId?: string | null;
  gatewayResponse?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  order?: Order | null;
  qrCodeUrl?: string | null;
  bankId?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  transferDescription?: string | null;
}

export interface Order {
  id: number;
  paymentId?: number | null;
  trackingNumber: string;
  userId: number;
  customerName?: string | null;
  customerPhone?: string | null;
  address: string;
  toLocationId?: number | null;
  toLocation?: LocationDTO | null;
  subtotalPrice: number;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  orderDetails: OrderDetail[];
  deliveredByUserId?: number | null;
  orderTrackingLogs?: OrderTrackingLog[];
  medias?: { id?: number; mediaUrl: string; mediaType: MediaType }[];
}

export interface Refund {
  orderId: number;
  productId: number;
  quantity: number;
  userId: number;
  approvedByUserId?: number | null;
  amount: number;
  reason: string;
  response?: string | null;
  status: RefundStatus;
  createdAt: string;
  updatedAt: string;
  orderDetail?: OrderDetail | null;
  order?: Order | null;
  user?: UserDTO | null;
  approvedByUser?: UserDTO | null;
  medias: ReviewMedia[];
}

export interface Warranty {
  id: number;
  code: string;
  orderId: number;
  productId: number;
  quantity: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  productCondition: string;
  status: WarrantyStatus;
  response?: string | null;
  startDate?: string | null;
  completedDate?: string | null;
  createdAt: string;
  updatedAt: string;
  orderDetail?: OrderDetail | null;
  order?: Order | null;
  user?: UserDTO | null;
  medias: ReviewMedia[];
}

export interface OrderTrackingLog {
  id: number;
  orderId: number;
  locationId?: number | null;
  description: string;
  timestamp: string;
  locationCode?: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

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

export enum MediaType {
  Image = 0,
  Video = 1,
}

export interface ReviewMedia {
  id: number;
  mediaUrl: string;
  mediaType: MediaType;
}

export interface ReviewUser {
  id: number;
  profile: {
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface ProductReview {
  id: number;
  orderId: number;
  productId: number;
  userId: number;
  user?: ReviewUser | null;
  rating: number;
  comment?: string | null;
  replyUserId?: number | null;
  replyComment?: string | null;
  replyCreatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  medias: ReviewMedia[];
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

export interface Address {
  id: number;
  userId: number;
  receiverName: string;
  phoneNumber: string;
  addressLine: string;
  isDefault: boolean;
}

export interface UpdateMyAccountInput {
  username?: string;
}

export interface ChangeMyPasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: GenderType | null;
  dateOfBirth?: string | null;
}

export interface CreateAddressInput {
  receiverName: string;
  phoneNumber: string;
  addressLine: string;
  isDefault: boolean;
}

export interface UpdateAddressInput {
  receiverName?: string;
  phoneNumber?: string;
  addressLine?: string;
  isDefault?: boolean;
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

// Discount Type Enum
export enum DiscountType {
  Percentage = 0,
  FixedAmount = 1,
}

export const DiscountTypeLabels: Record<DiscountType, string> = {
  [DiscountType.Percentage]: "Phần trăm (%)",
  [DiscountType.FixedAmount]: "Giá tiền (₫)",
};

// Voucher Status Enum
export enum VoucherStatus {
  Active = 0,
  Inactive = 1,
  Expired = 2,
  LowStock = 3,
  OutOfStock = 4,
}

export const VoucherStatusLabels: Record<VoucherStatus, string> = {
  [VoucherStatus.Active]: "Hoạt động",
  [VoucherStatus.Inactive]: "Không hoạt động",
  [VoucherStatus.Expired]: "Đã hết hạn",
  [VoucherStatus.LowStock]: "Sắp hết",
  [VoucherStatus.OutOfStock]: "Đã hết",
};

// Voucher DTO
export interface VoucherApplication {
  voucherId: number;
  code: string;
  discountAmount: number;
}

export interface VoucherDTO {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountValue?: number;
  minOrderValue: number;
  initialQuantity: number;
  quantity: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: VoucherStatus;
}

// Location Status Enum
export enum LocationStatus {
  Active = 0,
  Inactive = 1,
  Maintenance = 2,
}

export const LocationStatusLabels: Record<LocationStatus, string> = {
  [LocationStatus.Active]: "Hoạt động",
  [LocationStatus.Inactive]: "Ngừng hoạt động",
  [LocationStatus.Maintenance]: "Bảo trì",
};

// Location DTOs
export interface LocationDTO {
  id: number;
  locationCode: string;
  locationName: string;
  latitude: number;
  longitude: number;
  isWarehouse: boolean;
  status: LocationStatus | null;
}

export interface CreateLocationDTO {
  locationCode: string;
  locationName: string;
  latitude: number;
  longitude: number;
  isWarehouse: boolean;
  status?: LocationStatus | null;
}

export interface UpdateLocationDTO {
  locationCode?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  isWarehouse?: boolean;
  status?: LocationStatus | null;
}

