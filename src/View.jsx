import { useState, useEffect } from 'react'
import Ceramic from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import {
  Heading, Spinner, Stack, UnorderedList, ListItem,
  Flex, Textarea, Button,
} from '@chakra-ui/react'
import { useLocation } from 'react-router'
import { HashLink as Link } from 'react-router-hash-link'
import JSON5 from 'json5'
import MarkedVideo from './MarkedVideo'

export default () => {
  const { pathname: path } = useLocation()
  const metadata = path.replace(/^\/?(.+?)\/?$/, '$1')
  const [info, setInfo] = useState(null)

  const setFromObject = (json) => {
    const { video: { startsAt, source }, stops } = (
      json
    )
    setInfo({
      startsAt: new Date(startsAt), source, stops
    })
  }

  useEffect(() => {
    (async () => {
      if(metadata.startsWith('ceramic:')) {
        const CERAMIC_URL = (
          process.env.CERAMIC_URL
          || 'http://localhost:7007'
          || 'https://ceramic-clay.3boxlabs.com'
        )
        const ceramic = new Ceramic(CERAMIC_URL)
        const tile = await (
          TileDocument.load(ceramic, metadata)
        )
        console.info({ metadata, tile: tile.content })
        setInfo(tile.content)
      } else if(metadata.startsWith('ipfs:')) {
        if(/\.json5?/i.test(metadata)) {
          const regex = /^ipfs:(\/\/)?(([^/]+)\/?(.*))$/i
          const match = metadata.match(regex)
          let http = `//${match[3]}.ipfs.dweb.link/${match[4]}`
          if(!match[3].startsWith('bafy')) {
            http = `//ipfs.io/ipfs/${match[2]}`
          }
          const res = await fetch(http)
          setFromObject(
            await JSON5.parse(await res.text())
          )
        } else {
          setInfo({
            startsAt: new Date(),
            stops: [{ title: 'Title' }],
            source: metadata,
          })
        }
      } else if(metadata !== '/') {
        setInfo(await import(`./${metadata}/js`))
      }
    })()
  }, [metadata])

  if(!info) {
    return (
      <Stack align="center" mt={10}>
        {metadata === '/' ? (
          <UnorderedList
            sx={{
              a: { borderBottom: '2px dashed' },
              'a:hover': { borderBottom: '2px solid' },
            }}
          >
            <ListItem>
              <Link
                to="ipfs://Qmeiz7YmwtVYMRSUG3VdKTxU634JTPaB5j2xLj5RREqAkG/2021⁄10⁄06@09:56:54.MetaGame’s%20Builders’%20Align.x264.mp4"
              >Builders’ Align Video</Link>
            </ListItem>
            <ListItem>
              <Link
                to="ipfs://QmfKwTB5gsAH8JQBU6ygZCzQJrapy6vb1yrD2QVNy3hYyq/Sample Builders’ Align.json5"
              >Builders’ Align w/ Metadata</Link>
            </ListItem>
          </UnorderedList>
        ) : (
          <>
            <Heading size="sm">{metadata}</Heading>
            <Spinner/>
          </>
        )}
        <Flex
          as="form" direction="column"
          onSubmit={(evt) => {
            console.info({ form: evt })
            evt.preventDefault()
            setFromObject(
              // @ts-ignore
              JSON5.parse(evt.target.json.value)
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

  const { title, stops, source, startsAt } = info
  return <MarkedVideo {...{
    title, stops, source, startsAt,
  }}/>
}