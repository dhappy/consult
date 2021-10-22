import {
  Button, Stack, Heading, Text, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, FormControl,
  FormLabel, Select, ModalFooter, IconButton,
  Image, Tooltip,
} from '@chakra-ui/react'
import {
  HashRouter as Router, Switch, Route,
} from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { ethers } from 'ethers'
import { createNftDidUrl } from 'nft-did-resolver'
import { create as createIPFS } from 'ipfs-http-client'
import Publish from './Publish'
import New from './New'
import View from './View'
import ListAvailable from './ListAvailable'
import addresses from './contract/addresses.json'
import ABI from './contract/abi/VideosERC1155.json'
import { ifSet } from './utils'
import IPFSLogo from './images/IPFS.svg'

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

const IPFSSettings = ({
  ipfsURL, setIPFSURL, open, closeIPFSSettings,
}) => {
  const [url, setURL] = useState(
    process.env.IPFS_API_URL
    ?? ipfsURL
    ?? 'https://ipfs.infura.io:5001'
  )

  const save = (evt) => {
    evt.preventDefault()
    setIPFSURL(url)
    closeIPFSSettings()
  }

  return (
    <Modal
      size="xl"
      {...{ isOpen: open, onClose: closeIPFSSettings }}
    >
      <ModalOverlay/>
      <ModalContent as="form" onSubmit={save}>
        <ModalHeader
          textOverflow="ellipsis"
          overflow="hidden"
          whiteSpace="nowrap"
        >IPFS Settings</ModalHeader>
        <ModalCloseButton/>
        <ModalBody pb={6}>
          <FormControl mt={4}>
            <FormLabel>
              <Text
                as="acronym"
                title="Interplanetary Filesystem"
              >
                IPFS
              </Text>
              {' '}API Host
            </FormLabel>
            <Select
              value={url}
              onChange={({ target: { value } }) => {
                setURL(value)
              }}
            >
              <option value="http://localhost:5001">
                http://localhost:5001 (requires allowing CORS permission)
              </option>
              <option
                value="https://ipfs.infura.io:5001"
              >
                https://ipfs.infura.io:5001
              </option>
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="red"
            onClick={closeIPFSSettings}
          >Cancel</Button>
          <Button
            type="submit"
            colorScheme="blue" ml={3}
          >Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default () => {
  const [access, setAccess] = useState({})
  const [nftDID, setNFTDID] = useState(null)
  const [address, setAddress] = useState(null)
  const [chain, setChain] = (
    useState({ name: 'Undefined' })
  )
  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)
  const [ipfsURL, setIPFSURL] = useState('')
  const {
    isOpen: open,
    onOpen: openIPFSSettings,
    onClose: closeIPFSSettings,
  } = useDisclosure()

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

  const ipfs = useMemo(() => {
    const regex = (
      /^((https?):\/\/)?([^:/]+)?(:(\d+))?(.*)$/i
    )
    const match = ipfsURL.match(regex)
    if(!match) {
      toast({
        title: 'Malformed URL',
        description: `"${ipfsURL}" did not match expression "${regex.toString()}"`,
        status: 'error',
        duration: 12000,
        isClosable: true,
      })
    } else {
      const protocol = ifSet(match[2]) ?? 'http'
      const host = ifSet(match[3]) ?? 'localhost'
      const port = parseInt(ifSet(match[5]) ?? 5001)
      const config = { host, port, protocol }

      if(host.includes('infura')) {
        const id = process.env.INFURA_IPFS_PROJECT_ID
        if(!id) {
          toast({
            title: 'Missing Infura Credential',
            description: 'Expected $INFURA_IPFS_PROJECT_ID to be set.',
            status: 'error',
            duration: 10000,
            isClosable: true,
          })
        }
        const secret = process.env.INFURA_IPFS_SECRET
        if(!secret) {
          toast({
            title: 'Missing Infura Credential',
            description: 'Expected $INFURA_IPFS_SECRET to be set.',
            status: 'error',
            duration: 10000,
            isClosable: true,
          })
        }
        const auth = (
          'Basic '
          + (
            Buffer.from(id + ':' + secret)
            .toString('base64')
          )
        )
        config.headers = {
          authorization: auth,
        }
      }

      return createIPFS(config)
    }
  }, [ipfsURL])

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

  if(!provider) {
    return (
      <Stack align="center">
        <Text>Web3 wallet not connected.</Text>
        <Text>Should connect automatically.</Text>
      </Stack>
    )
  }

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

  const IPFSButton = ({ ...props }) => {
    const { maxW, maxH } = props
    return (
      <Tooltip label="Configure IPFS" hasArrow>
        <IconButton
          aria-label="Configure IPFS"
          icon={
            <Image
              {...{ maxW, maxH }}
              src={IPFSLogo}
            />
          }
          onClick={openIPFSSettings}
          {...props}
        />
      </Tooltip>
    )
  }

  return (
    <Router>
      <IPFSSettings {...{
        ipfsURL, setIPFSURL, open, closeIPFSSettings,
      }}/>

      <Switch>
        <Route exact path="/new">
          <New {...{ IPFSButton, ipfs }}/>
        </Route>
        <Route path="/publish">
          <Publish {...{
            nftDID, access, contract, address,
            IPFSButton,
          }}/>
        </Route>
        <Route path="/">
          <View {...{ nftDID, IPFSButton, ipfs }}/>
        </Route>
        <Route exact path="/" component={ListAvailable}/>
      </Switch>
    </Router>
  )
}