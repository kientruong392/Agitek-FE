"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, Warranty, WarrantyStatus } from "@/types/model.types";

export interface CreateWarrantyInput {
  orderId: number;
  productId: number;
  quantity: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  productCondition: string;
  medias: { mediaUrl: string }[];
}

export interface ProcessWarrantyInput {
  status: WarrantyStatus.Processing | WarrantyStatus.Completed | WarrantyStatus.Rejected;
  response: string;
}

export async function createWarranty(input: CreateWarrantyInput): Promise<ApiResponse<Warranty>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post("/Warranty", input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Warranty>;
  }
}

export async function getMyWarranties(): Promise<ApiResponse<Warranty[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Warranty/my");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Warranty[]>;
  }
}

export async function getManagementWarranties(): Promise<ApiResponse<Warranty[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Warranty");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Warranty[]>;
  }
}

export async function processWarranty(
  id: number,
  input: ProcessWarrantyInput,
): Promise<ApiResponse<Warranty>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch(`/Warranty/${id}/approve`, input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Warranty>;
  }
}
