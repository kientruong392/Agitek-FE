"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse } from "@/types/model.types";

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
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

export async function uploadImageToCloudinary(
  file: File,
  folder = "agitek"
): Promise<ApiResponse<CloudinaryUploadResult>> {
  try {
    const signatureRes = await getCloudinarySignature(folder);
    if (!signatureRes.success || !signatureRes.data) {
      return {
        success: false,
        statusCode: signatureRes.statusCode,
        errorCode: signatureRes.errorCode ?? "CLOUDINARY_SIGNATURE_FAILED",
        message: signatureRes.message ?? "Failed to get upload signature",
      };
    }

    const { signature, timestamp, apiKey, cloudName } = signatureRes.data;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!uploadRes.ok) {
      return {
        success: false,
        statusCode: uploadRes.status,
        errorCode: "CLOUDINARY_UPLOAD_FAILED",
        message: "Failed to upload image to Cloudinary",
      };
    }

    const result = (await uploadRes.json()) as CloudinaryUploadResult;

    return {
      success: true,
      statusCode: 200,
      message: "SUCCESS",
      data: result,
    };
  } catch (error) {
    return getDefaultError(error) as ApiResponse<CloudinaryUploadResult>;
  }
}
