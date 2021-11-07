import { useState, useEffect, useMemo } from 'react'
import Ceramic from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import {
  Heading, Spinner, Stack, UnorderedList, ListItem,
  Flex, Textarea, Button, Input, Box, Table, Thead,
  Tbody, Tfoot, Tr, Th, Td, TableCaption, Text,
  Link as ChakraLink,
} from '@chakra-ui/react'
import {
  useLocation, useRouteMatch, useHistory,
} from 'react-router'
import { HashLink as Link } from 'react-router-hash-link'
import JSON5 from 'json5'
import { useCeramic } from 'use-ceramic'
import MarkedVideo from './MarkedVideo'
import { ifSet, isSet, load, isoStringFor } from './utils'

export default ({
  nftDID, IPFSButton, ipfs, ConnectButton,
  desiredChain,
}) => {
  const { pathname: path } = useLocation()
  const { url } = useRouteMatch()
  const [metaInput, setMetaInput] = useState('')
  const [metadata, setMetadata] = useState('')
  const [info, setInfo] = useState(null)
  const [videos, setVideos] = useState(null)
  const ceramic = useCeramic()
  const history = useHistory()

  const setFromObject = (json) => {
    const {
      video: { startsAt = null, source = null } = {},
      isNew, stops,
    } = (
      json
    )
    setInfo({
      startsAt: new Date(startsAt), source, stops, isNew,
    })
  }

  useEffect(() => {
    if(isSet(path) && path !== '/') {
      if(!path.startsWith(url)) {
        setMetadata(path)
      } else {
        setMetadata(
          path.substring(url.length)
          .replace(/^\/*/g, '')
        )
      }
    }
  }, [url, path])

  useEffect(() => {
    const load = async () => {
      try {
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
        const { videos } = list.content
        setVideos(videos)
      } catch(err) {
        console.error('Loading', err)
      }
    }
    if(nftDID) {
      load()
    }
  }, [nftDID])

  useEffect(() => {
    (async () => {
      if(metadata.startsWith('ceramic:')) {
        const CERAMIC_URL = (
          process.env.CERAMIC_URL
          || 'https://ceramic-clay.3boxlabs.com'
          || 'http://localhost:7007'
        )
        const ceramic = new Ceramic(CERAMIC_URL)
        const tile = await (
          TileDocument.load(ceramic, metadata)
        )
        setInfo(tile.content)
      } else if(metadata.startsWith('ipfs:')) {
        if(/\.json5?/i.test(metadata)) {
          setFromObject(await load(metadata))
        } else {
          setInfo({
            startsAt: new Date(),
            stops: [{ title: 'Title' }],
            source: metadata,
          })
        }
      } else if(metadata !== '') {
        setInfo(await import(`./${metadata}/js`))
      }
    })()
  }, [metadata])

  if(!info) {
    return (
      <Stack align="center" mt={10}>
        <ConnectButton/>
        {!nftDID && (
          <Text>To browse videos published to the Ceramic Network, connect your wallet.</Text>
        )}
        {nftDID && !videos && (
          <Text>
            Searched{' '}
            <ChakraLink
              href={`${desiredChain.explorer}/address/${nftDID.split(/[:_]/)[5]}`}
              isExternal
              title={nftDID}
            >
              {nftDID.slice(0,30)}…{nftDID.slice(-10)}
            </ChakraLink>
          </Text> 
        )}
        <Stack>
          <Flex as="form">
            <Input
              placeholder="Metadata File (ipfs://)"
              value={metaInput}
              onChange={({ target: { value } }) => {
                setMetaInput(value)
              }}
            />
            <Button
              onClick={() => {
                setMetadata(metaInput)
              }}
            >Load</Button>
          </Flex>
          {videos && (
            <Table
              sx={{
                a: { borderBottom: '2px dashed' },
                'a:hover': {
                  borderBottom: '2px solid',
                },
                th: { textAlign: 'center' },
              }}
            >
              <Thead>
                <Tr><Th colSpan={3}>
                  Videos Published To Ceramic
                </Th></Tr>
                <Tr>
                  <Th>Start Time</Th>
                  <Th>Lister</Th>
                  <Th>Video</Th>
                </Tr>
              </Thead>
              <Tbody>
                {videos.map(({
                  id, lister, startsAt, metadata, title,
                }) => (
                  <Tr key={id}>
                    <Td>{isoStringFor(
                      new Date(startsAt)
                    )}</Td>
                    <Td title={lister}>
                      {lister.slice(0, 15)}…{lister.slice(-5)}
                    </Td>
                    <Td>
                      <Link to={metadata}>
                        {title}
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Stack>
        {metadata && !videos && (
          <Stack align="center">
            <Heading size="sm">
              Loading:{' '}
              {metadata.slice(0, 15)}…{metadata.slice(metadata.lastIndexOf('/'))}
            </Heading>
            <Spinner/>
          </Stack>
        )}
        <Button onClick={() => {
          history.push('/new')
        }}>Upload a Video</Button>
        <Button onClick={() => {
          setFromObject({
            video: { startsAt:
              isoStringFor(new Date(), { standard: true })
            },
            isNew: true,
          })
        }}>Track a Recording</Button>
        <Flex
          as="form" direction="column"
          onSubmit={(evt) => {
            evt.preventDefault()
            setFromObject(
              // @ts-ignore
              JSON5.parse(
                ifSet(evt.target.json.value) ?? '{}'
              )
            )
          }}
        >
          <Textarea
            name="json" placeholder="JSON5 Events Description"
            w={600} h={60}
            onKeyPress={(evt) => {
              if(evt.key === 'Enter' && evt.ctrlKey) {
                evt.preventDefault()
                // @ts-ignore
                evt.target.form.submit()
              }
            }}
          ></Textarea>
          <Button type="submit">Load JSON5</Button>
        </Flex>
      </Stack>
    )
  }

  const {
    title, stops, source, startsAt = new Date(), isNew = false
  } = info
  return <MarkedVideo {...{
    title, stops, source, startsAt, isNew, ipfs, IPFSButton,
  }}/>
}