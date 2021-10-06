import {
  Box, Button, ButtonGroup, Flex, GridItem, Grid, Heading,
  Stack, Spacer, Spinner, chakra,
} from '@chakra-ui/react'
import {
  useEffect, useRef, useState, useMemo,
} from 'react'
// import Markdown from 'react-markdown'
import { v4 as uuid } from 'uuid'
import { HashLink as Link } from 'react-router-hash-link'
import { durationFor, isoStringFor } from 'utils'

const Video = chakra('video')

const colors = [
  'red', 'green', 'purple', 'yellow',
  'silver', 'blue', 'cyan', 'orange', 'brown',
  'black', 'white', 'coral', 'gray', 'pink',
  'olive', 'orangered', 'teal', 'gold',
]

const colorIds = []
const colorFor = (id) => {
  let index = colorIds.indexOf(id)
  if(index < 0) {
    colorIds.push(id)
    index = colorIds.length - 1
  }
  return colors[index % colors.length]
}

const newNode = (obj = {}) => (
  Object.assign(
    { id: uuid(), children: [], partition: false },
    obj,
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
    return children
  }
  let root = stops
  if(Array.isArray(root)) {
    root = newNode({ children: stops })
  }
  return visit({ node: newNode(root), method: parent })
}

const clone = (stops) => connectTree({ stops })

const fixTimes = ({ root, duration }) => {
  const fix = ({ parent, children, visit }) => (
    children.map((child) => {
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
          siblings
          .find((sibling) => (
            (sibling.startOffset + sibling.duration)
            < (parent.startOffset + parent.duration)
          ))
          ?.startOffset
        )
        if(node.startOffset == null) {
          if(!node.parent) {
            node.startOffset = 0
          } else {
            offNodes.unshift(node.parent)
          }
        } else {
          break
        }
      }
      offNodes.slice(1).forEach((node) => {
        if(!node.parent.partition) {
          node.startOffset = offNodes[0].startOffset
        }
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
        if(!node.parent.partition) {
          node.duration = durNodes[0].duration
        }
      })

      if(parent.partition) {
        let startIdx = 0
        while(
          startIdx < children.length
          && children[startIdx].duration != null
          && children[startIdx].startOffset != null
        ) {
          startIdx++
        }
        let endIdx = startIdx
        while(
          endIdx < children.length
          && children[endIdx].duration == null
          && children[endIdx].startOffset == null
        ) {
          endIdx++
        }
        const span = endIdx - startIdx
        if(span > 0) {
          const start = (
            (startIdx === 0) ? (
              child.parent.startOffset
            ) : (
              children[startIdx].startOffset
              + children[startIdx].duration
            )
          )
          const dur = (
            (endIdx === children.length) ? (
              child.parent.duration
            ) : (
              children[endIdx].startOffset
              + children[endIdx].duration
            )
            - start
          )
          const durPer = dur / span

          for(let i = startIdx; i < endIdx; i++) {
            children[i].duration = durPer
            children[i].startOffset = (
              (children[i - 1]?.startOffset ?? -durPer) + durPer
            )
          }
        }
      }
  

      if (child.startOffset == null) {
        console.warn(`No Starting Time`, { parent })
      }
      if (child.duration == null) {
        console.warn(`No Event Duration`, { parent })
      }

      visit({ node: child, method: fix })

      return child
    })
  )

  root = clone(root)
  visit({ node: root, method: fix })
  return root
}

