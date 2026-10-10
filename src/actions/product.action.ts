"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, Product } from "@/types/model.types";

export async function getAllProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/Product");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Product[]>;
  }
}

export async function getProductById(id: number): Promise<ApiResponse<Product>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get(`/Product/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Product>;
  }
}

export async function createProduct(data: Record<string, unknown>): Promise<ApiResponse<Product>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.post("/Product", data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Product>;
  }
}

export async function updateProduct(
  id: number,
  data: Record<string, unknown>
): Promise<ApiResponse<Product>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.patch(`/Product/${id}`, data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Product>;
  }
}

export async function softDeleteProduct(id: number): Promise<ApiResponse> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.delete(`/Product/${id}/soft`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse;
  }
}

export async function hardDeleteProduct(id: number): Promise<ApiResponse> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.delete(`/Product/${id}/hard`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse;
  }
}

export async function restoreProduct(id: number): Promise<ApiResponse> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.patch(`/Product/${id}/restore`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse;
  }
}
