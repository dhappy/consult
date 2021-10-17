//SPDX-License-Identifier: Creative Commons 0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract VideosERC1155 is ERC1155 {
  mapping (uint256 => string) private _uris;

  uint8 constant ACCESS_TOKEN = 1;
  uint8 constant VIDEO_TOKEN = 2;

  uint256 public constant PUBLIC_ACCESS = (
    ACCESS_TOKEN + (1 << 8)
  );
  uint256 public constant CODER_ACCESS = (
    ACCESS_TOKEN + (2 << 8)
  );
  uint256 public constant SCRIBE_ACCESS = (
    ACCESS_TOKEN + (3 << 8)
  );
  uint256 public constant PEER_ACCESS = (
    ACCESS_TOKEN + (4 << 8)
  );
  uint256 public constant APPROVER_ACCESS = (
    ACCESS_TOKEN + (5 << 8)
  );
  uint256 public constant TREASURER_ACCESS = (
    ACCESS_TOKEN + (6 << 8)
  );
  uint256 public constant METAMANAGER_ACCESS = (
    ACCESS_TOKEN + (8 << 8)
  );
  uint256 public constant ADMIN_ACCESS = (
    ACCESS_TOKEN + (8 << 8)
  );

  constructor() ERC1155("Single Metadata URI Is Not Used") {
    setURI(
      "ipfs://QmNTGedv6su4LM8XFqonNCdXQYLL4z7VThha7WczGf7iMf/public%20access%20token.json",
      PUBLIC_ACCESS
    );
  }

  function mintAccessToken(
    uint256 tokenId
  ) public {
    require(
      tokenId & 0xFF == ACCESS_TOKEN,
      "Not an access token."
    );
    require(
      balanceOf(msg.sender, tokenId) == 0,
      "User already has the given access token"
    );
    _mint(msg.sender, tokenId, 1, "");
  }

  function contractURI()
  public pure
  returns (string memory) {
    return "ipfs://QmXFiKzEnZEZNiJEHwKympHWZ8MJSbegC2Bnvvk2iKPLe5/video%20contract%20metadata.json";
  }

  function tokenURI(
    uint256 tokenId
  ) public view
  returns (string memory) {
    return uri(tokenId);
  }

  function uri(
    uint256 tokenId
  ) public view virtual override
  returns (string memory) {
    return _uris[tokenId];
  }

  function setURI(
    string memory newuri,
    uint256 tokenId
  ) public virtual {
    _uris[tokenId] = newuri;
    emit URI(newuri, tokenId);
  }
}