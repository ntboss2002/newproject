package com.example.downloader.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "download_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** aria2 GID returned when the download is registered */
    @Column(length = 64)
    private String gid;

    /** Human-readable name (file name or torrent name) */
    @Column(nullable = false, length = 500)
    private String name;

    /** Original link/URL or a placeholder for uploaded torrent files */
    @Column(nullable = false, length = 2000)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DownloadType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DownloadStatus status;

    /** Download progress percentage (0–100) */
    @Builder.Default
    private Double progress = 0.0;

    /** Number of bytes downloaded so far */
    @Builder.Default
    private Long downloadedBytes = 0L;

    /** Total file size in bytes (0 means unknown) */
    @Builder.Default
    private Long totalBytes = 0L;

    /** Current download speed in bytes/sec */
    @Builder.Default
    private Long downloadSpeed = 0L;

    /** Current upload speed in bytes/sec */
    @Builder.Default
    private Long uploadSpeed = 0L;

    /** Number of connected peers */
    @Builder.Default
    private Integer numPeers = 0;

    /** Number of seeding peers */
    @Builder.Default
    private Integer numSeeders = 0;

    /** Directory where files are saved */
    @Column(length = 1000)
    private String savePath;

    /** aria2 error message when status is ERROR */
    @Column(length = 1000)
    private String errorMessage;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
