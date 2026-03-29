package com.example.shop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Information about a single BitTorrent peer connected during a download.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerInfo {

    private String peerId;

    /** Peer IP address */
    private String ip;

    /** Peer port */
    private int port;

    /** Download speed from this peer (bytes/sec) */
    private long downloadSpeed;

    /** Upload speed to this peer (bytes/sec) */
    private long uploadSpeed;

    /** True when the peer is seeding */
    private boolean seeder;

    /** True when we are choking this peer */
    private boolean amChoking;

    /** True when this peer is choking us */
    private boolean peerChoking;
}
