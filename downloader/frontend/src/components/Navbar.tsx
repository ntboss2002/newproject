import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-600">
          📥 下载管理器
        </Link>
        <span className="text-sm text-gray-500">
          支持 magnet · ed2k · torrent
        </span>
      </div>
    </nav>
  )
}
