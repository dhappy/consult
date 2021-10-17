import {
  useEffect, useMemo, useState,
} from 'react'
import { ethers } from 'ethers'
import { BigNumber} from '@ethersproject/bignumber'
import {
  Button, Flex, Heading, Image, Link, Spinner,
  Stack, Text,
} from '@chakra-ui/react'
import addresses from './contract/addresses.json'
import ABI from './contract/abi/VideosERC1155.json'

const { VideosERC1155 } = addresses

export default () => {
  const [info, setInfo] = useState(null)
  const [token, setToken] = useState(null)
  const [address, setAddress] = useState(null)
  const [balance, setBalance] = useState(null)
  const [contract, setContract] = useState(null)
  const [chain, setChain] = (
    useState({ name: 'Undefined' })
  )
  const desiredChain = useMemo(() => ({
    id: 80001,
    name: 'Polygon’s Mumbai Testnet',
    rpc: 'https://rpc-mumbai.maticvigil.com',
    currency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
    explorer: 'https://mumbai.polygonscan.com',
  }), [])
  const [provider, setProvider] = (
    useState(null)
  )

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
      } else {
        return `//ipfs.io/ipfs/${match[2]}`
      }
    }
    return URI
  }

  const load = async (URI) => {
    const response = await fetch(toHTTP(URI))
    return await response.json()
  }

  const mint = async () => {
    const publicType = await contract.PUBLIC_TYPE()
    await contract.mintAccessToken(publicType)
  }

  useEffect(() => {
    const config = async () => {
      const [address] = (
        (await window.ethereum.send(
          'eth_requestAccounts'
        ))
        .result
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
    const info = async () => {
      const contract = (
        new ethers.Contract(
          VideosERC1155, ABI, provider.getSigner()
        )
      )
      setContract(contract)
      const publicAccess = (
        await contract.PUBLIC_ACCESS()
      )
      const balance = (
        await contract.balanceOf(
          address, publicAccess
        )
      )
      setBalance(balance)

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
            await contract.tokenURI(publicAccess)
          )
        )
        console.info({ tokenMeta })
        const { name, image, external_url: link } = (
          tokenMeta
        )
        setToken({ name, image: toHTTP(image), link })
      }
    }
    if(
      provider
      && chain.id === desiredChain.id
    ) {
      info()
    }
  }, [provider, chain.id, desiredChain.id])

  return (
    <Flex
      direction="column" maxW={80}
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
          return <Spinner size="xl"/>
        }

        return (
          <Stack align="center">
            <Link href={info.link} target="_blank">
              <Image
                src={info.image} alt={info.name}
                h="30vh"
              />
            </Link>
            {balance.isZero() ? (
              <Stack align="center" mt="6vh ! important">
                {token && (
                  <Link href={token.link} target="_blank">
                    <Image
                      src={token.image} alt={token.name}
                      h="30vh"
                    />
                  </Link>
                )}
                <Text textAlign="center">To write your video to the public log, an access token is required.</Text>
                <Button onClick={mint}>
                  Mint One
                </Button>
              </Stack>
            ): (
              <Button>Write Metadata To Ceramic</Button>
            )}
          </Stack>
        )
      })()}
    </Flex>
  )
}