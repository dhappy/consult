# Call Meta

The aim of this program is to associate time-sensitive metadata with the playback of recordings of livestreams of pair-programming sessions and virtual meetings with the goal of making it possible to comprehend the proceedings in significantly less time.

## Technology

The video data and metainformation is stored in [IPFS](//ipfs.io) with a pointer placed in a [Ceramic](//ceramic.network) stream for discovery.

There is a DID NFT controlled document with the listing of available videos. Users can request a token giving them write access.

## Development

* `yarn && yarn start` to start the development server
* `yarn deploy` to publish to GitHub pages