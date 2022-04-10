import { Flex, Box, Spacer } from '@chakra-ui/react'
import { useRef, useMemo } from 'react'
import { isoStringFor } from '../lib/utils'
import Spans from './Spans'

export const Times = ({
  node, startsAt, duration, time, seekTo,
  hovered, setHovered, active, togglePause,
  ...props
}) => {
  const ref = useRef(null)
  const endsAt = useMemo(() => (
    new Date(startsAt.getTime() + duration * 1000)
  ), [startsAt, duration])

  const clicked = (evt) => {
    const rect = ref.current.getBoundingClientRect()
    const y = evt.clientY - rect.top
    const goto = duration * y / ref.current.scrollHeight
    seekTo(goto)
  }

  if (!(endsAt instanceof Date) || !node) {
    return null
  } else {
    const ends = isoStringFor(
      endsAt, { date: false, tz: false },
    )
    const headPosition = (
      ref.current?.scrollHeight * time / duration 
    )

    return (
      <Flex position="relative" {...props}>
        <Flex
          direction="column" key="times"
          onClick={clicked}
          onDoubleClick={togglePause}
          {...{ ref }}
        >
          {
            isoStringFor(startsAt).split('T')
            .map((part, idx) => (
              <TimeBox
                key={idx}
                borderTop={idx === 0 ? '2px dashed' : ''}
              >
                {part}
              </TimeBox>
            ))
          }
          <Box
            position="absolute"
            height={`${headPosition}px`} w="full"
            borderBottom="3px dashed #99999977"
          />
          <Spacer />
          <TimeBox borderBottom="2px dashed">
            {ends}
          </TimeBox>
        </Flex>
        <Flex>
          <Spans
            {...{
              node, active, togglePause,
              hovered, setHovered, seekTo,
            }}
          />
        </Flex>
      </Flex>
    )
  }
}

export const TimeBox = (({ children, ...props }) => (
  <Box
    whiteSpace="pre" textAlign="center"
    lineHeight="1rem" m="0 !important"
    pointerEvents="none"
    px="0.1rem" {...props}
  >
    {children}
  </Box>
))

export default Times