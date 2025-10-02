// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIdCounter;

    using Strings for uint256;
    mapping(uint256 => string) private tokenURIs;

    string private baseURI;

    constructor() ERC721("NFT", "MNFT") {}

    function setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );

        tokenURIs[tokenId] = tokenURI;
    }

    function setBaseURI(string memory uri) public onlyOwner {
        baseURI = uri;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(
            _exists(tokenId),
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
}
