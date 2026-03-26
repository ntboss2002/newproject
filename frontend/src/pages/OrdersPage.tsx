import { useEffect, useState } from 'react'
import { getMyOrders } from '../api/orders'
import type { Order, PageResponse } from '../types'

const STATUS_MAP: Record<Order['status'], string> = {
  PENDING: '待处理',
  CONFIRMED: '已确认',
  SHIPPED: '已发货',
  DELIVERED: '已送达',
  CANCELLED: '已取消',
}

const STATUS_COLOR: Record<Order['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const [data, setData] = useState<PageResponse<Order> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyOrders()
      .then(setData)
      .catch(() => setError('加载订单失败，请稍后重试'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">我的订单</h1>

      {!data || data.content.length === 0 ? (
        <p className="text-center text-gray-400 py-16">暂无订单</p>
      ) : (
        <div className="space-y-4">
          {data.content.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-700">订单 #{order.id}</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>
                  {STATUS_MAP[order.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                收货地址：{order.shippingAddress}
              </p>
              <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
                <p className="text-sm text-gray-500">{order.createdAt?.slice(0, 10)}</p>
                <p className="font-bold text-primary-600">
                  合计：¥{order.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
