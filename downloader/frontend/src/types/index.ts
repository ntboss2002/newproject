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
