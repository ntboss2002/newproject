import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const totalItems = useCartStore((s) => s.totalItems())
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-600">
          🛍️ Shop
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/products" className="text-gray-600 hover:text-primary-600 transition-colors">
            商品
          </Link>

          <Link to="/downloads" className="text-gray-600 hover:text-primary-600 transition-colors">
            📥 下载
          </Link>

          <Link to="/cart" className="relative text-gray-600 hover:text-primary-600 transition-colors">
            🛒 购物车
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/orders" className="text-gray-600 hover:text-primary-600 transition-colors">
                我的订单
              </Link>
              <span className="text-gray-500 text-sm">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                登录
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-primary-700 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
