package com.example.downloader.model;

public enum DownloadStatus {
    WAITING,   // Queued, not yet started
    ACTIVE,    // Currently downloading
    PAUSED,    // Manually paused
    COMPLETE,  // Download finished
    ERROR,     // Failed with error
    REMOVED    // Removed from queue
}
