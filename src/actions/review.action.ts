"use server";

import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse, ProductReview } from "@/types/model.types";

export interface CreateReviewInput {
  orderId: number;
  productId: number;
  rating: number;
  comment?: string;
  medias: { mediaUrl: string }[];
}

export async function createReview(
  input: CreateReviewInput
): Promise<ApiResponse<ProductReview>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post("/Review", input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<ProductReview>;
  }
}
