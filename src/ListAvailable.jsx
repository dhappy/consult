export default () => null

// import { Link } from 'react-router-dom'
// import { Heading, ListItem, Spinner, Stack, UnorderedList } from "@chakra-ui/react";
// import { ethers } from 'ethers'
// import Ceramic from '@ceramicnetwork/http-client'
// import { IDX } from '@ceramicstudio/idx'
// import { DID } from 'dids'
// import {
//   ThreeIdConnect, EthereumAuthProvider,
// } from '@3id/connect'
// import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
// import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'
// import info from 'contract/address.json'
// import abi from 'contract/abi/IDXEndpointPublisher.json'
// import ceramicIds from 'ceramicIds.json'
// import { useEffect, useCallback, useMemo, useState } from 'react'

// export default () => {
//   const [docs, setDocs] = useState(null)
//   const provider = useMemo(() => (
//     new ethers.providers.JsonRpcProvider(
//       'https://polygon-mumbai.infura.io/v3/7ba21f9ee8d2422da87d1c35bcead48b'
//     )),
//     []
//   )
//   const ensProvider = useMemo(() => (
//     new ethers.providers.JsonRpcProvider(
//       'https://mainnet.infura.io/v3/7ba21f9ee8d2422da87d1c35bcead48b'
//     )),
//     []
//   )
//   const contract = useMemo(() => (
//     new ethers.Contract(info.address, abi, provider)
//     ),
//     [provider]
//   )

//   const events = useCallback(async () => {
//     const [address] = await window.ethereum.enable()
//     const filter = contract.filters.CAIP_10()
//     const events = await contract.queryFilter(filter, -90000)
//     const addrs = [...new Set(
//       ...events.map(
//         ({ args: { caip10: addr } }) => addr
//       ),
//       [`eip155:1:${address}`],
//     )]

//     const CERAMIC_URL = (
//       process.env.CERAMIC_URL
//       || 'http://localhost:7007'
//       || 'https://ceramic-clay.3boxlabs.com'
//     )
//     const ceramic = new Ceramic(CERAMIC_URL)
//     const idx = new IDX({ ceramic, autopin: true })
//     const threeIdConnect = new ThreeIdConnect()
//     const authProvider = new EthereumAuthProvider(
//       window.ethereum, address
//     )
//     await threeIdConnect.connect(authProvider)
//     const did = new DID({
//       provider: threeIdConnect.getDidProvider(),
//       resolver: ThreeIdResolver.getResolver(ceramic),
//     })
//     await did.authenticate()
//     ceramic.did = did

//     console.info({ addrs, address })

//     const docs = await Promise.all(
//       addrs.map(async (caip10) => {
//         let id = caip10.toLowerCase()
//         const match = id.match(
//           /^(eip155):(\d+):(.+)$/
//         )
//         if(match) {
//           id = `${match[3]}@${match[1]}:${match[2]}`
//         }
//         const caip = await (
//           Caip10Link.fromAccount(ceramic, id)
//         )
//         const did = caip.did
//         if(did === null) {
//           throw new Error(`No DID Found for ${id}.`)
//         }
//         const index = await idx.get(
//           ceramicIds.definitions.ConsultVideoIndex,
//           did,
//         )
//         if(index === null) {
//           throw new Error(`No Index of Videos Found for ${did}.`)
//         }
//         const eth = id.replace(/@.*/, '')
//         const ens = await ensProvider.lookupAddress(eth)
//         return (
//           Object.entries(index).map(([title, url]) => ({
//             addr: ens ?? eth,
//             title,
//             url,
//           }))
//         )
//       })
//     )
//     setDocs(docs.flat())
//   }, [contract, ensProvider])

//   useEffect(() => events(), [events])

//   /*
//   const pub = () => {
//     const caip10 = 'eip155:1:0x615b044b6ccb048532bcf99aadf619d7fdd2aa01'
//     const plusSigner = contract.connect(provider.getSigner())
//     plusSigner.publish(caip10)
//   }
//   */
 
//   return (
//     !docs ? (
//       <Stack align="center" mt={12}>
//         <Heading>Loading…</Heading>
//         <Spinner/>
//       </Stack>
//     ) : (
//       <UnorderedList>
//         {docs.map(({addr, title, url}, idx) => (
//           <ListItem key={idx}><Link to={url}>
//             {addr}: {title}
//           </Link></ListItem>
//         ))}
//       </UnorderedList>
//     )
//   )
// }