import { useState } from 'react'
import Ceramic from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { Heading, Spinner, Stack } from '@chakra-ui/react'
import { useLocation } from 'react-router'
import ChapteredVideo from 'ChapteredVideo'
import { useEffect } from 'react'

export default () => {
  const { pathname: path } = useLocation()
  const source = path.replace(/^\/?(.+?)\/?$/, '$1')
  const [info, setInfo] = useState(null)

  useEffect(() => {
    (async () => {
      if(source.startsWith('ceramic://')) {
        const CERAMIC_URL = (
          process.env.CERAMIC_URL
          || 'http://localhost:7007'
          || 'https://ceramic-clay.3boxlabs.com'
        )
        const ceramic = new Ceramic(CERAMIC_URL)
        const tile = await (
          TileDocument.load(ceramic, source)
        )
        console.info({ source, tile: tile.content })
        setInfo(tile.content)
      } else {
        setInfo(await import(`./${source}/js`))
      }
    })()
  }, [source])

  if(!info) {
    return (
      <Stack align="center" mt={10}>
        <Heading size="sm">{source}</Heading>
        <Spinner/>
      </Stack>
    )
  }

  console.info({ info })
  const { title, stops, source: src, startTime } = info
  return <ChapteredVideo {...{
    title, stops, src, startTime,
  }}/>
}