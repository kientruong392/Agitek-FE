"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, Payment } from "@/types/model.types";

export async function getManagementPayments(): Promise<ApiResponse<Payment[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Payment");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Payment[]>;
  }
}
