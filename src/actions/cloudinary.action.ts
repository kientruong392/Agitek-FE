"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse } from "@/types/model.types";

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export async function getCloudinarySignature(
  folder = "agitek"
): Promise<ApiResponse<CloudinarySignature>> {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.get("/Cloudinary/signature", {
      params: { folder },
    });
    return res.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<CloudinarySignature>;
  }
}
