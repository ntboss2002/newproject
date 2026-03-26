import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import type { Product } from '../types'
import ProductCard from '../components/ProductCard'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getProducts(0, 8)
      .then((data) => setProducts(data.content))
      .catch(() => setError('加载商品失败，请稍后重试'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-md mb-4">{error}</div>
      )}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-2xl p-10 mb-10 text-center">
        <h1 className="text-4xl font-bold mb-3">欢迎来到 Shop 在线商城</h1>
        <p className="text-primary-100 mb-6">发现优质商品，享受便捷购物体验</p>
        <Link
          to="/products"
          className="bg-white text-primary-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-50 transition-colors"
        >
          立即购物
        </Link>
      </section>

      {/* New arrivals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">最新商品</h2>
          <Link to="/products" className="text-primary-600 hover:underline text-sm">
            查看全部 →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
