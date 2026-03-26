import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <p className="text-gray-500 text-lg mb-6">页面不存在</p>
      <Link to="/" className="text-primary-600 hover:underline">
        返回首页
      </Link>
    </div>
  )
}
