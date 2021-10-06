import { useState } from 'react'
import Ceramic from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { Heading, Spinner, Stack } from '@chakra-ui/react'
import { useLocation } from 'react-router'
import MarkedVideo from 'MarkedVideo'
import { useEffect } from 'react'

export default () => {
  const { pathname: path } = useLocation()
  const metadata = path.replace(/^\/?(.+?)\/?$/, '$1')
  const [info, setInfo] = useState(null)

  useEffect(() => {
    (async () => {
      if(metadata.startsWith('ceramic://')) {
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
      } else if(metadata.startsWith('ipfs://')) {
        setInfo({
          startsAt: new Date(),
          stops: [{
            title: 'Title',
          }],
          source: metadata,
        })
      } else {
        const ret = await import(`./${metadata}/js`)
        setInfo(ret)
      }
    })()
  }, [metadata])

  if(!info) {
    return (
      <Stack align="center" mt={10}>
        <Heading size="sm">{metadata}</Heading>
        <Spinner/>
      </Stack>
    )
  }

  const { title, stops, source, startsAt } = info
  return <MarkedVideo {...{
    title, stops, source, startsAt,
  }}/>
}