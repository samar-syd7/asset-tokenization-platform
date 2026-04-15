// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// This legacy file was renamed to packages/hardhat/contracts/AssetRegistry.sol.
// The legacy YourCollectible.sol source is retained only for repository compatibility.

// Deprecated legacy contract file.
/*
// This legacy file has been renamed to packages/hardhat/contracts/AssetRegistry.sol.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// Deprecated legacy contract file.
// The production contract is now in packages/hardhat/contracts/AssetRegistry.sol.   string metadataURI;
    }

    mapping(uint256 => Asset) public assets;

    address public issuer;

    event AssetMinted(uint256 tokenId, address owner);
    event AssetTransferred(uint256 tokenId, address from, address to);
// Deprecated legacy contract contents removed.
    // Deprecated legacy contract contents removed.

    /* Legacy contract contents have been removed.
       The production contract lives in packages/hardhat/contracts/AssetRegistry.sol. */

    // Deprecated mintAsset implementation removed.

    function transferAsset(address from, address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == from, "Not owner");
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");

        _transfer(from, to, tokenId);

        emit AssetTransferred(tokenId, from, to);
    }

    function getAsset(uint256 tokenId) public view returns (Asset memory) {
        return assets[tokenId];
    }

*/