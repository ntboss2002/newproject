import axiosInstance from './axiosInstance'
import type { LoginRequest, RegisterRequest, User } from '../types'

export const login = async (data: LoginRequest): Promise<User> => {
  const response = await axiosInstance.post<User>('/auth/login', data)
  return response.data
}

export const register = async (data: RegisterRequest): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>('/auth/register', data)
  return response.data
}
