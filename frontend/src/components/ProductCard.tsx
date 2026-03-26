import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { useCartStore } from '../store/cartStore'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/products/${product.id}`}>
        <img
          src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="font-semibold text-gray-800 truncate hover:text-primary-600">
            {product.name}
          </h3>
        </Link>
        {product.categoryName && (
          <p className="text-xs text-gray-400 mt-1">{product.categoryName}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-primary-600">
            ¥{product.price.toFixed(2)}
          </span>
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="bg-primary-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.stock === 0 ? '已售罄' : '加入购物车'}
          </button>
        </div>
      </div>
    </div>
  )
}
