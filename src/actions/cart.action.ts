"use server";

import { auth } from "@/auth";
import { createServerAxios } from "@/lib/axios";
import { getDefaultError } from "@/utils/auth.utils";
import type { ApiResponse } from "@/types/model.types";

export type CartItem = { productId: number; quantity: number };

export async function getCart(guestSessionId: string): Promise<ApiResponse<CartItem[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const session = await auth();
    const response = await axiosInstance.get("/cart", {
      params: session?.user ? undefined : { guestSessionId },
    });
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<CartItem[]>;
  }
}

export async function addToCart(guestSessionId: string, productId: number, quantity: number): Promise<ApiResponse<CartItem[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const session = await auth();
    const response = await axiosInstance.post("/cart/add", {
      productId,
      quantity,
      ...(!session?.user ? { guestSessionId } : {}),
    });
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<CartItem[]>;
  }
}

export async function removeFromCart(guestSessionId: string, productId: number): Promise<ApiResponse<CartItem[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const session = await auth();
    const response = await axiosInstance.delete(`/cart/${productId}`, {
      params: session?.user ? undefined : { guestSessionId },
    });
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<CartItem[]>;
  }
}

export async function mergeCart(guestSessionId: string): Promise<ApiResponse<CartItem[]>> {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post("/cart/merge", { guestSessionId });
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<CartItem[]>;
  }
}
