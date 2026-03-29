package com.example.shop.dto.response;

import com.example.shop.model.DownloadStatus;
import com.example.shop.model.DownloadType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadResponse {

    private Long id;
    private String gid;
    private String name;
    private String url;
    private DownloadType type;
    private DownloadStatus status;
    private double progress;
    private long downloadedBytes;
    private long totalBytes;
    private long downloadSpeed;
    private long uploadSpeed;
    private int numPeers;
    private int numSeeders;
    private String savePath;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Live peer list (only populated when requesting a single task's details) */
    private List<PeerInfo> peers;

    /** Whether the aria2 daemon is reachable */
    private boolean aria2Connected;
}
