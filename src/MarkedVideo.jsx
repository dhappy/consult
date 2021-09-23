import {
  Box, Button, ButtonGroup, Flex, GridItem, Grid, Heading,
  Stack, Spacer, Spinner, Text, chakra,
} from '@chakra-ui/react'
import { useEffect, useRef, useState, useMemo } from 'react'
// import Markdown from 'react-markdown'
import { v4 as uuid } from 'uuid'
import { durationFor, isoStringFor } from 'utils'

const Video = chakra('video')

const colors = [
  'red', 'green', 'purple', 'yellow', 'gold',
  'silver', 'blue', 'cyan', 'orange', 'brown',
  'black', 'white', 'coral', 'gray', 'pink',
  'olive', 'orangered', 'teal',
]

const newNode = (obj = {}) => (
  Object.assign(
    { id: uuid(), children: [] }, obj
  )
)

const getNode = (node) => (
  node.id ? node : newNode(node)
)

const visit = (node, method) => {
  node.children = (node.children ?? []).map((child) => {
    const trans = method.apply(
      node, [{ child, parent: node }]
    )
    visit(child, method)
    return trans
  })
  return node
}

const siblingsOf = (node) => {
  const {
    parent: { children: siblings } = { children: null }
  } = node
  return !node.parent ? [node] : siblings
}

const connectTree = ({ rootStops, duration }) => {
  const parent = ({ child, parent }) => {
    const created = newNode(child)
    created.parent = parent
    return created
  }
  const root = newNode({ children: rootStops })
  const parented = visit(root, parent)

  const fixTimes = ({ parent, child }) => {
    if (typeof child.duration === 'string') {
      child.durationStr = child.duration
      const dur = durationFor(child.duration)
      dur.duration *= 1000 // originally seconds
      Object.assign(child, dur)
    }

    const offNodes = [child]
    while(offNodes[0].startOffset == null) {
      const [node] = offNodes
      const siblings = siblingsOf(node)
      node.startOffset = (
        siblings.sort((a, b) => (
          (a.startOffset + a.duration)
          - (b.startOffset + b.duration)
        ))
        .find((sibling) => (
          (sibling.startOffset + sibling.duration)
          < (parent.startOffset + parent.duration)
        ))
        ?.startOffset
      )
      if (node.startOffset == null && !node.parent) {
        node.startOffset = 0
      } else {
        offNodes.unshift(node.parent)
      }
    }
    offNodes.slice(1).forEach((node) => {
      node.startOffset = offNodes[0].startOffset
    })

    const durNodes = [child]
    while(durNodes[0].duration == null) {
      const [node] = durNodes
      const siblings = siblingsOf(node)
      const next = siblings.find((sibling) => (
        sibling.startOffset > node.startOffset
      ))
      if (next) {
        node.duration = (
          next.startOffset - node.startOffset
        )
      } else if (!node.parent) {
        node.duration = duration
        break
      } else {
        durNodes.unshift(node.parent)
      }
    }
    durNodes.slice(1).forEach((node) => {
      node.duration = durNodes[0].duration
    })

    if (child.startOffset == null) {
      console.warn(`No Starting Time`, { parent })
    }
    if (child.duration == null) {
      console.warn(`No Event Duration`, { parent })
    }

    return child
  }

  return visit(parented, fixTimes)
}

const Spans = ({ node, duration, count = 1 }) => {
  if (!node) return null

  const {
    id = null, children, startOffset,
    duration: dur, ...rest
  } = node

  if (Object.keys(rest).length === 0) {
    return (
      node.children.map((child, idx) => (
        <Spans
          {...{ duration }}
          key={idx}
          node={child}
          count={count + idx + 1}
        />
      ))
    )
  }
  const timePercent = 100 * node.startOffset / duration
  const heightPercent = 100 * node.duration / duration
  return (
    <Flex
      top={`${timePercent}%`}
      height={`${heightPercent}%`}
      bg={colors[count % colors.length]}
      px={3} opacity={0.5}
      sx={{ '&:hover': { opacity: 1 } }}
    >
      {node.children.map((child, idx) => (
        <Spans
          key={idx}
          node={child}
          count={count + idx + 1}
        />
      ))}
    </Flex>
  )
}

const TimeBox = (({ children, ...props }) => (
  <Box
    whiteSpace="pre" textAlign="center"
    lineHeight="1rem" m="0 !important"
    px="0.1rem" {...props}
  >
    {children}
  </Box>
))

const Times = ({ node, startsAt, endsAt, ...props }) => {
  if (!(endsAt instanceof Date) || isNaN(endsAt) || !node) {
    return null
  } else {
    const [, endTime] = isoStringFor(endsAt).split('T')
    const ends = endTime.replace(
      /^((\d\d)(:(\d\d)){2}).*$/, '$1'
    )

    return (
      <Flex {...props}>
        <Stack key="times">
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
          <Spacer />
          <TimeBox borderBottom="2px dashed">
            {ends}
          </TimeBox>
        </Stack>
        <Flex>
          <Spans {...{ node }} />
        </Flex>
      </Flex>
    )
  }
}

