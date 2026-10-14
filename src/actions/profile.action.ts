"use server";

import { createServerAxios } from "@/lib/axios";
import { auth } from "@/auth";
import { getDefaultError } from "@/utils/auth.utils";
import type {
  Address,
  ApiResponse,
  CreateAddressInput,
  UpdateAddressInput,
  UpdateMyAccountInput,
  UpdateProfileInput,
  UserProfile,
  UserDTO,
} from "@/types/model.types";

export async function getMyAccount(): Promise<ApiResponse<UserDTO>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<UserDTO>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/User/me");
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<UserDTO>;
  }
}

export async function updateMyAccount(input: UpdateMyAccountInput): Promise<ApiResponse<UserDTO>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<never>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch("/User/my-account", input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<UserDTO>;
  }
}

export async function changeMyPassword(input: { oldPassword: string; newPassword: string }): Promise<ApiResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<never>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch("/User/my-account/password", input);
    return response.data ?? { success: true, statusCode: 204 };
  } catch (error) {
    return getDefaultError(error) as ApiResponse<null>;
  }
}

export async function updateMyProfile(userId: number, input: UpdateProfileInput): Promise<ApiResponse<UserProfile>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<never>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch(`/Profile/${userId}`, input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<UserProfile>;
  }
}

export async function getMyAddresses(userId: number): Promise<ApiResponse<Address[]>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<never>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get(`/Address/user/${userId}`);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Address[]>;
  }
}

export async function createAddress(input: CreateAddressInput): Promise<ApiResponse<Address>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<never>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.post("/Address", input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Address>;
  }
}

export async function updateAddress(id: number, input: UpdateAddressInput): Promise<ApiResponse<Address>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<never>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.patch(`/Address/${id}`, input);
    return response.data;
  } catch (error) {
    return getDefaultError(error) as ApiResponse<Address>;
  }
}

export async function deleteAddress(id: number): Promise<ApiResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user || session.error || !session.accessToken) {
      return { success: false, statusCode: 401, errorCode: "UNAUTHORIZED", message: "Authentication required" } as ApiResponse<never>;
    }
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.delete(`/Address/${id}`);
    return response.data ?? { success: true, statusCode: 200 };
  } catch (error) {
    return getDefaultError(error) as ApiResponse<null>;
  }
}
