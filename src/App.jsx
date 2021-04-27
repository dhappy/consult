import {
  Box, CheckboxGroup, Checkbox, Table, Thead, Tbody, Tr, Th, Td,
  chakra, Flex, GridItem, Grid, Tag, Text, Wrap, Spinner,
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { chapters } from './w/Raid Guild/on/0/♈/15/@/9/13/‒/9/52/js'

const defaultTags = ['pitch', 'pertinent']

const propsFor = (tag) => {
  switch (tag) {
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
  (time) ? (
    `${Math.floor(time / 60)
    }:${(time % 60).toString().padStart(2, '0')
    }`
  ) : (
    undefined
  )
)

export const Row = ({
  title, index, tags = [], currentTime, end, head, ...props
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
    <Td><Flex>
      {tags.map((t, i) => (
        <Tag
          key={i}
          border="2px solid #00000066"
          {...propsFor(t)}
        >{t}</Tag>
      ))}
    </Flex></Td>
    <Td>{(currentTime < head && head < end) ? (
      <Spinner/>
    ) : (
      '▸'
    )}</Td>
  </Tr>
)

export default () => {
  const vid = useRef()
  const [active, setActive] = useState(
    Object.fromEntries(
      defaultTags.map(t => [t, true])
    )
  )
  const [selected, setSelected] = useState()
  const [time, setTime] = useState(0)

  useEffect(() => {
    const video = vid.current
    const update = (evt) => {
      setTime(evt.target.currentTime)
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

  const changed = (evt) => {
    console.info(evt)
  }
  const clicked = (elem) => {
    setSelected(elem)
    vid.current.currentTime = elem.start
    vid.current.play()
  }

  return (
    <Grid
      as="form"
      onChange={changed}
      templateRows="1fr 0fr"
      templateColumns="1fr 0fr"
      maxH="95vh"
    >
      <GridItem rowSpan={1} colSpan={1}>
        <CheckboxGroup
          colorScheme="green"
          defaultValue={defaultTags}
        >
          <Wrap>
            {/* ToDo: Add select all / none */}
            {/*
            <ListItem>
              <Checkbox onChange((evt) => (evt.target.checked)/>
            </ListItem>
            */}
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
              if (!info.tags.some(t => active[t])) {
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
          onClick={selected}
        >
          <source {...{ src, type: 'video/mp4' }} />
        </video>
      </GridItem>
    </Grid>
  )
}