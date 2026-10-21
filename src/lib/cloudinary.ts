import { getCloudinarySignature } from "@/actions/cloudinary.action";
import type { ApiResponse } from "@/types/model.types";

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
}

async function uploadFileToCloudinary(
  file: File,
  folder: string,
  resourceType: "image" | "video"
): Promise<ApiResponse<CloudinaryUploadResult>> {
  try {
    const signatureRes = await getCloudinarySignature(folder);
    if (!signatureRes.success || !signatureRes.data) {
      return {
        success: false,
        statusCode: signatureRes.statusCode,
        errorCode: signatureRes.errorCode ?? "CLOUDINARY_SIGNATURE_FAILED",
        message: signatureRes.message ?? "Không thể lấy chữ ký tải tệp lên.",
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
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    if (!uploadRes.ok) {
      return {
        success: false,
        statusCode: uploadRes.status,
        errorCode: "CLOUDINARY_UPLOAD_FAILED",
        message: "Không thể tải tệp lên Cloudinary.",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "SUCCESS",
      data: await uploadRes.json() as CloudinaryUploadResult,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      errorCode: "CLOUDINARY_UPLOAD_FAILED",
      message: error instanceof Error ? error.message : "Không thể tải tệp lên Cloudinary.",
    };
  }
}

export function uploadImageToCloudinary(
  file: File,
  folder = "agitek"
): Promise<ApiResponse<CloudinaryUploadResult>> {
  return uploadFileToCloudinary(file, folder, "image");
}

export function uploadMediaToCloudinary(
  file: File,
  folder = "agitek"
): Promise<ApiResponse<CloudinaryUploadResult>> {
  return uploadFileToCloudinary(
    file,
    folder,
    file.type.startsWith("video/") ? "video" : "image"
  );
}
