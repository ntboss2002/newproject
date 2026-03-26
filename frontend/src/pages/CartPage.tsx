import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg mb-4">购物车是空的</p>
        <Link to="/products" className="text-primary-600 hover:underline">
          去购物 →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">购物车</h1>

      <div className="space-y-4 mb-8">
        {items.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          >
            <img
              src={product.imageUrl || 'https://via.placeholder.com/80x80?text=?'}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-md"
            />
            <div className="flex-grow">
              <p className="font-medium text-gray-800">{product.name}</p>
              <p className="text-primary-600 font-semibold">¥{product.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded-full border border-gray-300 text-sm hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="w-7 h-7 rounded-full border border-gray-300 text-sm hover:bg-gray-100"
              >
                ＋
              </button>
            </div>
            <p className="w-20 text-right font-semibold text-gray-700">
              ¥{(product.price * quantity).toFixed(2)}
            </p>
            <button
              onClick={() => removeItem(product.id)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              删除
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="font-semibold text-gray-700">
          合计：<span className="text-primary-600 text-xl ml-2">¥{totalPrice().toFixed(2)}</span>
        </p>
        <Link
          to="/orders"
          className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          去结算
        </Link>
      </div>
    </div>
  )
}
