"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, LocationDTO } from "@/types/model.types";

export async function getAllLocations(): Promise<ApiResponse<LocationDTO[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/Location");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<LocationDTO[]>;
  }
}

export async function getAllWarehouses(): Promise<ApiResponse<LocationDTO[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/Location/warehouses");
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<LocationDTO[]>;
  }
}

export async function getLocationById(id: number): Promise<ApiResponse<LocationDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get(`/Location/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<LocationDTO>;
  }
}

export async function createLocation(data: Record<string, unknown>): Promise<ApiResponse<LocationDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.post("/Location", data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<LocationDTO>;
  }
}

export async function updateLocation(
  id: number,
  data: Record<string, unknown>
): Promise<ApiResponse<LocationDTO>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.patch(`/Location/${id}`, data);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<LocationDTO>;
  }
}

export async function deleteLocation(id: number): Promise<ApiResponse<null>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.delete(`/Location/${id}`);
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<null>;
  }
}
