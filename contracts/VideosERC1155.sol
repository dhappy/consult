//SPDX-License-Identifier: Creative Commons 0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract VideosERC1155 is ERC1155 {
  mapping (uint256 => string) private _uris;
  string public name = (
    "Call Meta Access & Hours Tokens"
  );
  string public symbol = "CMAnH";

  uint8 constant ACCESS_TOKEN = 1;
  uint8 constant VIDEO_TOKEN = 2;

  uint256 public constant PUBLIC_ACCESS = (
    ACCESS_TOKEN << 248 + 1
  );
  uint256 public constant CODER_ACCESS = (
    ACCESS_TOKEN << 248 + 2
  );
  uint256 public constant SCRIBE_ACCESS = (
    ACCESS_TOKEN << 248 + 3
  );
  uint256 public constant PEER_ACCESS = (
    ACCESS_TOKEN << 248 + 4
  );
  uint256 public constant APPROVER_ACCESS = (
    ACCESS_TOKEN << 248 + 5
  );

  constructor() ERC1155("Single Metadata URI Is Not Used") {
    setURI(
      "ipfs://QmPEjozUaEAns9np7KsrV9hXVoBd6mQK3FmyJ2jeK3Y7kc/public%20access%20token.json",
      PUBLIC_ACCESS
    );
  }

  function accessToken(uint8 class) public {
    uint256 id = ACCESS_TOKEN << 248 + class;
    require(
      balanceOf(msg.sender, id) == 0,
      "User already has the given access token"
    );
    _mint(msg.sender, id, 1, "");
  }

  function publicAccessToken() public {
    accessToken(1);
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