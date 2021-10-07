import { useState, useEffect } from 'react'
import Ceramic from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import {
  Heading, Spinner, Stack, UnorderedList, ListItem,
} from '@chakra-ui/react'
import { useLocation } from 'react-router'
import MarkedVideo from 'MarkedVideo'
import { HashLink as Link } from 'react-router-hash-link'

export default () => {
  const { pathname: path } = useLocation()
  const metadata = path.replace(/^\/?(.+?)\/?$/, '$1')
  const [info, setInfo] = useState(null)

  useEffect(() => {
    console.info({ metadata });
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
        if(metadata.endsWith('.mp4')) {
          setInfo({
            startsAt: new Date(),
            stops: [{
              title: 'Title',
            }],
            source: metadata,
          })
        } else if(metadata.endsWith('.json')) {
          const regex = /^ipfs:(\/\/)?(.+)$/i
          const match = metadata.match(regex)
          const http = `//ipfs.io/ipfs/${match[2]}`
          const res = await fetch(http)
          const { video: { startsAt, source }, stops } = (
            await res.json()
          )
          setInfo({
            startsAt: new Date(startsAt), source, stops
          })
        }
      } else if(metadata !== '/') {
        setInfo(await import(`./${metadata}/js`))
      } else {
        console.warn('No files to load…')
      }
    })()
  }, [metadata])

  if(!info) {
    return (
      <Stack align="center" mt={10}>
        {metadata === '/' ? (
          <UnorderedList>
            <ListItem>
              <Link
                to="ipfs://Qmeiz7YmwtVYMRSUG3VdKTxU634JTPaB5j2xLj5RREqAkG/2021⁄10⁄06@09:56:54.MetaGame’s%20Builders’%20Align.x264.mp4"
              >Builders’ Align Video</Link>
            </ListItem>
            <ListItem>
              <Link
                to="ipfs://QmUzL5e62bahB7xP6P2jv235VQkVCUKJS6guVWL1SEnU5X/Sample%20Builders’%20Align.json"
              >Builders’ Align Metadata</Link>
            </ListItem>
          </UnorderedList>
        ) : (
          <>
            <Heading size="sm">{metadata}</Heading>
            <Spinner/>
          </>
        )}
      </Stack>
    )
  }

  const { title, stops, source, startsAt } = info
  return <MarkedVideo {...{
    title, stops, source, startsAt,
  }}/>
}