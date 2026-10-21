"use server";

import axios from "axios";
import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, Order, OrderTrackingLog, VoucherApplication } from "@/types/model.types";

function getOrderActionError(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
    const response = error.response.data as Partial<ApiResponse>;
    const validationErrors = response.errors
      ? Object.values(response.errors).filter(Boolean).join("; ")
      : undefined;
    return {
      success: false,
      statusCode: error.response.status,
      errorCode: response.errorCode ?? "ORDER_REQUEST_FAILED",
      message: validationErrors ? `${response.message ?? "Validation failed"}: ${validationErrors}` : response.message ?? error.message,
      errors: response.errors,
    };
  }
  return getDefaultError(error);
}

export type ShippingType = 0 | 1;
export type CheckoutPaymentMethod = 0 | 1;
export type CreateDeliveryLocationInput = { latitude: number; longitude: number };
export type CreateOrderInput = {
  voucherId?: number | null;
  voucherCode?: string | null;
  addressId?: number | null;
  shippingType: ShippingType;
  paymentMethod: CheckoutPaymentMethod;
  note?: string;
  createLocation?: CreateDeliveryLocationInput | null;
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
export type ConfirmOrderInput = { status: number; deliveredByUserId: number; startingWarehouseId: number; startingWarehouseDescription?: string; createLocation?: CreateDeliveryLocationInput };
export type AddTrackingPointInput = { locationId: number; description: string };

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
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Order");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Order[]>;
  }
}

export async function getManagementOrders(): Promise<ApiResponse<Order[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Order");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Order[]>;
  }
}

export async function getDeliveryUsers(): Promise<ApiResponse<{ id: number; username: string; fullName: string }[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Order/delivery-users");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<{ id: number; username: string; fullName: string }[]>;
  }
}

export async function confirmOrder(id: number, input: ConfirmOrderInput): Promise<ApiResponse<Order>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch(`/Order/${id}/confirm`, input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Order>;
  }
}

export async function getOrderTracking(id: number): Promise<ApiResponse<OrderTrackingLog[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get(`/Order/${id}/tracking`);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<OrderTrackingLog[]>;
  }
}

export async function addOrderTrackingPoint(id: number, input: AddTrackingPointInput): Promise<ApiResponse<OrderTrackingLog[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post(`/Order/${id}/tracking`, input);
    return response.data;
  } catch (error) {
    return getOrderActionError(error) as ApiResponse<OrderTrackingLog[]>;
  }
}

export async function startOrderTransit(id: number): Promise<ApiResponse<Order>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch(`/Order/${id}/in-transit`);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Order>;
  }
}

export async function shipOrder(id: number, input: { status: number; medias: { mediaUrl: string }[] }): Promise<ApiResponse<Order>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch(`/Order/${id}/ship`, input);
    return response.data;
  } catch (error) {
    return getOrderActionError(error) as ApiResponse<Order>;
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
