"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, Category } from "@/types/model.types";
import type { CategoryInput } from "@/schemas/category.schema";

export async function getAllCategoriesWithSub(): Promise<ApiResponse<Category[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/Category/with-subcategories");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Category[]>;
  }
}

export async function getAllCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/Category");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Category[]>;
  }
}

export async function getCategoryById(id: number): Promise<ApiResponse<Category>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get(`/Category/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Category>;
  }
}

export async function getCategoryByIdWithProducts(id: number): Promise<ApiResponse<Category>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get(`/Category/${id}/products`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Category>;
  }
}

export async function createCategory(data: CategoryInput): Promise<ApiResponse<Category>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.post("/Category", data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Category>;
  }
}

export async function updateCategory(
  id: number,
  data: Partial<CategoryInput>
): Promise<ApiResponse<Category>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.patch(`/Category/${id}`, data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Category>;
  }
}

export async function deleteCategory(id: number): Promise<ApiResponse> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.delete(`/Category/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse;
  }
}
