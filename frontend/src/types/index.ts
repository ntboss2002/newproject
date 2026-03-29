export interface User {
  id: number
  username: string
  email: string
  roles: string[]
  token: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  categoryId: number
  categoryName: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  description: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: number
  userId: number
  items: OrderItem[]
  totalAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  shippingAddress: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  roles?: string[]
}

// -----------------------------------------------------------------------
// Download Manager types
// -----------------------------------------------------------------------

export type DownloadType = 'TORRENT_URL' | 'TORRENT_FILE' | 'MAGNET' | 'ED2K'

export type DownloadStatus =
  | 'WAITING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETE'
  | 'ERROR'
  | 'REMOVED'

export interface PeerInfo {
  peerId: string
  ip: string
  port: number
  downloadSpeed: number
  uploadSpeed: number
  seeder: boolean
  amChoking: boolean
  peerChoking: boolean
}

export interface DownloadTask {
  id: number
  gid: string | null
  name: string
  url: string
  type: DownloadType
  status: DownloadStatus
  progress: number
  downloadedBytes: number
  totalBytes: number
  downloadSpeed: number
  uploadSpeed: number
  numPeers: number
  numSeeders: number
  savePath: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  peers: PeerInfo[]
  aria2Connected: boolean
}

export interface DownloadRequest {
  url: string
  savePath?: string
}

