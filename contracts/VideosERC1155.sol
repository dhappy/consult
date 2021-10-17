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

  uint8 public constant PUBLIC_TYPE = 1;
  uint256 public constant PUBLIC_ACCESS = (
    ACCESS_TOKEN + (PUBLIC_TYPE << 8)
  );
  uint8 public constant CODER_TYPE = 2;
  uint256 public constant CODER_ACCESS = (
    ACCESS_TOKEN + (CODER_TYPE << 8)
  );
  uint8 public constant SCRIBE_TYPE = 3;
  uint256 public constant SCRIBE_ACCESS = (
    ACCESS_TOKEN + (SCRIBE_TYPE << 8)
  );
  uint8 public constant PEER_TYPE = 4;
  uint256 public constant PEER_ACCESS = (
    ACCESS_TOKEN + (PEER_TYPE << 8)
  );
  uint8 public constant APPROVER_TYPE = 5;
  uint256 public constant APPROVER_ACCESS = (
    ACCESS_TOKEN + (APPROVER_TYPE << 8)
  );
  uint8 public constant TREASURER_TYPE = 6;
  uint256 public constant TREASURER_ACCESS = (
    ACCESS_TOKEN + (TREASURER_TYPE << 8)
  );
  uint8 public constant ADMIN_TYPE = 7;
  uint256 public constant ADMIN_ACCESS = (
    ACCESS_TOKEN + (ADMIN_TYPE << 8)
  );

  constructor() ERC1155("Single Metadata URI Is Not Used") {
    setURI(
      "ipfs://QmNTGedv6su4LM8XFqonNCdXQYLL4z7VThha7WczGf7iMf/public%20access%20token.json",
      PUBLIC_ACCESS
    );
  }

  function mintAccessToken(uint8 class) public {
    uint256 id = ACCESS_TOKEN + (class << 8);
    require(
      balanceOf(msg.sender, id) == 0,
      "User already has the given access token"
    );
    _mint(msg.sender, id, 1, "");
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