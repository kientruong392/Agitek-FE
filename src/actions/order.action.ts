"use server";

import { auth } from "@/auth";
import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, Order, VoucherApplication } from "@/types/model.types";

export type ShippingType = 0 | 1;
export type CheckoutPaymentMethod = 0 | 1;
export type CreateOrderInput = {
  voucherId?: number | null;
  voucherCode?: string | null;
  addressId?: number | null;
  shippingType: ShippingType;
  paymentMethod: CheckoutPaymentMethod;
  note?: string;
  orderDetails: { productId: number; quantity: number; unitPrice: number; totalPrice: number }[];
};
export type GuestCheckoutInput = Omit<CreateOrderInput, "addressId"> & {
  createGuest: { fullName: string; phoneNumber: string; address: string };
};
export type CreatedOrder = {
  id: number;
  paymentId?: number | null;
  trackingNumber: string;
  totalPrice: number;
  orderDetails: { productId: number; quantity: number; totalPrice: number }[];
};
export type PublicPayment = {
  orderId: number;
  amount: number;
  paymentMethod: CheckoutPaymentMethod;
  status: number;
  orderStatus: number;
  expiresAt?: string | null;
  paidAt?: string | null;
  qrCodeUrl?: string | null;
  bankId?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  transferDescription?: string | null;
};

export async function createOrder(input: CreateOrderInput): Promise<ApiResponse<CreatedOrder>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<CreatedOrder>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post("/Order", input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<CreatedOrder>;
  }
}

export async function createGuestOrder(input: GuestCheckoutInput): Promise<ApiResponse<CreatedOrder>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post("/Order/guest", input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<CreatedOrder>;
  }
}

export async function getMyOrders(): Promise<ApiResponse<Order[]>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<Order[]>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Order");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Order[]>;
  }
}

export async function getPublicPayment(orderId: number, trackingNumber: string): Promise<ApiResponse<PublicPayment>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get(`/sepay/payment/${orderId}`, { params: { trackingNumber } });
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<PublicPayment>;
  }
}

export async function applyVoucher(code: string, subtotalPrice: number): Promise<ApiResponse<VoucherApplication>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post("/Voucher/apply", { code, subtotalPrice });
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<VoucherApplication>;
  }
}
