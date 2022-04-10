// @ts-check

import { Flex, Box, Image } from '@chakra-ui/react'
import { isoStringFor, isSet, stringFor } from '../lib/utils'
import PlayButton from '../images/play.svg'
import PauseButton from '../images/pause.svg'

export const DateTime = ({
  startsAt, time, video, togglePause,
}) => {
  const current = (
    new Date(startsAt.getTime() + time * 1000)
  )
  const opts = { date: false, tz: false }
  const playing = (
    isSet(video.current?.paused) ? (
      !video.current.paused
    ) : (
      false
    )
  )
  return (
    <Flex
      direction="column" lineHeight={1}
      align="center" justify="center"
      position="relative"
      onClick={togglePause}
    >
      <Image
        position="absolute"
        top={0} left={0}
        w="100%" h="calc(100%)"
        p={2} zIndex={3} opacity={0.65}
        src={
          playing ? PauseButton : PlayButton
        }
      />
      <Box>{isoStringFor(current, opts)}</Box>
      <Box>
        +{stringFor(time, { milliseconds: false })}
      </Box>
    </Flex>
  )
}

export default DateTime