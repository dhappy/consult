import {
  CheckboxGroup, Checkbox, Table, Thead, Tbody, Tr, Th, Td,
  Flex, GridItem, Grid, Tag, Wrap, Spinner, Stack, Heading,
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import VTT from './w/Raid Guild/on/0/♈/15/@/9/13/‒/9/52/vtt.vtt'

const defaultTags = ['pitch', 'pertinent']

const propsFor = (tag) => {
  const props = {
    psych: { bg: '#19FF20' },
    personal: { bg: 'red' },
    skippable: { bg: 'pink' },
    BP: { bg: 'blue', color: 'white' },
    logistics: { bg: 'orange' },
    pertinent: { bg: 'green', color: 'white' },
    pitch: { bg: 'teal', color: 'white' },
    recommendation: { bg: 'purple', color: 'white' },
    chatter: { bg: 'darkgray', color: 'white' },
    tangential: { bg: 'cyan' },
  }
  if(props[tag]) return props[tag]
  return { bg: 'yellow' }
}

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
    `${
      Math.floor(time / 60)
    }:${
      (time % 60).toString().padStart(2, '0')
    }`
  ) : (
    undefined
  )
)

export const Row = ({
  title, index, tags = [], currentTime, end, head, paused = true,
  percent = null, ...props
}) => (
  <Tr
    align="center"
    {...propsFor(tags[0])}
    {...props}
  >
    <Td>{index}</Td>
    <Td
      bg={percent ? (
        `linear-gradient(
          to right,
          red,
          red ${percent}%,
          transparent ${percent + 1}%
        )`
      ) : ('transparent')}
    >
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

export default ({ chapters, title, src }) => {
  const vid = useRef()
  const current = useRef()
  const [active, setActive] = useState(
    Object.fromEntries(
      defaultTags.map(t => [t, true])
    )
  )
  const [time, setTime] = useState(0)
  const clicked = (elem) => {
    const currentClicked = current.current === elem
    if(currentClicked && !vid.current.paused) {
      vid.current.pause()
    } else if(currentClicked && vid.current.paused) {
      vid.current.play()
    } else if(!currentClicked) {
      vid.current.currentTime = elem.start + 0.01 // it misses
      if(vid.current.paused) {
        vid.current.play()
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chapter = params.get('chapter')
    if(chapter) {
      vid.current.currentTime = (
        chapters[Object.keys(chapters)[parseInt(chapter)]].start
      )
    }
  }, [chapters])

  useEffect(() => {
    const video = vid.current
    const update = (evt) => {
      const time = evt.target.currentTime
      setTime(time)
      let now = Object.values(chapters).find(
        (info) => info.start < time && time <= info.end
      )
      if(now && !now.tags.some(t => active[t])) {
        const nxt = Object.values(chapters).find(
          (info) => (
            info.tags.some(t => active[t])
            && info.start >= time
          )
        )
        if(nxt) {
          clicked(nxt)
          now = nxt
        }
      }
      current.current = now
    }
    video.addEventListener('timeupdate', update)
    return () => {
      video.removeEventListener('timeupdate', update)
    }
  }, [active, chapters])

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
        >
          <Flex>
            <Checkbox
              px={8}
              onChange={(evt) => (
                setActive(
                  Object.fromEntries(
                    tags.map((tag) => (
                      [tag, evt.target.checked]
                    ))
                  )
                )
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
                  <Tag key={i} border="2px solid #00000066" {...propsFor(t)}>
                    <Checkbox key={i} isChecked={active[t]} onChange={changed}>
                      {t}
                    </Checkbox>
                  </Tag>
                )
              })}
            </Wrap>
          </Flex>
        </CheckboxGroup>
      </GridItem>
      <GridItem rowSpan={2} colSpan={1}>
        <Table
          maxH="100vh" overflow="scroll"
          sx={{ th: { textAlign: 'center' }}}
        >
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
              let percent = null
              if(current.current === info) {
                percent = 100 * ((time - currentTime) / (end - currentTime)) 
              }
              return (
                <Row
                  key={idx}
                  index={idx}
                  head={time}
                  {...{ src, title, tags, end, currentTime, percent }}
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
          <source {...{ src, type: 'video/mp4' }}/>
          <track default src={VTT}/>
        </video>
      </GridItem>
    </Grid>
  )
}