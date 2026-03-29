import axiosInstance from './axiosInstance'
import type { DownloadTask, DownloadRequest } from '../types'

const BASE = '/downloads'

export const getDownloads = (): Promise<DownloadTask[]> =>
  axiosInstance.get(BASE).then((r) => r.data)

export const getDownload = (id: number): Promise<DownloadTask> =>
  axiosInstance.get(`${BASE}/${id}`).then((r) => r.data)

export const addDownload = (request: DownloadRequest): Promise<DownloadTask> =>
  axiosInstance.post(BASE, request).then((r) => r.data)

export const addTorrentFile = (file: File, savePath?: string): Promise<DownloadTask> => {
  const form = new FormData()
  form.append('file', file)
  if (savePath) form.append('savePath', savePath)
  return axiosInstance
    .post(`${BASE}/torrent`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data)
}

export const pauseDownload = (id: number): Promise<DownloadTask> =>
  axiosInstance.post(`${BASE}/${id}/pause`).then((r) => r.data)

export const resumeDownload = (id: number): Promise<DownloadTask> =>
  axiosInstance.post(`${BASE}/${id}/resume`).then((r) => r.data)

export const removeDownload = (id: number): Promise<void> =>
  axiosInstance.delete(`${BASE}/${id}`).then(() => undefined)
