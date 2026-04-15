// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetRegistry is ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    struct Asset {
        string name;
        string assetType;
        uint256 valuation;
        string metadataURI;
    }

    mapping(uint256 => Asset) public assets;

    address public issuer;

    event AssetMinted(uint256 tokenId, address owner);
    event AssetTransferred(uint256 tokenId, address from, address to);

    modifier onlyIssuer() {
        require(msg.sender == issuer, "Not authorized");
        _;
    }

    constructor(address _issuer) ERC721("AssetRegistry", "ARWA") Ownable(msg.sender) {
        issuer = _issuer;
    }

    function mintAsset(
        address to,
        string memory name,
        string memory assetType,
        uint256 valuation,
        string memory metadataURI
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        assets[tokenId] = Asset(name, assetType, valuation, metadataURI);

        emit AssetMinted(tokenId, to);

        return tokenId;
    }

    function transferAsset(address from, address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == from, "Not owner");
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");

        _transfer(from, to, tokenId);

        emit AssetTransferred(tokenId, from, to);
    }

    function getAsset(uint256 tokenId) public view returns (Asset memory) {
        return assets[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
