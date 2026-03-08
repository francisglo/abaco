// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LedgerAnchor {
    struct AnchorRecord {
        bytes32 rootHash;
        uint256 blockIndex;
        uint256 anchoredAt;
        string source;
    }

    AnchorRecord[] private anchors;

    event AnchorStored(
        uint256 indexed anchorId,
        bytes32 indexed rootHash,
        uint256 indexed blockIndex,
        string source,
        uint256 anchoredAt
    );

    function anchorRoot(bytes32 rootHash, uint256 blockIndex, string calldata source)
        external
        returns (uint256 anchorId)
    {
        require(rootHash != bytes32(0), "rootHash required");
        require(bytes(source).length > 0, "source required");

        anchors.push(
            AnchorRecord({
                rootHash: rootHash,
                blockIndex: blockIndex,
                anchoredAt: block.timestamp,
                source: source
            })
        );

        anchorId = anchors.length - 1;
        emit AnchorStored(anchorId, rootHash, blockIndex, source, block.timestamp);
    }

    function totalAnchors() external view returns (uint256) {
        return anchors.length;
    }

    function getAnchor(uint256 anchorId)
        external
        view
        returns (bytes32 rootHash, uint256 blockIndex, uint256 anchoredAt, string memory source)
    {
        require(anchorId < anchors.length, "anchor not found");
        AnchorRecord storage item = anchors[anchorId];
        return (item.rootHash, item.blockIndex, item.anchoredAt, item.source);
    }

    function getLatestAnchor()
        external
        view
        returns (bytes32 rootHash, uint256 blockIndex, uint256 anchoredAt, string memory source)
    {
        require(anchors.length > 0, "no anchors");
        AnchorRecord storage item = anchors[anchors.length - 1];
        return (item.rootHash, item.blockIndex, item.anchoredAt, item.source);
    }
}
