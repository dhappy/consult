import CID from './cid'

export const id = 'tip:w/MetaGame’s Builders/on/-3/♋/7/@/1/26/‒/1/78/'
export const startTime = new Date('2021-07-14T10:00:30-0400')
export const url = `https://ipfs.io/ipfs/${CID['/']}`
export const title = (
  <>
    {"Builders' Align for the Week of "}
    <a href='//z13cdn.web.app'>-3/♋/6</a>
    {" ‒ "}
    <a href='//z13cdn.web.app'>0</a>
  </>
)

export const chapters = []
// ;(async () => {
//   const threeIdConnect = new ThreeIdConnect()
//   const addresses = await window.ethereum.enable()
//   const authProvider = new EthereumAuthProvider(
//     window.ethereum, addresses[0]
//   )
//   await threeIdConnect.connect(authProvider)
//   const ceramic = new Ceramic(CERAMIC_URL)
//   const did = new DID({
//     provider: threeIdConnect.getDidProvider(),
//     resolver: ThreeIdResolver.getResolver(ceramic)
//   })
//   await did.authenticate()
//   ceramic.setDID(did)

//   const idx = new IDX({ ceramic })
//   const chapters = await idx.get(ids.definitions.consult)

//   console.info({ chapters })

//   // let prev
//   // for(let [time, info] of Object.entries(baseChapters)) {
//   //   info.start = timeFor(time)
//   //   if(prev) {
//   //     prev.end = timeFor(time)
//   //   }
//   //   prev = info
//   // }
  
//   return []
// })()

