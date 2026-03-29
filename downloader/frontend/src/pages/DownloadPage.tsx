import { useEffect, useRef, useState } from 'react'
import {
  getDownloads,
  getDownload,
  addDownload,
  addTorrentFile,
  pauseDownload,
  resumeDownload,
  removeDownload,
} from '../api/downloads'
import type { DownloadTask, PeerInfo } from '../types'

// ── helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

function formatSpeed(bps: number): string {
  return bps > 0 ? `${formatBytes(bps)}/s` : '—'
}

function statusColor(status: DownloadTask['status']): string {
  switch (status) {
    case 'ACTIVE':   return 'bg-green-100 text-green-700'
    case 'WAITING':  return 'bg-yellow-100 text-yellow-700'
    case 'PAUSED':   return 'bg-blue-100 text-blue-700'
    case 'COMPLETE': return 'bg-gray-100 text-gray-600'
    case 'ERROR':    return 'bg-red-100 text-red-600'
    case 'REMOVED':  return 'bg-gray-100 text-gray-400'
    default:         return 'bg-gray-100 text-gray-500'
  }
}

function statusLabel(status: DownloadTask['status']): string {
  const map: Record<DownloadTask['status'], string> = {
    WAITING:  '等待中',
    ACTIVE:   '下载中',
    PAUSED:   '已暂停',
    COMPLETE: '已完成',
    ERROR:    '错误',
    REMOVED:  '已移除',
  }
  return map[status] ?? status
}

function typeIcon(type: DownloadTask['type']): string {
  switch (type) {
    case 'MAGNET':      return '🧲'
    case 'ED2K':        return '🫏'
    case 'TORRENT_FILE':
    case 'TORRENT_URL': return '📦'
    default:            return '📥'
  }
}

// Sort peers by download speed descending so the "best" nodes appear first
function rankPeers(peers: PeerInfo[]): PeerInfo[] {
  return [...peers].sort((a, b) => b.downloadSpeed - a.downloadSpeed)
}

const LIVE_STATUSES: DownloadTask['status'][] = ['ACTIVE', 'WAITING', 'PAUSED']

function isLiveStatus(status: DownloadTask['status']): boolean {
  return LIVE_STATUSES.includes(status)
}

// ── component ──────────────────────────────────────────────────────────────

