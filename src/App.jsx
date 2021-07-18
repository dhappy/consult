import { Spinner } from '@chakra-ui/react'
import loadable from '@loadable/component'
import ChapteredVideo from 'ChapteredVideo'

const Metadata = loadable.lib(() => import(
  './w/MetaGame’s Builders/on/-3/♋/7/@/1/26/‒/1/78/js'
))

export default () => (
  <Metadata fallback={<Spinner/>}>
    {({ chapters, title, url: src }) => (
      <ChapteredVideo {...{ chapters, title, src }}/>
    )}
  </Metadata>
)