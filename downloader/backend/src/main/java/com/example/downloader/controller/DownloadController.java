package com.example.downloader.controller;

import com.example.downloader.dto.request.DownloadRequest;
import com.example.downloader.dto.response.DownloadResponse;
import com.example.downloader.service.DownloadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * REST API for the download manager.
 *
 * <p>Supported link types:
 * <ul>
 *   <li>magnet:?xt=urn:btih:...  – BitTorrent magnet URI</li>
 *   <li>ed2k://|file|...         – eDonkey / eMule link</li>
 *   <li>http(s)://...            – URL to a remote .torrent file</li>
 *   <li>Multipart .torrent file  – via POST /api/downloads/torrent</li>
 * </ul>
 *
 * <p>All endpoints require an aria2 daemon to be running locally
 * (configured via {@code aria2.rpc.*} properties in application.yml).
 */
@RestController
@RequestMapping("/api/downloads")
@RequiredArgsConstructor
public class DownloadController {

    private final DownloadService downloadService;

    /** List all download tasks (status is refreshed from aria2 on each call). */
    @GetMapping
    public ResponseEntity<List<DownloadResponse>> getAllDownloads() {
        return ResponseEntity.ok(downloadService.getAllDownloads());
    }

    /**
     * Get a single task with full peer / node analysis.
     * The peer list is populated only for active BitTorrent / magnet downloads.
     */
    @GetMapping("/{id}")
    public ResponseEntity<DownloadResponse> getDownload(@PathVariable Long id) {
        return ResponseEntity.ok(downloadService.getDownload(id));
    }

    /**
     * Submit a new download by providing a magnet link, ed2k link, or URL
     * to a remote .torrent file.
     */
    @PostMapping
    public ResponseEntity<DownloadResponse> addDownload(@Valid @RequestBody DownloadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(downloadService.addDownload(request));
    }

    /**
     * Submit a new download by uploading a .torrent file directly.
     *
     * <p>Example (curl):
     * <pre>
     *   curl -X POST http://localhost:8081/api/downloads/torrent \
     *        -F "file=@my.torrent" -F "savePath=/downloads"
     * </pre>
     */
    @PostMapping(value = "/torrent", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DownloadResponse> addTorrentFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "savePath", required = false) String savePath) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(downloadService.addTorrentFile(file, savePath));
    }

    /** Pause an active download. */
    @PostMapping("/{id}/pause")
    public ResponseEntity<DownloadResponse> pauseDownload(@PathVariable Long id) {
        return ResponseEntity.ok(downloadService.pauseDownload(id));
    }

    /** Resume a paused download. */
    @PostMapping("/{id}/resume")
    public ResponseEntity<DownloadResponse> resumeDownload(@PathVariable Long id) {
        return ResponseEntity.ok(downloadService.resumeDownload(id));
    }

    /** Remove a download (stops it in aria2 and marks it REMOVED in the database). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeDownload(@PathVariable Long id) {
        downloadService.removeDownload(id);
        return ResponseEntity.noContent().build();
    }
}
