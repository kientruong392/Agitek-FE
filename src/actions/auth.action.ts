"use server";

import { getFormData } from "@/utils/helper.utils";
import { getDefaultError } from "@/utils/auth.utils";
import { signIn, signOut, auth } from "@/auth";
import { createServerAxios } from "@/lib/axios";
import { redirect } from "next/navigation";
import { UserPayload } from "next-auth";

export async function login(input: FormData | { usernameOrEmail: string; password: string }) {
  try {
    const { usernameOrEmail, password } = input instanceof FormData
      ? getFormData(input)
      : input;
    const axiosInstance = await createServerAxios();
    
    const res = await axiosInstance.post(`/Auth/login`, {
      usernameOrEmail,
      password,
    });

    const apiResponse = res.data;

    if (apiResponse.data?.accessToken && apiResponse.data?.refreshToken) {
      await signIn("credentials", {
        accessToken: apiResponse.data.accessToken,
        refreshToken: apiResponse.data.refreshToken,
        isExternal: "true",
        redirect: false,
      });
    }

    return apiResponse;
  } catch (error) {
    return getDefaultError(error);
  }
}

export async function register(formData: FormData) {
  try {
    const { email, username, password, confirmPassword } = getFormData(formData);
    const axiosInstance = await createServerAxios();

    const res = await axiosInstance.post(`/Auth/register`, {
      email,
      username,
      password,
      confirmPassword,
    });

    const apiResponse = res.data;

    if (apiResponse.data?.accessToken && apiResponse.data?.refreshToken) {
      await signIn("credentials", {
        accessToken: apiResponse.data.accessToken,
        refreshToken: apiResponse.data.refreshToken,
        isExternal: "true",
        redirect: false,
      });
    }

    return apiResponse;
  } catch (error) {
    return getDefaultError(error);
  }
}

export async function logout() {
  try {
    const session = await auth();

    if (session?.refreshToken) {
      const axiosInstance = await createServerAxios();
      await axiosInstance.post(`/Auth/logout`, {
        accessToken: session.accessToken ?? "",
        refreshToken: session.refreshToken,
      });
    }
  } catch (error) {
    return getDefaultError(error);
  }

  await signOut({ redirect: false });
  redirect("/login");
}

export async function verifyAccount(formData: FormData) {
  try {
    const values = getFormData(formData);
    const token = typeof values.token === "string" ? values.token.trim() : "";
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.post(`/Auth/verify-account`, JSON.stringify(token), {
      headers: { "Content-Type": "application/json" },
    });
    const apiResponse = res.data;
    if (apiResponse.data?.accessToken && apiResponse.data?.refreshToken) {
      await signIn("credentials", {
        accessToken: apiResponse.data.accessToken,
        refreshToken: apiResponse.data.refreshToken,
        isExternal: "true",
        redirect: false,
      });
    }

    return apiResponse;
  } catch (error) {
    return getDefaultError(error);
  }
}

export async function resendVerifyCode(id: string) {
  try {
    const axiosInstance = await createServerAxios();
    const res = await axiosInstance.post(`/Auth/resend-verify-code`, {
      id
    });

    return res.data;
  } catch (error) {
    return getDefaultError(error);
  }
}

export async function forgotPassword(formData: FormData) {
  try {
    const { email } = getFormData(formData);
    const axiosInstance = await createServerAxios();

    const res = await axiosInstance.post(`/Auth/forgot-password`, {
      email
    });

    return res.data;
  } catch (error) {
    return getDefaultError(error);
  }
}

export async function resetPassword(formData: FormData, token: string) {
  try {
    const { password, confirmPassword } = getFormData(formData);
    const axiosInstance = await createServerAxios();

    const res = await axiosInstance.post(`/Auth/reset-password`, {
      token,
      password,
      confirmPassword
    });

    return res.data;
  } catch (error) {
    return getDefaultError(error);
  }
}

export async function checkLogin() {
  try {
    const session = await auth();
    return !!session;
  } catch {
    return false;
  }
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  try {
    await signIn("credentials", {
      accessToken: accessToken,
      refreshToken: refreshToken,
      isExternal: "true",
      redirect: false,
    });
  } catch (error) {
    return getDefaultError(error);
  }
}

export async function loginWithGoogle() {
  const url = `${process.env.API_URL}/Auth/google`;
  redirect(url);
}

export async function getCurrentUser() {
  try {
    const session = await auth();
    if (session?.user) {
      return session.user as UserPayload;
    }
    return null;
  } catch {
    return null;
  }
}