"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, Brand } from "@/types/model.types";
import type { BrandInput } from "@/schemas/brand.schema";

export async function getAllBrands(): Promise<ApiResponse<Brand[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/Brand");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Brand[]>;
  }
}

export async function getBrandById(id: number): Promise<ApiResponse<Brand>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get(`/Brand/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Brand>;
  }
}

export async function getBrandByIdWithProducts(id: number): Promise<ApiResponse<Brand>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get(`/Brand/${id}/products`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Brand>;
  }
}

export async function createBrand(data: BrandInput): Promise<ApiResponse<Brand>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.post("/Brand", data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Brand>;
  }
}

export async function updateBrand(
  id: number,
  data: Partial<BrandInput>
): Promise<ApiResponse<Brand>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.patch(`/Brand/${id}`, data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Brand>;
  }
}

export async function deleteBrand(id: number): Promise<ApiResponse> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.delete(`/Brand/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse;
  }
}
