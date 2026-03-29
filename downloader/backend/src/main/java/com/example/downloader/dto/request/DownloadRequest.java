package com.example.downloader.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DownloadRequest {

    /**
     * The link to download. Accepts:
     *  - magnet:?xt=urn:btih:... (BitTorrent magnet URI)
     *  - ed2k://|file|...        (eDonkey / eMule link)
     *  - http(s)://...           (URL to a .torrent file)
     */
    @NotBlank(message = "下载链接不能为空")
    private String url;

    /**
     * Optional: directory where files will be saved.
     * Defaults to aria2's configured download directory when empty.
     */
    private String savePath;
}
