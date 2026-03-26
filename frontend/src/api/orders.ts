import axiosInstance from './axiosInstance'
import type { Order, PageResponse } from '../types'

export const getMyOrders = async (page = 0, size = 10): Promise<PageResponse<Order>> => {
  const response = await axiosInstance.get<PageResponse<Order>>('/orders/my', {
    params: { page, size },
  })
  return response.data
}

export const getOrderById = async (id: number): Promise<Order> => {
  const response = await axiosInstance.get<Order>(`/orders/${id}`)
  return response.data
}

export const createOrder = async (data: {
  items: { productId: number; quantity: number }[]
  shippingAddress: string
}): Promise<Order> => {
  const response = await axiosInstance.post<Order>('/orders', data)
  return response.data
}
