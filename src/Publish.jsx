import {
  useEffect, useMemo, useState,
} from 'react'
import {
  Button, Flex, Heading, Image, Link, Spinner,
  Stack, Text, Input, Box, Tooltip,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { createNftDidUrl } from 'nft-did-resolver'
import { useCeramic } from 'use-ceramic'
import { DataModel } from '@glazed/datamodel'
import { DIDDataStore } from '@glazed/did-datastore'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { useLocation, useRouteMatch } from 'react-router'
import { v4 as uuid } from 'uuid'
import json5 from 'json5'
import addresses from './contract/addresses.json'
import ABI from './contract/abi/VideosERC1155.json'
import aliases from './ceramicIds.json'
import { isSet, isoStringFor } from './utils'

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

export default () => {
  const [info, setInfo] = useState(null)
  const [token, setToken] = useState(null)
  const [address, setAddress] = useState(null)
  const [balance, setBalance] = useState(null)
  const [contract, setContract] = useState(null)
  const [access, setAccess] = useState({})
  const [chain, setChain] = (
    useState({ name: 'Undefined' })
  )
  const desiredChain = chains.rinkeby
  const [provider, setProvider] = (
    useState(null)
  )
  const [title, setTitle] = useState(null)
  const [startsAt, setStartsAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [minting, setMinting] = useState(false)
  const [authed, setAuthed] = useState(false)
  const { pathname: path } = useLocation()
  const { url } = useRouteMatch()
  const [metadata, setMetadata] = (
    useState(() => {
      if(!path.startsWith(url)) {
        return path
      }
      return (
        path.substring(url.length)
        .replace(/^\/*/g, '')
      )
    })
  )
  const ceramic = useCeramic()

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

  const toHTTP = (URI) => {
    const regex = /^ipfs:(\/\/)?(([^/]+)\/?(.*))$/i
    const match = URI.match(regex)
    if(match) {
      if(match[2].startsWith('bafybe')) {
        return (
          `//${match[3]}.ipfs.dweb.link`
          + `/${match[4]}`
        )
      }
      return `//ipfs.io/ipfs/${match[2]}`
    }
    return URI
  }

  const load = async (URI) => {
    const response = await fetch(toHTTP(URI))
    const text = await response.text()
    return (
      isSet(text)
      ? await json5.parse(text)
      : null
    )
  }

  const mint = async () => {
    setMinting(true)

    const { wait } = (
      await contract.mintAccessToken(access.public)
    )
    await wait(1) // 1 confirmation

    setMinting(false)
  }

  const serialize = async () => {
    setSaving(true)

    const did = createNftDidUrl({
      chainId: `eip155:${desiredChain.id}`,
      namespace: 'erc1155',
      contract: VideosERC1155.toLowerCase(),
      tokenId: access.public.toString(),
    })

    try {
      await ceramic.authenticate()

      const list = await TileDocument.create(
        ceramic.client,
        null,
        {
          controllers: [did],
          family: 'public video list',
          deterministic: true,
        },
        { anchor: false, publish: false },
      )
      const existing = list.content
      const entry = {
        id: uuid(),
        title,
        startsAt: isoStringFor(
          startsAt, { standard: true }
        ),
        metadata,
        lister: ceramic.did.id,
      }
      existing.videos ??= []
      existing.videos.push(entry)

      await list.update(existing)

      // const model = new DataModel({
      //   ceramic: ceramic.client, model: aliases
      // })
      // const store = new DIDDataStore({
      //   ceramic: ceramic.client, model
      // })
      // console.info({
      //   m: (await model.loadTile('buildersAlign')).content
      // })
      // console.info({ s: await store.get('publicVideos') })
    } catch(e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const subscription = (
      ceramic.isAuthenticated$.subscribe(
        (authed) => setAuthed(authed)
      )
    )
    return () => subscription.unsubscribe()
  })

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
    const entitle = async () => {
      const info = await load(metadata)
      setTitle(info.stops.title)
      setStartsAt(
        new Date(info.video.startsAt)
      )
    }
    if(isSet(metadata)) {
      entitle()
    }
  }, [metadata])

  useEffect(() => {
    if(provider) {
      provider.on(
        'network',
        (net) => {
          const { chainId: id, name } = net
          setChain({ id, name })
        },
      )
      return () => provider.off('network')
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
    if(contract) {
      cache()
    }
  }, [contract])

  useEffect(() => {
    const balance = async () => {
      setBalance(
        await contract.balanceOf(
          address, access.public
        )
      )
    }
    if(
      address && contract
      && access.public && !minting
    ) {
      balance()
    }
  }, [address, contract, access.public, minting])

  useEffect(() => {
    const info = async () => {
      {
        const contractMeta = (
          await load(await contract.contractURI())
        )
        const { name, image, external_link: link } = (
          contractMeta
        )
        setInfo({ name, image: toHTTP(image), link })
      }

      {
        const tokenMeta = (
          await load(
            await contract.tokenURI(access.public)
          )
        )
        const { name, image, external_url: link } = (
          tokenMeta
        )
        setToken({ name, image: toHTTP(image), link })
      }
    }
    if(
      provider
      && chain.id === desiredChain.id
      && access.public
    ) {
      info()
    }
  }, [
    provider, access.public,
    chain.id, desiredChain.id,
  ])

  return (
    <Flex
      direction="column" maxW={50 * 16}
      align="center" mt={3} mx="auto"
    >
      {(() => {
        if(chain.id !== desiredChain.id) {
          return (
            <Stack>
              <Heading textAlign="center">
                On the chain <q>{chain.name}</q> when {desiredChain.name} is desired.
              </Heading>
              <Button onClick={network}>
                Switch
              </Button>
            </Stack>
          )
        }

        if(!info) {
          return (
            <Flex align="center">
              <Spinner size="xl"/>
            </Flex>
          )
        }

        return (
          <Flex align="center" alignSelf="stretch">
            <Link
              href={info.link} target="_blank"
              flexGrow={1}
            >
              <Image
                src={info.image} alt={info.name}
                h="65vmin" maxW="70vmin" m="auto"
              />
            </Link>
            {balance?.isZero() ? (
              <Stack
                flexGrow={1} align="center"
                mt="6vh ! important"
              >
                {token && (
                  <Link href={token.link} target="_blank">
                    <Image
                      src={token.image} alt={token.name}
                      h="50vmin" maxW="50vmin"
                    />
                  </Link>
                )}
                <Text
                  textAlign="center" maxW={30 * 16}
                >To write your video to the public log, an access token is required.</Text>
                {minting ? (
                  <Spinner/>
                ) : (
                  <Button onClick={mint}>
                    Mint One
                  </Button>
                )}
              </Stack>
            ): (
              <Box align="center" flexGrow={1}>
                {saving ? (
                  <Spinner size="xl"/>
                ) : (
                  <Button
                    onClick={serialize}
                  >Write Metadata To Ceramic</Button>
                )}
              </Box>
            )}
          </Flex>
        )
      })()}
      <Box as="form" w="full" mt={3}>
        <Tooltip hasArrow label="Recording Metadata">
          <Input
            placeholder="Recording Metadata"
            w="full" textAlign="center"
            value={metadata}
            onChange={({ target: { value } }) => {
              setMetadata(value)
            }}
          />
        </Tooltip>
        <Flex justify="center" align="center">
          <Tooltip
            hasArrow label="Recording Start Time"
          >
            <Text maxW="6em" textAlign="center">
              {isoStringFor(
                startsAt,
                {
                  default: '',
                  dateSeparator: '/',
                  partsSeparator: ' '
                }
              )}
            </Text>
          </Tooltip>
          <Tooltip hasArrow label="Recording Title">
            <Input
              placeholder="Recording Title"
              value={title ?? ''}
              onChange={({ target: { value } }) => {
                setTitle(value)
              }}
            />
          </Tooltip>
        </Flex>
      </Box>
    </Flex>
  )
}