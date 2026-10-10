"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, UserDTO } from "@/types/model.types";

export async function getAllCustomers(): Promise<ApiResponse<UserDTO[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/User/customers");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<UserDTO[]>;
  }
}

export async function getAllStaff(): Promise<ApiResponse<UserDTO[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/User/staff");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<UserDTO[]>;
  }
}

export async function getUserById(id: number): Promise<ApiResponse<UserDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get(`/User/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<UserDTO>;
  }
}

export async function toggleUserActive(
  id: number,
  isActive: boolean
): Promise<ApiResponse<UserDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.patch(`/User/${id}/status`, { isActive });
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<UserDTO>;
  }
}

export async function updateUserRole(
  id: number,
  role: number
): Promise<ApiResponse<UserDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.patch(`/User/${id}/role`, { role });
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<UserDTO>;
  }
}
