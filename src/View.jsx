import { useState } from 'react'
import { Flex, Heading, Spinner, Stack } from '@chakra-ui/react'
import { useLocation } from 'react-router'
import ChapteredVideo from 'ChapteredVideo'
import { useEffect } from 'react'

export default () => {
  const { pathname: source } = useLocation()
  const [info, setInfo] = useState(null)

  useEffect(() => {
    (async () => {
      const relSource = source.replace(/^\/?(.+?)\/?$/, '$1')
      setInfo(await import(`./${relSource}/js`))
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

  const { title, stops, url: src } = info
  return <ChapteredVideo {...{ title, stops, src }}/>
}