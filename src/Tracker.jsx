import { chakra, Box, Flex, Grid, Spacer, Stack } from '@chakra-ui/react'
import React, { useEffect, useRef, useState } from 'react'
import { toISOString } from 'utils'

const line = chakra(SVGLineElement)
const polyline = chakra(SVGPolylineElement)

export default ({ chapters, length, startTime }) => {
  const start = new Date(startTime)
  const numDivisions = 10
  const duration = (length ?? 0) * 1000
  const svg = useRef(null)
  const [size, setSize] = useState({ w: 100, h: 100 })
  const [viewBox, setViewBox] = useState(`0 0 ${size.w} ${size.h}`)
  const divisions = (
    [...Array(numDivisions + 1)].map((_, index) => (
      index / numDivisions
    ))
  )
  const times = (
    [...Array(numDivisions)].map((_, index) => {
      const div = index / (numDivisions - 1)
      return (
        new Date(start.getTime() + div * duration)
      )
    })
  )

  useEffect(() => {
    const size = {
      w: svg.current.clientWidth,
      h: svg.current.clientHeight,
    }
    setSize(size)
    setViewBox(`0 ${-size.h * 0.55} ${size.w} ${size.h * 1.45}`)
  }, [])


  console.info({ divisions, times, size })

  return (
    <Stack>
      <Grid
        mt={-7} align="left"
        templateColumns={`repeat(${numDivisions}, 1fr)`}
      >
        <Stack
          transform="rotate(-60deg)"
          transformOrigin="0 0"
        >
          <Box lineHeight="0.75em">
            {toISOString(start, { dateSeparator: '/' }).split('T')[0]}
          </Box>
          <Box mt="0 ! important" lineHeight="0.75em">
            {toISOString(start, { seconds: false }).split('T').slice(1).join('T')}
          </Box>
        </Stack>
        {times.slice(1).map((time, idx) => (
          <React.Fragment key={idx}>
            <Box
              transform=" translate(-1em, 5em) rotate(-60deg)"
              transformOrigin="0 0"
              borderBottom="dashed"
            >
              {toISOString(time, { seconds: false, tzMinutes: false }).split('T').slice(1).join('T')}
            </Box>
          </React.Fragment>
        ))}
      </Grid>
      <chakra.svg
        {...{ viewBox }} w="full" h={80}
        mt="0 ! important" ref={svg}
      >
        {divisions.map((div) => {
          const x = size.w * div
          const points = [
            [x + 0.3 * size.w / numDivisions, -0.55 * size.h],
            [x, 0],
            [x, size.h],
          ] 
          return (
            <polyline
              key={Math.round(100 * div)}
              points={points.reduce((acc, p) => `${acc} ${p.join(',')}`, '')}
              strokeWidth={3} stroke="black"
              strokeDasharray={[4, 6, 6, 4]}
              fill= "none"
            />
          )
        })}
      </chakra.svg>
    </Stack>
  )
}