const Events = ({
  node = {}, insertChild, duration, count = 1, ...props
}) => {
  if (!node) return null

  const addChild = (child) => {
    insertChild(
      { parent: child, insert: { type: 'new' } }
    )
  }
  const addSibling = (sibling) => {
    const self = { ...sibling }
    self.children = [...sibling.children, { type: 'new' }]
    const insert = ({ child }) => (
      child.id === self.id ? self : child
    )
    visit(node, insert)
  }

  const {
    id = null, children, startOffset, duration: dur, ...rest
  } = node

  if (Object.keys(rest).length === 0) {
    return (
      node.children.map((child, idx) => (
        <Events
          {...{ duration, insertChild }}
          key={idx}
          node={child}
          count={count + idx + 1}
        />
      ))
    )
  }
  const timePercent = 100 * node.startOffset / duration
  const heightPercent = 100 * node.duration / duration
  return (
    <Stack
      top={`${timePercent}%`}
      minH={`${heightPercent}%`}
      bg={colors[count % colors.length]}
      px={3} opacity={0.5}
      sx={{ '&:hover': { opacity: 1 } }}
      w="full" {...props}
      className="events"
    >
      <Flex>
        <Heading
          textTransform="capitalize" fontSize={32}
          color="white" pt={3}
        >
          {node.type}
        </Heading>
        <Spacer />
        <ButtonGroup>
          <Button
            title="Create A New Sibling"
            onClick={() => addSibling(node)}
          >➕ »</Button>
          <Button
            title="Create A New Child"
            onClick={() => addChild(node)}
          >➕ ⇓</Button>
        </ButtonGroup>
      </Flex>
      <chakra.hr color="white" />
      {node.children?.map((child, idx) => (
        <Events
          {...{ duration, insertChild }}
          key={idx}
          node={child}
          count={count + idx + 1}
        />
      ))}
    </Stack>
  )
}

export default ({
  stops: rawStops = [], source, startsAt = new Date()
}) => {
  const src = useMemo(() => {
    const regex = /^ipfs:(\/\/)?(.+)$/i
    const match = source.match(regex)
    if (match) {
      return `//ipfs.io/ipfs/${match[2]}`
    }
    return source
  }, [source])
  const [duration, setDuration] = useState(null)
  const vid = useRef()
  const info = useRef()
  const [time, setTime] = useState(0)
  const endsAt = useMemo(() => (
    new Date(startsAt.getTime() + duration)
  ), [startsAt, duration])

  const [allStops, setAllStops] = useState()
  const [stops, baseSetStops] = useState()
  const setStops = (rootOrFunc) => {
    let root = rootOrFunc
    if (root instanceof Function) {
      baseSetStops((stops) => (
        root = root(stops)
      ))
    } else {
      baseSetStops(root)
    }

    const children = ({ node }) => (
      node.children.map((child) => (
        [child, children({ node: child })]
      ))
    )
    setAllStops(
      [root, children({ node: root })].flat(Infinity)
    )
  }

  useEffect(() => {
    setStops(
      connectTree({ rootStops: rawStops, duration })
    )
  }, [duration, rawStops])

  const insertChild = ({ parent, insert }) => {
    const self = { ...parent }
    self.children = [...parent.children, newNode(insert)]
    const insertion = ({ child }) => (
      child.id === self.id ? self : child
    )
    setStops((stops) => {
      return visit(stops, insertion)
    })
  }

  const seekTo = (time) => {
    vid.current.currentTime = time
  }

  const clicked = (elem) => {
    const currentClicked = info.current === elem
    if (currentClicked && !vid.current.paused) {
      vid.current.pause()
    } else if (currentClicked && vid.current.paused) {
      vid.current.play()
    } else if (!currentClicked) {
      vid.current.currentTime = elem.start + 0.01 // it misses
      if (vid.current.paused) {
        vid.current.play()
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chapterIdx = params.get('chapter')
    if (chapterIdx) {
      seekTo(
        // chapters[parseInt(chapterIdx)].start
      )
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const video = vid.current
    const update = (evt) => {
      const time = evt.target.currentTime
      setTime(time)
    }
    video.addEventListener('timeupdate', update)
    return () => {
      video.removeEventListener('timeupdate', update)
    }
  }, [setTime])

  useEffect(() => {
    const video = vid.current
    const set = () => setDuration(video.duration * 1000)
    video.addEventListener('loadedmetadata', set)
    return () => {
      video.removeEventListener('loadedmetadata', set)
    }
  }, [])

  return (
    <Grid
      as="form"
      templateRows="1fr 0fr"
      templateColumns="0fr 1fr"
      maxH="100vh"
    >
      {!stops ? (
        <GridItem id="spinner" rowSpan={1} colSpan={2}>
          <Spinner />
        </GridItem>
      ) : (
        <>
          <GridItem id="spans" rowSpan={1} colSpan={1}>
            <Times
              {...{ startsAt, endsAt, duration }}
              node={stops}
              h="calc(100vh - max(10vh, 3.5em))"
            />
          </GridItem>
          <GridItem id="events" rowSpan={1} colSpan={1}>
            <Events
              {...{ insertChild, duration }}
              node={stops}
            />
          </GridItem>
        </>
      )}
      <GridItem
        id="video"
        rowSpan={1} colSpan={2}
        maxH="max(10vh, 3.5em)"
      >
        <Video
          w="100%" maxH="100%" controls
          ref={vid}
        >
          <source {...{ src, type: 'video/mp4' }} />
          {/* {VTT && <track default src={VTT}/>} */}
        </Video>
      </GridItem>
    </Grid>
  )
}