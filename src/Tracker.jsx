import { chakra, Box, Flex, Grid, Spacer, Stack } from '@chakra-ui/react'
import React, { useEffect, useRef, useState } from 'react'
import { isoStringFor } from 'utils'

const line = chakra(SVGLineElement)
// const polyline = chakra(SVGPolylineElement)

export default ({ chapters, length, startTime }) => {
  const start = new Date(startTime)
  const numDivisions = 10
  const msDuration = (length ?? 0) * 1000
  const approxMinDuration = Math.round((length ?? 0) / 60)

  const svg = useRef(null)
  const [size, setSize] = useState({ w: 100, h: 100 })
  const [viewBox, setViewBox] = (
    useState(`0 0 ${size.w} ${size.h}`)
  )
  const divisions = (
    [...Array(numDivisions + 1)].map((_, index) => (
      index / numDivisions
    ))
  )
  const times = (
    [...Array(numDivisions)].map((_, index) => {
      const div = index / (numDivisions - 1)
      return (
        new Date(start.getTime() + div * msDuration)
      )
    })
  )

  useEffect(() => {
    const size = {
      w: svg.current.clientWidth,
      h: svg.current.clientHeight,
    }
    setSize(size)
    setViewBox(`0 0 ${size.w} ${size.h}`)
  }, [])


  console.info({ divisions, times, size })

  return (
    <Stack>
      <Grid
        mt={-7} align="left"
        templateColumns={`repeat(${numDivisions}, 1fr)`}
      >
        <Flex>
          <Stack
            transform="translate(0, 6em) rotate(-60deg)"
            transformOrigin="0 0"
            borderBottom="dashed" borderLeft="dashed"
          >
            <Box lineHeight="0.75em">
              {isoStringFor(start, { dateSeparator: '/' }).split('T')[0]}
            </Box>
            <Box mt="0 ! important" lineHeight="0.75em">
              {
                isoStringFor(start, { seconds: false })
                .split('T').slice(1).join('T')
              }
            </Box>
          </Stack>
          <Spacer/>
        </Flex>
        {times.slice(1).map((time, idx) => (
          <Flex key={idx}>
            <Box
              transform="translate(-2em, 6em) rotate(-60deg)"
              transformOrigin="0 0"
              borderBottom="dashed"
            >
              {isoStringFor(time, { seconds: false, tzMinutes: false }).split('T').slice(1).join('T')}
            </Box>
            <Spacer/>
          </Flex>
        ))}
      </Grid>
      <chakra.svg
        {...{ viewBox }} w="full" h={32}
        mt="var(--chakra-space-16) ! important" ref={svg}
      >
        {divisions.map((div) => {
          const x = size.w * div
          return (
            <line
              key={Math.round(100 * div)}
              x1={x} y1={0} x2={x} y2={size.h}
              strokeWidth={3} stroke="black"
              strokeDasharray={[4, 6, 6, 4]}
              fill= "none"
            />
          )
        })}
      </chakra.svg>
      <Grid
        templateColumns={`repeat(${approxMinDuration}, 1fr)`}
        templateRows="1em"
      >
        <Box bg="red"></Box>
        <Box bg="green"></Box>
        <Box bg="blue"></Box>
        <Box bg="orange"></Box>
        <Box bg="cyan"></Box>
        <Box bg="gray"></Box>
        <Box bg="teal"></Box>
        <Box bg="yellow"></Box>
        <Box bg="darkred"></Box>
      </Grid>
    </Stack>
  )
}