const Spans = ({ node, count = 1, hovered, setHovered }) => {
  if (!node) return null

  const mouseOver = (node) => {
    const ids = []
    while(node) {
      ids.push(node.id)
      node = node.parent
    }
    setHovered(ids)
  }
  const mouseOut = (node) => {
    setHovered((ids) => {
      const dup = [...ids]
      dup.splice(ids.indexOf(node.id), 1)
      return dup
    })
  }

  const {
    id, children = [], startOffset,
    duration, partition, ...rest
  } = node

  if (Object.keys(rest).length === 0) {
    return (
      children.map((child, idx) => (
        <Spans
          {...{ duration, hovered, setHovered }}
          key={idx}
          node={child}
          count={count + idx + 1}
        />
      ))
    )
  }

  const timePercent = 0 //100 * startOffset / duration
  const heightPercent = 100 * duration / node.parent.duration
  let className = 'span'
  if(hovered.includes(node.id)) {
    className += ' hovered'
  }

  return (
    <Flex
      top={`${timePercent}%`}
      height={`${heightPercent}%`}
      position="relative"
      _before={{
        content: '""', zIndex: -1,
        position: 'absolute', opacity: 0.5,
        top: 0, left: 0, bottom: 0, right: 0,
        bg: colorFor(node.id),
      }}
      pl={3} pr={1} w="full" {...{ className }}
      sx={{
        '&.hovered::before': { opacity: 1 }
      }}
      direction={node.partition ? 'column' : 'row'}
      onMouseEnter={() => mouseOver(node)}
      onMouseLeave={() => mouseOut(node)}
    >
      {node.children.map((child, idx) => (
        <Link to={`#${child.id}`} style={{ display: 'contents' }}>
          <Spans
            {...{ duration, hovered, setHovered }}
            key={idx}
            node={child}
            count={count + idx + 1}
          />
        </Link>
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

const Times = ({
  node, startsAt, duration, hovered, setHovered, ...props
}) => {
  const endsAt = useMemo(() => (
    new Date(startsAt.getTime() + duration)
  ), [startsAt, duration])

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
          <Spans {...{ node, hovered, setHovered }} />
        </Flex>
      </Flex>
    )
  }
}

const Events = ({
  node = {}, insertChild, replaceNode, insertParent,
  duration, count = 1, hovered, setHovered, ...props
}) => {
  if (!node) return null

  const addChild = (parent) => {
    insertChild(
      { parent, insert: { type: 'new' } }
    )
  }
  const addPartition = (sibling) => {
    const { parent } = sibling
    if(!parent.partition) {
      insertParent({
        child: sibling,
        insert: { partition: true },
        siblings: [newNode({ type: 'part' })]
      })
    } else {
      insertChild({
        parent, insert: { type: 'new' }
      })
    }
  }
  const addParallel = (sibling) => {
    let { parent } = sibling
    while(parent.partition && parent.parent) {
      parent = parent.parent
    }
    insertChild({
      parent, insert: { type: 'para' }
    })
  }
  const removeNode = (node) => {
    replaceNode({ node })
  }

  const mouseOver = (node) => {
    const ids = []
    while(node) {
      ids.push(node.id)
      node = node.parent
    } 
    setHovered(ids)
  }
  const mouseOut = (node) => {
    setHovered((ids) => {
      const dup = [...ids]
      dup.splice(ids.indexOf(node.id), 1)
      return dup
    })
  }

  const {
    id, children = [], startOffset,
    duration: dur, partition, ...rest
  } = node

  if (Object.keys(rest).length === 0) {
    return (
      children.map((child, idx) => {
        return (
        <Events
          {...{
            duration, insertChild,
            insertParent, replaceNode,
            hovered, setHovered,
          }}
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
  let className = 'event'
  if(hovered.includes(node.id)) {
    className += ' hovered'
  }

  return (
    <Stack
      id={node.id}
      top={`${timePercent}%`}
      minH={`${heightPercent}%`}
      position="relative"
      _before={{
        content: '""', zIndex: -1,
        position: 'absolute', opacity: 0.5,
        top: 0, left: 0, bottom: 0, right: 0,
        bg: colorFor(node.id),
      }}
      px={3} w="full"
      sx={{
        '&.hovered::before': { opacity: 1 }
      }}
      onMouseEnter={() => mouseOver(node)}
      onMouseLeave={() => mouseOut(node)}
      {...props} {...{ className }}
    >
      {node.type && (
        <>
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
                title="Create A Child"
                onClick={() => addChild(node)}
                fontWeight="normal"
              >█ → 🬠</Button>
              <Button
                title="Create A Partition Sibling"
                onClick={() => addPartition(node)}
                fontWeight="normal"
              >█ → 🮒</Button>
              <Button
                title="Create A Parallel Sibling"
                onClick={() => addParallel(node)}
                fontWeight="normal"
              >█ → 🮔</Button>
              <Button
                title="Remove Node"
                onClick={() => removeNode(node)}
              >➖</Button>
            </ButtonGroup>
          </Flex>
          <chakra.hr color="white" />
        </>
      )}
      {node.children?.map((child, idx) => (
        <Events
          {...{
            duration, insertChild,
            insertParent, replaceNode,
            hovered, setHovered,
          }}
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
  const [stops, setStops] = useState()
  const [hovered, setHovered] = useState([])

  useEffect(() => {
    setStops(
      fixTimes({ root: raw, duration })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, raw])

  const insertChild = ({ parent, insert }) => {
    const rawParent = findById(raw, parent.id)
    const self = { ...rawParent }
    insert = newNode(insert)
    insert.parent = self
    self.children = [...rawParent.children, insert]
    const insertion = ({ children, visit }) => (
      children.map((child) => {
        visit({ node: child, method: insertion })
        return child.id === self.id ? self : child
      })
    )
    setRaw((raw) => {
      const root = connectTree({ stops: raw })
      const altered = visit({ node: root, method: insertion })
      return altered
    })
  }

  const insertParent = ({ child, insert, siblings = [] }) => {
    const rawChild = findById(raw, child.id)
    insert.children = [rawChild, ...siblings]
    replaceNode({
      node: rawChild,
      replacement: newNode(insert),
    })
    return insert
  }

  const replaceNode = ({ node, replacement = null }) => {
    setRaw((raw) => {
      const dup = clone(raw)
      const rawNode = findById(dup, node.id)

      if(!rawNode) {
        throw new Error(`Couldn't find node with id: ${node.id}`)
      }

      const { parent } = rawNode
      const { children } = parent
      const index = children.findIndex(
        (child) => child.id === node.id
      )
      if(!replacement) {
        children.splice(index, 1)
      } else {
        replacement.parent = parent
        parent.children = [
          ...children.slice(0, index),
          replacement,
          ...children.slice(index + 1),
        ]
      }
      return dup
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
    const update = ({ target: { currentTime: time }}) => {
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
              {...{
                startsAt, duration,
                hovered, setHovered,
              }}
              node={stops}
              h="calc(100vh - max(10vh, 3.5em))"
            />
          </GridItem>
          <GridItem
            id="events" rowSpan={1} colSpan={1}
            overflowY="scroll"
          >
            <Events
              {...{
                insertChild, insertParent,
                duration, replaceNode,
                hovered, setHovered,
              }}
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