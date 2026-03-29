package com.example.shop.service;

import com.example.shop.dto.response.PeerInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Thin JSON-RPC client that communicates with the aria2 download daemon.
 *
 * <p>Start aria2 with RPC enabled before using this application:
 * <pre>
 *   aria2c --enable-rpc --rpc-listen-all --rpc-secret=&lt;secret&gt; \
 *          --rpc-listen-port=6800 --continue=true
 * </pre>
 */
@Slf4j
@Service
public class Aria2RpcClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicLong idCounter = new AtomicLong(1);

    @Value("${aria2.rpc.url:http://localhost:6800/jsonrpc}")
    private String rpcUrl;

    @Value("${aria2.rpc.secret:}")
    private String rpcSecret;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /** @return true when the aria2 daemon is reachable */
    public boolean isRunning() {
        try {
            call("aria2.getVersion");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Add a download by URI list (magnet, ed2k, or URL to .torrent).
     *
     * @param uris     one or more URIs pointing to the same resource
     * @param savePath optional download directory; pass null to use aria2 default
     * @return aria2 GID for the new download
     */
    public String addUri(List<String> uris, String savePath) {
        ObjectNode options = objectMapper.createObjectNode();
        if (savePath != null && !savePath.isBlank()) {
            options.put("dir", savePath);
        }

        ArrayNode uriArray = objectMapper.createArrayNode();
        uris.forEach(uriArray::add);

        JsonNode result = call("aria2.addUri", uriArray, options);
        return result.asText();
    }

    /**
     * Add a download from a base64-encoded .torrent file.
     *
     * @param base64Torrent base64 string of the .torrent file content
     * @param savePath      optional download directory; pass null to use aria2 default
     * @return aria2 GID
     */
    public String addTorrent(String base64Torrent, String savePath) {
        ObjectNode options = objectMapper.createObjectNode();
        if (savePath != null && !savePath.isBlank()) {
            options.put("dir", savePath);
        }

        ArrayNode emptyUris = objectMapper.createArrayNode();
        JsonNode result = call("aria2.addTorrent", base64Torrent, emptyUris, options);
        return result.asText();
    }

    /**
     * Returns a map with the current status fields for the given GID.
     * Keys correspond to the aria2 tellStatus response fields.
     */
    public Map<String, String> tellStatus(String gid) {
        JsonNode result = call("aria2.tellStatus", gid);
        Map<String, String> status = new LinkedHashMap<>();
        result.fields().forEachRemaining(e -> {
            if (e.getValue().isTextual()) {
                status.put(e.getKey(), e.getValue().asText());
            }
        });
        return status;
    }

    /**
     * Returns a list of {@link PeerInfo} for the given torrent/magnet download.
     * Only available while the download is active (aria2 will return an empty list
     * for other protocols like ed2k or plain HTTP).
     */
    public List<PeerInfo> getPeers(String gid) {
        try {
            JsonNode result = call("aria2.getPeers", gid);
            List<PeerInfo> peers = new ArrayList<>();
            if (result.isArray()) {
                for (JsonNode peer : result) {
                    peers.add(PeerInfo.builder()
                            .peerId(peer.path("peerId").asText(""))
                            .ip(peer.path("ip").asText(""))
                            .port(peer.path("port").asInt(0))
                            .downloadSpeed(peer.path("downloadSpeed").asLong(0))
                            .uploadSpeed(peer.path("uploadSpeed").asLong(0))
                            .seeder("true".equalsIgnoreCase(peer.path("seeder").asText()))
                            .amChoking("true".equalsIgnoreCase(peer.path("amChoking").asText()))
                            .peerChoking("true".equalsIgnoreCase(peer.path("peerChoking").asText()))
                            .build());
                }
            }
            return peers;
        } catch (Exception e) {
            log.debug("getPeers failed for gid {}: {}", gid, e.getMessage());
            return Collections.emptyList();
        }
    }

    /** Pause an active or waiting download. */
    public void pause(String gid) {
        call("aria2.pause", gid);
    }

    /** Resume a paused download. */
    public void unpause(String gid) {
        call("aria2.unpause", gid);
    }

    /**
     * Remove a download from aria2.
     * Uses forceRemove so it works for active downloads too.
     */
    public void forceRemove(String gid) {
        call("aria2.forceRemove", gid);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Build and execute a JSON-RPC request.
     *
     * @param method aria2 method name (e.g. "aria2.addUri")
     * @param args   positional parameters (after the optional token parameter)
     * @return the "result" node from the aria2 response
     */
    private JsonNode call(String method, Object... args) {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("jsonrpc", "2.0");
        request.put("method", method);
        request.put("id", String.valueOf(idCounter.getAndIncrement()));

        ArrayNode params = objectMapper.createArrayNode();
        if (rpcSecret != null && !rpcSecret.isBlank()) {
            params.add("token:" + rpcSecret);
        }
        for (Object arg : args) {
            if (arg instanceof JsonNode) {
                params.add((JsonNode) arg);
            } else if (arg instanceof String) {
                params.add((String) arg);
            } else {
                params.addPOJO(arg);
            }
        }
        request.set("params", params);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity;
        try {
            entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize JSON-RPC request", e);
        }

        ResponseEntity<JsonNode> response;
        try {
            response = restTemplate.exchange(rpcUrl, HttpMethod.POST, entity, JsonNode.class);
        } catch (RestClientException e) {
            throw new RuntimeException("aria2 RPC call failed – is aria2 running? (" + e.getMessage() + ")", e);
        }

        JsonNode body = response.getBody();
        if (body == null) {
            throw new RuntimeException("Empty response from aria2 RPC");
        }
        if (body.has("error")) {
            throw new RuntimeException("aria2 error: " + body.get("error").path("message").asText());
        }
        return body.path("result");
    }
}
