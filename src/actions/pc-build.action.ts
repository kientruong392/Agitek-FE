"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, PcBuild, PcComponentType, Product } from "@/types/model.types";

export async function getPcBuilds(): Promise<ApiResponse<PcBuild[]>> {
  try {
    const axios = await createServerAxios();
    return (await axios.get("/PcBuild")).data;
  } catch (error) { return getDefaultError(error) as ApiResponse<PcBuild[]>; }
}

export async function getPcBuildProducts(component: PcComponentType, productIds: number[]): Promise<ApiResponse<Product[]>> {
  try {
    const axios = await createServerAxios();
    return (await axios.post(`/PcBuild/products/${component}`, { productIds })).data;
  } catch (error) { return getDefaultError(error) as ApiResponse<Product[]>; }
}

export async function getPcBuildCheckoutProducts(productIds: number[]): Promise<ApiResponse<Product[]>> {
  try {
    const axios = await createServerAxios();
    return (await axios.post("/PcBuild/checkout", productIds)).data;
  } catch (error) { return getDefaultError(error) as ApiResponse<Product[]>; }
}

export async function savePcBuild(name: string, productIds: number[], id?: number): Promise<ApiResponse<PcBuild>> {
  try {
    const axios = await createServerAxios();
    return id === undefined
      ? (await axios.post("/PcBuild", { name, productIds })).data
      : (await axios.put(`/PcBuild/${id}`, { name, productIds })).data;
  } catch (error) { return getDefaultError(error) as ApiResponse<PcBuild>; }
}

export async function deletePcBuild(id: number): Promise<ApiResponse> {
  try {
    const axios = await createServerAxios();
    return (await axios.delete(`/PcBuild/${id}`)).data;
  } catch (error) { return getDefaultError(error) as ApiResponse; }
}

