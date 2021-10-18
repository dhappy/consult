import {
  Button, Stack, Heading,
} from '@chakra-ui/react'
import {
  HashRouter as Router, Switch, Route,
} from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { createNftDidUrl } from 'nft-did-resolver'
import Publish from './Publish'
import New from './New'
import View from './View'
import ListAvailable from './ListAvailable'
import addresses from './contract/addresses.json'
import ABI from './contract/abi/VideosERC1155.json'

const { VideosERC1155 } = addresses

const chains = {
  mumbai: {
    id: 80001,
    name: 'Polygon’s Mumbai Testnet',
    rpc: 'https://rpc-mumbai.maticvigil.com',
    currency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
    explorer: 'https://mumbai.polygonscan.com',
  },
  rinkeby: {
    id: 4,
    name: 'Rinkeby Testnet',
    rpc: process.env.RINKEBY_RPC_URL,
    currency: {
      name: 'ETH',
      symbol: 'Ξ',
      decimals: 18,
    },
    explorer: 'https://rinkeby.etherscan.io',
  }
}
const desiredChain = chains.rinkeby

export default () => {
  const [access, setAccess] = useState({})
  const [nftDID, setNFTDID] = useState(null)
  const [address, setAddress] = useState(null)
  const [chain, setChain] = (
    useState({ name: 'Undefined' })
  )
  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)

  const network = async () => {
    if(chain.id !== desiredChain.id) {
      const chainId = (
        `0x${desiredChain.id.toString(16)}`
      )

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        })
      } catch(error) {
        if(error.code === 4902) { // not added
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId,
                chainName: desiredChain.name,
                rpcUrls: [desiredChain.rpc],
                nativeCurrency: (
                  desiredChain.currency
                ),
                blockExplorerUrls: [
                  desiredChain.explorer
                ],
              }],
            })
          } catch(addError) {
            console.error('Add Error', addError)
          }
        }
      }
    }
    setProvider(
      new ethers.providers.Web3Provider(
        window.ethereum
      )
    )
  }

  useEffect(() => {
    const config = async () => {
      const [address] = (
        await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: [{}],
        })
      )
      setAddress(address)

      setProvider(
        new ethers.providers.Web3Provider(
          window.ethereum
        )
      )
    }
    config()
  }, [])

  useEffect(() => {
    const listen = async () => {
      provider.on(
        'network',
        ({ chainId: id, name }) => {
          setChain({ id, name })
        },
      )
      window.ethereum.on(
        'chainChanged',
        async (arg) => {
          const provider = (
            new ethers.providers.Web3Provider(
              window.ethereum
            )
          )
          const { chainId: id, name } = (
            await provider.getNetwork()
          )
          setChain({ id, name })
        },
      )
      provider.on(
        'accountsChanged',
        ([addr]) => setAddress(addr),
      )
      return () => {
        provider.off('network')
        provider.off('accountsChanged')
        window.ethereum.off('chainChanged')
      }
    }
    if(provider) {
      listen()
    }
  }, [provider])

  useEffect(() => {
    if(provider) {
      setContract(
        new ethers.Contract(
          VideosERC1155, ABI, provider.getSigner()
        )
      )
    }
  }, [provider])

  useEffect(() => {
    const cache = async () => {
      const id = await contract.PUBLIC_ACCESS()
      setAccess((old) => ({ ...old, public: id }))
    }
    if(contract && chain.id === desiredChain.id) {
      cache()
    }
  }, [contract, chain.id, desiredChain.id])

  useEffect(() => {
    if(access.public) {
      setNFTDID(createNftDidUrl({
        chainId: `eip155:${desiredChain.id}`,
        namespace: 'erc1155',
        contract: VideosERC1155.toLowerCase(),
        tokenId: access.public.toString(),
      }))
    }
  }, [access.public])

  if(chain.id !== desiredChain.id) {
    return (
      <Stack maxW={30 * 16} m="auto" mt={10}>
        <Heading textAlign="center">
          On the chain <q>{chain.name}</q> when {desiredChain.name} is desired.
        </Heading>
        <Button onClick={network}>
          Switch
        </Button>
      </Stack>
    )
  }

  return (
    <Router>
      <Switch>
        <Route exact path="/new" component={New}/>
        <Route path="/publish">
          <Publish {...{
            desiredChain, nftDID, access,
            contract, address, setProvider,
          }}/>
        </Route>
        <Route path="/">
          <View {...{ nftDID }}/>
        </Route>
        <Route exact path="/" component={ListAvailable}/>
      </Switch>
    </Router>
  )
}