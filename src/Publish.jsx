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
import aliases from './ceramicIds.json'
import { isSet, isoStringFor, load, toHTTP } from './utils'

export default ({
  desiredChain, nftDID, access, contract,
  address, chain, setProvider,
}) => {
  const [info, setInfo] = useState(null)
  const [token, setToken] = useState(null)
  const [balance, setBalance] = useState(null)
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

    try {
      await ceramic.authenticate()

      const list = await TileDocument.create(
        ceramic.client,
        null,
        {
          controllers: [nftDID],
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
    if(access.public) {
      info()
    }
  }, [access.public])

  return (
    <Flex
      direction="column" maxW={50 * 16}
      align="center" mt={3} mx="auto"
    >
      {(() => {
        if(!info) {
          return (
            <Flex align="center">
              <Text>Loading Metadata from IPFS…</Text>
              <Spinner size="xl"/>
            </Flex>
          )
        }

        return (
          <Stack>
            <Flex
              direction={['column', 'row']}
              align="center" alignSelf="stretch"
            >
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
                    isSet(metadata) ? (
                      title && startsAt ? (
                        <Button
                          onClick={serialize}
                        >Write Metadata To Ceramic</Button>
                      ) : (
                        <Text fontSize="125%" maxW={16 * 16}>
                          Error: Invalid Metadata:{' '}
                          Couldn’t find the{' '}
                          {!title && 'title '}
                          {!title && !startsAt && 'and '}
                          {!startsAt && 'start time '}
                          in the given data.
                        </Text>
                      )
                    ) : (
                      <Text
                        fontSize="125%" maxW={16 * 16}
                      >Please specify a recording metadata file to upload to Ceramic.</Text>
                    )
                  )}
                </Box>
              )}
            </Flex>
            <Box as="form" w="full" mt={3}>
              <Tooltip hasArrow label="Recording Metadata">
                <Input
                  placeholder="Recording Metadata (ipfs://…)"
                  w="full" textAlign="center"
                  value={metadata} autoFocus={!metadata}
                  onChange={({ target: { value } }) => {
                    setTitle(null)
                    setStartsAt(null)
                    setMetadata(value)
                  }}
                />
              </Tooltip>
              <Flex
                justify="center" align="center"
                direction={['column', 'row']} mt={1}
              >
                <Tooltip
                  hasArrow label="Recording Start Time"
                >
                  <Text maxW="6em" textAlign="center">
                    {isoStringFor(
                      startsAt,
                      {
                        default: null,
                        dateSeparator: '/',
                        partsSeparator: ' '
                      }
                    )}
                  </Text>
                </Tooltip>
                <Tooltip hasArrow label="Recording Title">
                  <Input
                    placeholder="Recording Title" mt={3}
                    value={title ?? ''} textAlign="center"
                    onChange={({ target: { value } }) => {
                      setTitle(value)
                    }}
                  />
                </Tooltip>
              </Flex>
            </Box>
          </Stack>
        )
      })()}
    </Flex>
  )
}