// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, Ownable {
    using Strings for uint256;
    mapping(uint256 => string) private tokenURIs;

    string private baseURI;
    uint256 private _tokenIdCounter;

    constructor() ERC721("NFT", "MNFT") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(
            _ownerOf(tokenId) != address(0),
            "ERC721Metadata: URI set of nonexistent token"
        );

        tokenURIs[tokenId] = _tokenURI;
    }

    function setBaseURI(string memory uri) public onlyOwner {
        baseURI = uri;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(
            _ownerOf(tokenId) != address(0),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory _tokenURI = tokenURIs[tokenId];
        string memory base = _baseURI();

        // Si no hay baseURI, devuelve el tokenURI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // Si ambos están definidos, concatena la baseURI y el tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // Si no hay tokenURI, concatena la baseURI y el tokenID (via Strings.toString).
        return string(abi.encodePacked(base, tokenId.toString()));
    }

    function mintNFT(
        address to,
        string memory uri
    ) public onlyOwner returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _mint(to, tokenId);
        setTokenURI(tokenId, uri);

        return tokenId;
    }
}
