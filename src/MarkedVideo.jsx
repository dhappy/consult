import {
  Box, Button, ButtonGroup, Flex, GridItem, Grid, Heading,
  Stack, Spacer, Spinner, chakra,
} from '@chakra-ui/react'
import {
  useEffect, useRef, useState, useMemo, useCallback,
} from 'react'
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

const visit = ({ node, method }) => {
  const children = node?.children ?? []
  node.children = method.apply(
    node, [{ children, parent: node, visit }]
  )
  return node
}

const siblingsOf = (node) => {
  const {
    parent: { children: siblings } = { children: null }
  } = node
  return !node.parent ? [node] : siblings
}

const connectTree = ({ stops }) => {
  const parent = ({ children = [], parent: rent, visit }) => {
    children = children.map((child) => {
      child = visit({ node: newNode(child), method: parent })
      child.parent = rent
      return child
    })
    console.info({ children })
    return children
  }
  let root = stops
  if(Array.isArray(root)) {
    root = newNode({ children: stops })
  }
  console.info({ connect: root })
  return visit({ node: newNode(root), method: parent })
}

const fixTimes = ({ root, duration }) => {
  const fix = ({ parent, children, visit }) => (
    children.map((child) => {
      visit({ node: child, method: fix })

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
    })
  )

  return visit({ node: root, method: fix })
}

const Spans = ({ node, duration, count = 1 }) => {
  if (!node) return null

  const {
    id, children = [], startOffset,
    duration: dur, ...rest
  } = node

  if (Object.keys(rest).length === 0) {
    return (
      children.map((child, idx) => (
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
      position="relative"
      _before={{
        content: '""', zIndex: -1,
        position: 'absolute', opacity: 0.5,
        top: 0, left: 0, bottom: 0, right: 0,
        bg: colors[count % colors.length],
      }}
      pl={3} pr={1} w="full"
      sx={{ '&:hover::before': { opacity: 1 }}}
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
  node = {}, insertChild, removeNode, duration, count = 1,
  ...props
}) => {
  if (!node) return null

  const addChild = (parent) => {
    insertChild(
      { parent, insert: { type: 'new' } }
    )
  }
  const addSibling = (sibling) => {
    insertChild(
      {
        parent: sibling.parent,
        insert: { type: 'new' },
      }
    )
  }

  const {
    id, children = [], startOffset,
    duration: dur, ...rest
  } = node

  if (Object.keys(rest).length === 0) {
    return (
      children.map((child, idx) => {
        return (
        <Events
          {...{ duration, insertChild, removeNode }}
          key={idx}
          node={child}
          count={count + idx}
        />
        )
      })
    )
  }

  const timePercent = 100 * startOffset / duration
  const heightPercent = 100 * dur / duration
  
  return (
    <Stack
      top={`${timePercent}%`}
      minH={`${heightPercent}%`}
      position="relative"
      _before={{
        content: '""', zIndex: -1,
        position: 'absolute', opacity: 0.5,
        top: 0, left: 0, bottom: 0, right: 0,
        bg: colors[count % colors.length],
      }}
      px={3} w="full"
      sx={{ '&:hover::before': { opacity: 1 }}}
      {...props}
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
          {console.info({ node, count })}
          <Button
            title="Create A New Sibling"
            onClick={() => addSibling(node)}
          >➕ »</Button>
          <Button
            title="Create A New Child"
            onClick={() => addChild(node)}
          >➕ ⇓</Button>
          <Button
            title="Remove Node"
            onClick={() => removeNode(node)}
          >➖</Button>
        </ButtonGroup>
      </Flex>
      <chakra.hr color="white" />
      {node.children?.map((child, idx) => (
        <Events
          {...{ duration, insertChild, removeNode }}
          key={idx}
          node={child}
          count={count + idx + 1}
        />
      ))}
    </Stack>
  )
}

const findById = (root, id) => {
  if(root.id === id) {
    return root
  }
  for(const child of root.children) {
    const result = findById(child, id)
    if(result) {
      return result
    }
  }
}

export default ({
  stops: rootStops = [], source, startsAt = new Date()
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
  const [/*time*/, setTime] = useState(0)
  const [raw, setRaw] = useState(
    connectTree({ stops: rootStops })
  )
  const endsAt = useMemo(() => (
    new Date(startsAt.getTime() + duration)
  ), [startsAt, duration])
  const [stops, setStops] = useState()

  useEffect(() => {
    setStops(
      fixTimes({ root: connectTree({ stops: raw }), duration })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, raw])

  console.info({ stops, duration, raw })

  const insertChild = ({ parent, insert }) => {
    const rawParent = findById(raw, parent.id)
    console.info({ parent, rawParent, insert })
    const self = { ...rawParent }
    self.children = [...rawParent.children, newNode(insert)]
    const insertion = ({ children, visit }) => (
      children.map((child) => {
        visit({ node: child, method: insertion })
        return child.id === self.id ? self : child
      })
    )
    setRaw((raw) => {
      const root = connectTree({ stops: raw })
      const altered = visit({ node: root, method: insertion })
      console.info({ altered, stops })
      return altered
    })
  }

  const removeNode = (node) => {
    setRaw((raw) => {
      const clone = connectTree({ stops: raw })
      const rawNode = findById(clone, node.id)
      const children = rawNode.parent.children
      const index = children.findIndex(
        (child) => child.id === node.id
      )
      children.splice(index, 1)
      return clone
    })
  }

  const seekTo = (time) => {
    vid.current.currentTime = time
  }

  /*
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
  */

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
              {...{ insertChild, duration, removeNode }}
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