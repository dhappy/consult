# Call Meta

The aim of this program is to associate time-sensitive metadata with the playback of recordings of livestreams of pair-programming sessions and virtual meetings.

The metainformation is stored in IPFS with a reference put in Ceramic and retrievable using an IDX schema.

In order to permit discovery of new video lists, when a user creates a new list an event is generated on the Polygon blockchain.

## Development

This is a `create-react-app`-based application and all the regular `yarn` commands function.

Additionally, `yarn contract:deploy` will compile and deploy the [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md#simple-summary) publishing contract to the Polygon Mumbai Test Network, and record the ABI & contract address in the `src/` tree.