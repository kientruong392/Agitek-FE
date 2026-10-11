"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, VoucherDTO } from "@/types/model.types";

export async function getAllVouchers(): Promise<ApiResponse<VoucherDTO[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/Voucher");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<VoucherDTO[]>;
  }
}

export async function getVoucherById(id: number): Promise<ApiResponse<VoucherDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get(`/Voucher/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<VoucherDTO>;
  }
}

export async function createVoucher(data: Record<string, unknown>): Promise<ApiResponse<VoucherDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.post("/Voucher", data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<VoucherDTO>;
  }
}

export async function updateVoucher(
  id: number,
  data: Record<string, unknown>
): Promise<ApiResponse<VoucherDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.patch(`/Voucher/${id}`, data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<VoucherDTO>;
  }
}
