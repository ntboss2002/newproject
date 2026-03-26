import axiosInstance from './axiosInstance'
import type { PageResponse, Product } from '../types'

export const getProducts = async (
  page = 0,
  size = 12,
  sort = 'createdAt,desc',
): Promise<PageResponse<Product>> => {
  const response = await axiosInstance.get<PageResponse<Product>>('/products', {
    params: { page, size, sort },
  })
  return response.data
}

export const getProductById = async (id: number): Promise<Product> => {
  const response = await axiosInstance.get<Product>(`/products/${id}`)
  return response.data
}

export const getProductsByCategory = async (
  categoryId: number,
  page = 0,
  size = 12,
): Promise<PageResponse<Product>> => {
  const response = await axiosInstance.get<PageResponse<Product>>(
    `/products/category/${categoryId}`,
    { params: { page, size } },
  )
  return response.data
}

export const searchProducts = async (
  keyword: string,
  page = 0,
  size = 12,
): Promise<PageResponse<Product>> => {
  const response = await axiosInstance.get<PageResponse<Product>>('/products/search', {
    params: { keyword, page, size },
  })
  return response.data
}
