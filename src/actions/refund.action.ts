"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, Refund, RefundStatus } from "@/types/model.types";

export interface CreateRefundInput {
  orderId: number;
  productId: number;
  quantity: number;
  reason: string;
  medias: { mediaUrl: string }[];
}

export interface ApproveRefundInput {
  status: RefundStatus.Approved | RefundStatus.Rejected;
  response: string;
}

export async function createRefund(input: CreateRefundInput): Promise<ApiResponse<Refund>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post("/Refund", input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Refund>;
  }
}

export async function getManagementRefunds(): Promise<ApiResponse<Refund[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Refund");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Refund[]>;
  }
}

export async function approveRefund(
  orderId: number,
  productId: number,
  input: ApproveRefundInput
): Promise<ApiResponse<Refund>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch(`/Refund/${orderId}/${productId}`, input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Refund>;
  }
}
