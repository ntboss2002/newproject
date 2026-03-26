import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProductById } from '../api/products'
import type { Product } from '../types'
import { useCartStore } from '../store/cartStore'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    if (!id) return
    getProductById(Number(id))
      .then(setProduct)
      .catch(() => setError('加载商品失败，请稍后重试'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>
  if (!product) return <div className="text-center py-20 text-gray-400">商品不存在</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        <img
          src={product.imageUrl || 'https://via.placeholder.com/500x400?text=No+Image'}
          alt={product.name}
          className="w-full rounded-xl object-cover"
        />
        <div className="flex flex-col justify-center">
          <p className="text-sm text-gray-400 mb-2">{product.categoryName}</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>
          <p className="text-3xl font-bold text-primary-600 mb-6">
            ¥{product.price.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mb-4">库存：{product.stock} 件</p>

          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
            >
              −
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
            >
              ＋
            </button>
          </div>

          <button
            onClick={() => addItem(product, quantity)}
            disabled={product.stock === 0}
            className="bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.stock === 0 ? '已售罄' : '加入购物车'}
          </button>
        </div>
      </div>
    </div>
  )
}
