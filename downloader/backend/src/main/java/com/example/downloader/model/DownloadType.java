package com.example.downloader.model;

public enum DownloadType {
    TORRENT_URL,   // HTTP/HTTPS URL pointing to a .torrent file
    TORRENT_FILE,  // Direct .torrent file upload (base64-encoded content)
    MAGNET,        // magnet: URI
    ED2K           // ed2k:// URI (eDonkey / eMule link)
}
