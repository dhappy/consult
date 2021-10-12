//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract IDXEndpointPublisher {
  constructor() {
  }

  function publish(string memory caip10) public {
    emit CAIP_10(caip10);
  }

  event CAIP_10(string caip10);
}
