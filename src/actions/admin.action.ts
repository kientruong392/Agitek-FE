"use server";

import { createServerAxios } from "@/lib/axios";

export async function checkBackendStatus() {
  try {
    const axiosInstance = await createServerAxios();
    const response = await axiosInstance.get("/Category");
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}
