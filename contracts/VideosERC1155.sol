//SPDX-License-Identifier: Creative Commons 0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract VideosERC1155 is ERC1155 {
  uint256 public constant PUBLIC = 1;

  constructor() ERC1155("https://dhappy.github.io/token/{id}.json") {
  }

  function giveAccess(
    address 
  ) public {
  }
}