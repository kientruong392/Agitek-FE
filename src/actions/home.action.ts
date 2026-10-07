"use server";

import { createServerAxios } from "@/lib/axios";

export async function getFeaturedProducts(count = 4) {
  const axiosInstance = await createServerAxios();
  const res = await axiosInstance.get(`/Product/featured`, { params: { count } });
  return res.data.data;
}

export async function getNewestProducts(count = 4) {
  const axiosInstance = await createServerAxios();
  const res = await axiosInstance.get(`/Product/newest`, { params: { count } });
  return res.data.data;
}

export async function getCategories() {
  const axiosInstance = await createServerAxios();
  const res = await axiosInstance.get(`/Category/with-subcategories`);
  return res.data.data;
}

export async function getCategoryProducts(categoryId: number) {
  const axiosInstance = await createServerAxios();
  const res = await axiosInstance.get(`/Product/category/${categoryId}`);
  return res.data.data;
}

export async function getCategoryWithProductsBySlug(slug: string) {
  const axiosInstance = await createServerAxios();
  const res = await axiosInstance.get(`/Category/slug/${slug}/products`);
  return res.data.data;
}
