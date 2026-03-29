package com.example.downloader.service;

import com.example.downloader.dto.request.DownloadRequest;
import com.example.downloader.dto.response.DownloadResponse;
import com.example.downloader.dto.response.PeerInfo;
import com.example.downloader.exception.ResourceNotFoundException;
import com.example.downloader.model.DownloadStatus;
import com.example.downloader.model.DownloadTask;
import com.example.downloader.model.DownloadType;
import com.example.downloader.repository.DownloadTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DownloadService {

    private final DownloadTaskRepository repository;
    private final Aria2RpcClient aria2;

    private static final Set<DownloadStatus> LIVE_STATUSES =
            EnumSet.of(DownloadStatus.ACTIVE, DownloadStatus.WAITING, DownloadStatus.PAUSED);

    // -------------------------------------------------------------------------
    // Add downloads
    // -------------------------------------------------------------------------

    /**
     * Add a download from a URL or link (magnet, ed2k, http URL to .torrent).
     */
    @Transactional
    public DownloadResponse addDownload(DownloadRequest request) {
        String url = request.getUrl().trim();
        DownloadType type = detectType(url);

        DownloadTask task = DownloadTask.builder()
                .name(deriveName(url, type))
                .url(url)
                .type(type)
                .status(DownloadStatus.WAITING)
                .savePath(request.getSavePath())
                .build();

        if (aria2.isRunning()) {
            try {
                String gid = aria2.addUri(List.of(url), request.getSavePath());
                task.setGid(gid);
                task.setStatus(DownloadStatus.WAITING);
                log.info("Submitted download to aria2, gid={}", gid);
            } catch (Exception e) {
                task.setStatus(DownloadStatus.ERROR);
                task.setErrorMessage(e.getMessage());
                log.error("Failed to submit download to aria2: {}", e.getMessage());
            }
        } else {
            task.setStatus(DownloadStatus.ERROR);
            task.setErrorMessage("aria2 未运行，请先启动 aria2 后台服务");
            log.warn("aria2 is not running – task saved with ERROR status");
        }

        return toResponse(repository.save(task), Collections.emptyList(), aria2.isRunning());
    }

    /**
     * Add a download from an uploaded .torrent file.
     */
    @Transactional
    public DownloadResponse addTorrentFile(MultipartFile file, String savePath) throws IOException {
        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String displayName = file.getOriginalFilename() != null
                ? file.getOriginalFilename()
                : "uploaded.torrent";

        DownloadTask task = DownloadTask.builder()
                .name(displayName)
                .url("torrent-file:" + displayName)
                .type(DownloadType.TORRENT_FILE)
                .status(DownloadStatus.WAITING)
                .savePath(savePath)
                .build();

        if (aria2.isRunning()) {
            try {
                String gid = aria2.addTorrent(base64, savePath);
                task.setGid(gid);
                task.setStatus(DownloadStatus.WAITING);
                log.info("Submitted torrent file to aria2, gid={}", gid);
            } catch (Exception e) {
                task.setStatus(DownloadStatus.ERROR);
                task.setErrorMessage(e.getMessage());
                log.error("Failed to submit torrent file to aria2: {}", e.getMessage());
            }
        } else {
            task.setStatus(DownloadStatus.ERROR);
            task.setErrorMessage("aria2 未运行，请先启动 aria2 后台服务");
        }

        return toResponse(repository.save(task), Collections.emptyList(), aria2.isRunning());
    }

    // -------------------------------------------------------------------------
    // Query
    // -------------------------------------------------------------------------

    /** Return all tasks, refreshing status from aria2 when possible. */
    @Transactional
    public List<DownloadResponse> getAllDownloads() {
        boolean connected = aria2.isRunning();
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(task -> {
                    if (connected && task.getGid() != null && isLiveStatus(task.getStatus())) {
                        refreshFromAria2(task);
                    }
                    return toResponse(task, Collections.emptyList(), connected);
                })
                .collect(Collectors.toList());
    }

    /** Return a single task with full peer details, refreshed from aria2. */
    @Transactional
    public DownloadResponse getDownload(Long id) {
        DownloadTask task = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DownloadTask", "id", id));

        boolean connected = aria2.isRunning();
        List<PeerInfo> peers = Collections.emptyList();

        if (connected && task.getGid() != null) {
            refreshFromAria2(task);
            if (isLiveStatus(task.getStatus())) {
                peers = aria2.getPeers(task.getGid());
            }
        }

        return toResponse(repository.save(task), peers, connected);
    }

    // -------------------------------------------------------------------------
    // Control
    // -------------------------------------------------------------------------

    @Transactional
    public DownloadResponse pauseDownload(Long id) {
        DownloadTask task = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DownloadTask", "id", id));

        if (task.getGid() != null) {
            aria2.pause(task.getGid());
        }
        task.setStatus(DownloadStatus.PAUSED);
        return toResponse(repository.save(task), Collections.emptyList(), aria2.isRunning());
    }

    @Transactional
    public DownloadResponse resumeDownload(Long id) {
        DownloadTask task = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DownloadTask", "id", id));

        if (task.getGid() != null) {
            aria2.unpause(task.getGid());
        }
        task.setStatus(DownloadStatus.ACTIVE);
        return toResponse(repository.save(task), Collections.emptyList(), aria2.isRunning());
    }

    @Transactional
    public void removeDownload(Long id) {
        DownloadTask task = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DownloadTask", "id", id));

        if (task.getGid() != null) {
            try {
                aria2.forceRemove(task.getGid());
            } catch (Exception e) {
                log.warn("Could not remove gid {} from aria2: {}", task.getGid(), e.getMessage());
            }
        }
        task.setStatus(DownloadStatus.REMOVED);
        repository.save(task);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /** Pull the latest status from aria2 and update the task in-place. */
    private void refreshFromAria2(DownloadTask task) {
        try {
            Map<String, String> s = aria2.tellStatus(task.getGid());

            task.setStatus(mapAria2Status(s.getOrDefault("status", "waiting")));
            task.setDownloadedBytes(parseLong(s.get("completedLength")));
            task.setTotalBytes(parseLong(s.get("totalLength")));
            task.setDownloadSpeed(parseLong(s.get("downloadSpeed")));
            task.setUploadSpeed(parseLong(s.get("uploadSpeed")));
            task.setNumPeers(parseInt(s.get("connections")));

            long total = task.getTotalBytes();
            long done  = task.getDownloadedBytes();
            task.setProgress(total > 0 ? (done * 100.0 / total) : 0.0);

            if (task.getStatus() == DownloadStatus.ERROR) {
                task.setErrorMessage(s.get("errorMessage"));
            }

            // Try to update the display name from the torrent's bittorrent info
            String infoName = s.get("bittorrent.info.name");
            if (infoName != null && !infoName.isBlank()) {
                task.setName(infoName);
            }

        } catch (Exception e) {
            log.debug("Could not refresh status for gid {}: {}", task.getGid(), e.getMessage());
        }
    }

    private DownloadType detectType(String url) {
        String lower = url.toLowerCase();
        if (lower.startsWith("magnet:")) return DownloadType.MAGNET;
        if (lower.startsWith("ed2k://")) return DownloadType.ED2K;
        return DownloadType.TORRENT_URL;
    }

    private String deriveName(String url, DownloadType type) {
        if (type == DownloadType.MAGNET) {
            // Try dn= parameter first
            int dnIdx = url.indexOf("dn=");
            if (dnIdx != -1) {
                String raw = url.substring(dnIdx + 3);
                int end = raw.indexOf('&');
                String dn = end == -1 ? raw : raw.substring(0, end);
                try {
                    return java.net.URLDecoder.decode(dn, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception ignored) {
                    return dn;
                }
            }
            return "Magnet Download";
        }
        if (type == DownloadType.ED2K) {
            // ed2k://|file|<name>|<size>|<hash>|/
            String[] parts = url.split("\\|");
            return parts.length > 2 ? parts[2] : "eDonkey Download";
        }
        // TORRENT_URL: use the last path segment
        try {
            String path = new java.net.URI(url).getPath();
            if (path != null && path.contains("/")) {
                String seg = path.substring(path.lastIndexOf('/') + 1);
                if (!seg.isBlank()) return seg;
            }
        } catch (Exception ignored) {
            // fall through
        }
        return "Torrent Download";
    }

    private boolean isLiveStatus(DownloadStatus status) {
        return LIVE_STATUSES.contains(status);
    }

    private DownloadStatus mapAria2Status(String s) {
        return switch (s) {
            case "active"   -> DownloadStatus.ACTIVE;
            case "waiting"  -> DownloadStatus.WAITING;
            case "paused"   -> DownloadStatus.PAUSED;
            case "complete" -> DownloadStatus.COMPLETE;
            case "error"    -> DownloadStatus.ERROR;
            case "removed"  -> DownloadStatus.REMOVED;
            default         -> DownloadStatus.WAITING;
        };
    }

    private long parseLong(String s) {
        if (s == null || s.isBlank()) return 0L;
        try { return Long.parseLong(s); } catch (NumberFormatException e) { return 0L; }
    }

    private int parseInt(String s) {
        if (s == null || s.isBlank()) return 0;
        try { return Integer.parseInt(s); } catch (NumberFormatException e) { return 0; }
    }

    private DownloadResponse toResponse(DownloadTask task, List<PeerInfo> peers, boolean aria2Connected) {
        return DownloadResponse.builder()
                .id(task.getId())
                .gid(task.getGid())
                .name(task.getName())
                .url(task.getUrl())
                .type(task.getType())
                .status(task.getStatus())
                .progress(task.getProgress() != null ? task.getProgress() : 0.0)
                .downloadedBytes(task.getDownloadedBytes() != null ? task.getDownloadedBytes() : 0L)
                .totalBytes(task.getTotalBytes() != null ? task.getTotalBytes() : 0L)
                .downloadSpeed(task.getDownloadSpeed() != null ? task.getDownloadSpeed() : 0L)
                .uploadSpeed(task.getUploadSpeed() != null ? task.getUploadSpeed() : 0L)
                .numPeers(task.getNumPeers() != null ? task.getNumPeers() : 0)
                .numSeeders(task.getNumSeeders() != null ? task.getNumSeeders() : 0)
                .savePath(task.getSavePath())
                .errorMessage(task.getErrorMessage())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .peers(peers)
                .aria2Connected(aria2Connected)
                .build();
    }
}
