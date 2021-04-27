import {
  CheckboxGroup, Checkbox, Table, Thead, Tbody, Tr, Th, Td,
  Flex, GridItem, Grid, Tag, Wrap, Spinner, Stack, Heading,
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import {
  chapters, title,
} from './w/Raid Guild/on/0/♈/15/@/9/13/‒/9/52/js'

const defaultTags = ['pitch', 'pertinent']

const propsFor = (tag) => {
  switch (tag) {
    case 'psych': return { bg: '#19FF20' }
    case 'personal': return { bg: 'red' }
    case 'skippable': return { bg: 'pink' }
    case 'BP': return { bg: 'blue', color: 'white' }
    case 'logistics': return { bg: 'orange' }
    case 'pertinent': return { bg: 'green', color: 'white' }
    case 'pitch': return { bg: 'teal', color: 'white' }
    case 'recommendation': return { bg: 'purple', color: 'white' }
    case 'chatter': return { bg: 'darkgray', color: 'white' }
    case 'tangential': return { bg: 'cyan' }
    default: return { bg: 'yellow' }
  }
}

//const src = 'w/Raid%20Guild/on/0/%E2%99%88/15/@/9/13/%E2%80%92/9/52/mp4'
const src = 'https://ipfs.io/ipfs/QmUx8DdzEh5qxiYJ89a6ZoqD37N3keiTpuYuCDAMfDpjiy/mp4'

export const timeFor = (str) => (
  (str) ? ((() => {
    const [start, ...end] = str.split(':')
    return parseInt(start) * 60 + parseInt(end)
  })()) : (
    undefined
  )
)

export const stringFor = (time) => (
  (time !== undefined) ? (
    `${Math.floor(time / 60)
    }:${(time % 60).toString().padStart(2, '0')
    }`
  ) : (
    undefined
  )
)

export const Row = ({
  title, index, tags = [], currentTime, end, head, paused,
  ...props
}) => (
  <Tr
    align="center"
    {...propsFor(tags[0])}
    {...props}
  >
    <Td>{index}</Td>
    <Td>
      {(() => (
        `${
          stringFor(currentTime)
        }${
          end ? `+${stringFor(end - currentTime)}` : '‒'
        }`
      ))()}
    </Td>
    <Td>{title}</Td>
    <Td><Stack>
      {tags.map((t, i) => (
        <Tag
          key={i}
          style={{ textAlign: 'center' }}
          border="2px solid #00000066"
          {...propsFor(t)}
          display="block"
          pt={0.5}
        >{t}</Tag>
      ))}
    </Stack></Td>
    <Td>{(currentTime < head && head < end && !paused) ? (
      <Spinner/>
    ) : (
      paused ? '▶️' : '⏸️'
    )}</Td>
  </Tr>
)

export default () => {
  const vid = useRef()
  const current = useRef()
  const [active, setActive] = useState(
    Object.fromEntries(
      defaultTags.map(t => [t, true])
    )
  )
  const [time, setTime] = useState(0)
  const clicked = (elem, toggle = true) => {
    vid.current.currentTime = elem.start + 0.01 // it misses
    if(toggle) {
      if(vid.current.paused) {
        vid.current.play()
      } else {
        vid.current.pause()
      }
    }
  }

  useEffect(() => {
    const video = vid.current
    const update = (evt) => {
      const time = evt.target.currentTime
      setTime(time)
      let now = Object.values(chapters).find(
        (info) => info.start < time && time <= info.end
      )
      if(!now.tags.some(t => active[t])) {
        const nxt = Object.values(chapters).find(
          (info) => (
            info.tags.some(t => active[t])
            && info.start >= time
          )
        )
        if(nxt) {
          clicked(nxt, false)
          now = nxt
        }
      }
      current.current = now
    }
    video.addEventListener('timeupdate', update)
    return () => {
      video.removeEventListener('timeupdate', update)
    }
  }, [])

  let tags = (
    Object.values(chapters).map((info) => (
      info.tags
    ))
  )
  tags = [...new Set(tags.flat())]

  return (
    <Grid
      as="form"
      templateRows="0fr 1fr 0fr"
      templateColumns="1fr 0fr"
      maxH="95vh"
    >
      <GridItem rowSpan={1} colSpan={2}>
        <Heading textAlign="center" p={5}>
          {current.current?.name ?? title}
        </Heading>
      </GridItem>
      <GridItem rowSpan={1} colSpan={1}>
        <CheckboxGroup
          colorScheme="green"
          defaultValue={defaultTags}
        >
          <Flex>
            <Checkbox
              px={8}
              onChange={(evt) => (
                setActive((act) => (
                  Object.fromEntries(
                    Object.entries(act).map(
                      ([key, _]) => (
                        [key, evt.target.checked]
                      )
                    )
                  )
                ))
              )}
            />
            <Wrap>
              {tags.map((t, i) => {
                const changed = (evt) => (
                  setActive((ts) => ({
                    ...ts,
                    [t]: evt.target.checked,
                  }))
                )
                return (
                  <Checkbox key={i} checked={active[t]} value={t} onChange={changed}>
                    <Tag border="2px solid #00000066" {...propsFor(t)}>{t}</Tag>
                  </Checkbox>
                )
              })}
            </Wrap>
          </Flex>
        </CheckboxGroup>
      </GridItem>
      <GridItem rowSpan={2} colSpan={1}>
        <Table maxH="100vh" overflow="scroll">
          <Thead>
            <Tr>
              <Th>Index</Th>
              <Th>Time</Th>
              <Th>Name</Th>
              <Th>Tags</Th>
              <Th>Active</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Object.entries(chapters).map(([_, info], idx) => {
              if(!info.tags.some(t => active[t])) {
                return null
              }
              const {
                name: title, tags, end, start: currentTime
              } = info
              return (
                <Row
                  key={idx}
                  index={idx}
                  head={time}
                  {...{ src, title, tags, end, currentTime }}
                  paused={!vid.current || vid.current.paused}
                  onClick={() => clicked(info)}
                />
              )
            })}
          </Tbody>
        </Table>
      </GridItem>
      <GridItem rowSpan={1} colSpan={1}>
        <video
          controls
          style={{ width: '100%' }}
          ref={vid}
        >
          <source {...{ src, type: 'video/mp4' }} />
        </video>
      </GridItem>
    </Grid>
  )
}