export default function DownloadPage() {
  const [tasks, setTasks] = useState<DownloadTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add-download form
  const [url, setUrl] = useState('')
  const [savePath, setSavePath] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Expanded task detail / peer analysis
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedTask, setExpandedTask] = useState<DownloadTask | null>(null)
  const [expandLoading, setExpandLoading] = useState(false)

  // aria2 connection state (derived from latest task list response)
  const [aria2Ok, setAria2Ok] = useState<boolean | null>(null)

  // ── data fetching ─────────────────────────────────────────────────────────

  const fetchAll = () => {
    getDownloads()
      .then((data) => {
        setTasks(data)
        if (data.length > 0) setAria2Ok(data[0].aria2Connected)
      })
      .catch(() => setError('加载下载列表失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => {
      // Only keep polling while there are non-terminal tasks
      const hasLive = tasks.some((t) => isLiveStatus(t.status))
      if (hasLive || tasks.length === 0) {
        fetchAll()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [tasks])

  const fetchExpanded = (id: number) => {
    setExpandLoading(true)
    getDownload(id)
      .then(setExpandedTask)
      .catch(() => setExpandedTask(null))
      .finally(() => setExpandLoading(false))
  }

  useEffect(() => {
    if (expandedId !== null) {
      fetchExpanded(expandedId)
      // Only poll while the task is in a live state
      const expandedStatus = tasks.find((t) => t.id === expandedId)?.status
      if (expandedStatus && !isLiveStatus(expandedStatus)) {
        return
      }
      const interval = setInterval(() => fetchExpanded(expandedId), 3000)
      return () => clearInterval(interval)
    }
    setExpandedTask(null)
  }, [expandedId, tasks])

  // ── actions ───────────────────────────────────────────────────────────────

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const task = await addDownload({ url: url.trim(), savePath: savePath.trim() || undefined })
      setTasks((prev) => [task, ...prev])
      setUrl('')
      setSavePath('')
    } catch {
      setError('提交下载失败，请检查链接格式')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSubmitting(true)
    setError('')
    try {
      const task = await addTorrentFile(file, savePath.trim() || undefined)
      setTasks((prev) => [task, ...prev])
    } catch {
      setError('上传 .torrent 文件失败')
    } finally {
      setSubmitting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePause = async (id: number) => {
    try {
      const updated = await pauseDownload(id)
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch {
      setError('暂停失败')
    }
  }

  const handleResume = async (id: number) => {
    try {
      const updated = await resumeDownload(id)
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch {
      setError('恢复失败')
    }
  }

  const handleRemove = async (id: number) => {
    if (!window.confirm('确认移除该下载任务？')) return
    try {
      await removeDownload(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch {
      setError('移除失败')
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📥 下载管理器</h1>
      <p className="text-sm text-gray-500 mb-6">
        支持 <strong>磁力链接</strong>（magnet:）、<strong>电驴链接</strong>（ed2k://）、
        <strong>种子文件</strong>（.torrent）及指向种子的 HTTP 链接。
        下载引擎由 <code>aria2</code> 提供，支持自动分析最优节点。
      </p>

      {/* aria2 status banner */}
      {aria2Ok === false && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-md px-4 py-3 mb-4">
          ⚠️ 无法连接到 aria2 后台服务。请先启动 aria2：
          <br />
          <code className="block mt-1 bg-amber-100 px-2 py-1 rounded text-xs font-mono">
            aria2c --enable-rpc --rpc-secret=changeme --rpc-listen-port=6800 --continue=true
          </code>
          并在 <code>application.yml</code> 中设置对应的 <code>aria2.rpc.secret</code>。
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-md mb-4">{error}</div>
      )}

      {/* ── Add download form ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-700 mb-3">添加下载</h2>

        <form onSubmit={handleAddUrl} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              链接（magnet: / ed2k:// / https://...torrent）
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="magnet:?xt=urn:btih:... 或 ed2k://|file|... 或 https://example.com/file.torrent"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              保存路径（留空使用 aria2 默认目录）
            </label>
            <input
              type="text"
              value={savePath}
              onChange={(e) => setSavePath(e.target.value)}
              placeholder="/downloads"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="submit"
              disabled={submitting || !url.trim()}
              className="bg-primary-600 text-white px-5 py-2 rounded-md text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '开始下载'}
            </button>

            <span className="text-gray-400 text-sm">或</span>

            {/* .torrent file upload */}
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm border border-gray-300 transition-colors">
              📂 上传 .torrent 文件
              <input
                ref={fileInputRef}
                type="file"
                accept=".torrent"
                className="hidden"
                onChange={handleFileChange}
                disabled={submitting}
              />
            </label>
          </div>
        </form>
      </div>

      {/* ── Download list ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-gray-400 text-center py-10">暂无下载任务</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* ── Task header ── */}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base">{typeIcon(task.type)}</span>
                      <span className="font-medium text-gray-800 text-sm truncate max-w-xs">
                        {task.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(task.status)}`}
                      >
                        {statusLabel(task.status)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {task.status !== 'REMOVED' && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            task.status === 'COMPLETE' ? 'bg-gray-400' : 'bg-primary-500'
                          }`}
                          style={{ width: `${Math.min(task.progress, 100)}%` }}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      {task.totalBytes > 0 && (
                        <span>
                          {formatBytes(task.downloadedBytes)} / {formatBytes(task.totalBytes)}{' '}
                          ({task.progress.toFixed(1)}%)
                        </span>
                      )}
                      {task.status === 'ACTIVE' && (
                        <>
                          <span>⬇ {formatSpeed(task.downloadSpeed)}</span>
                          <span>⬆ {formatSpeed(task.uploadSpeed)}</span>
                          {task.numPeers > 0 && <span>👥 {task.numPeers} 节点</span>}
                        </>
                      )}
                      {task.status === 'ERROR' && task.errorMessage && (
                        <span className="text-red-500">{task.errorMessage}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.status === 'ACTIVE' && (
                      <button
                        onClick={() => handlePause(task.id)}
                        className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded"
                      >
                        暂停
                      </button>
                    )}
                    {task.status === 'PAUSED' && (
                      <button
                        onClick={() => handleResume(task.id)}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded"
                      >
                        恢复
                      </button>
                    )}
                    {(task.status === 'ACTIVE' || task.status === 'PAUSED') && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded"
                      >
                        {expandedId === task.id ? '收起' : '节点分析'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(task.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Peer / node analysis panel ── */}
              {expandedId === task.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                  <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    节点分析
                  </h3>

                  {expandLoading && !expandedTask && (
                    <p className="text-xs text-gray-400 animate-pulse">正在获取节点信息...</p>
                  )}

                  {expandedTask && expandedTask.peers.length === 0 && (
                    <p className="text-xs text-gray-400">
                      暂无节点数据（下载活跃后会自动出现节点列表）
                    </p>
                  )}

                  {expandedTask && expandedTask.peers.length > 0 && (
                    <NodeAnalysisPanel peers={expandedTask.peers} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── NodeAnalysisPanel ──────────────────────────────────────────────────────

interface NodeAnalysisPanelProps {
  peers: PeerInfo[]
}

function NodeAnalysisPanel({ peers }: NodeAnalysisPanelProps) {
  const ranked = rankPeers(peers)
  const seeders = peers.filter((p) => p.seeder).length
  const leechers = peers.length - seeders
  const totalDown = peers.reduce((s, p) => s + p.downloadSpeed, 0)

  return (
    <div>
      {/* Summary */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
        <span>📊 共 <strong>{peers.length}</strong> 个节点</span>
        <span>🌱 做种: <strong className="text-green-600">{seeders}</strong></span>
        <span>⬇ 下载: <strong className="text-blue-600">{leechers}</strong></span>
        <span>⚡ 总速度: <strong>{formatSpeed(totalDown)}</strong></span>
      </div>

      {/* Top peers table */}
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="text-xs w-full">
          <thead className="bg-gray-100 text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-1.5 text-left">IP 地址</th>
              <th className="px-3 py-1.5 text-left">端口</th>
              <th className="px-3 py-1.5 text-right">⬇ 下载速度</th>
              <th className="px-3 py-1.5 text-right">⬆ 上传速度</th>
              <th className="px-3 py-1.5 text-center">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {ranked.slice(0, 20).map((peer, i) => (
              <tr
                key={peer.peerId || i}
                className={
                  i === 0 && peer.downloadSpeed > 0
                    ? 'bg-green-50'
                    : 'hover:bg-gray-50'
                }
              >
                <td className="px-3 py-1.5 font-mono">{peer.ip}</td>
                <td className="px-3 py-1.5">{peer.port}</td>
                <td className="px-3 py-1.5 text-right font-medium text-green-700">
                  {formatSpeed(peer.downloadSpeed)}
                </td>
                <td className="px-3 py-1.5 text-right text-blue-600">
                  {formatSpeed(peer.uploadSpeed)}
                </td>
                <td className="px-3 py-1.5 text-center">
                  {peer.seeder ? (
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">
                      做种
                    </span>
                  ) : (
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                      下载
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ranked.length > 20 && (
          <p className="text-xs text-gray-400 text-center py-1">
            仅显示前 20 个节点（共 {ranked.length} 个）
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        💡 下载速度最高的节点排列在最前（绿色行为最优节点）
      </p>
    </div>
  )
}
