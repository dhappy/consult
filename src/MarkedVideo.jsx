import {
  Box, Button, ButtonGroup, Flex, GridItem, Grid, Heading,
  Stack, Spacer, Spinner, chakra, useDisclosure, Input,
  ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalCloseButton, ModalBody, FormControl, FormLabel,
  Modal, Text, Textarea, Divider,
  Tabs, TabList, TabPanels, Tab, TabPanel,
} from '@chakra-ui/react'
import {
  useEffect, useRef, useState, useMemo,
} from 'react'
import Markdown from 'react-markdown'
import { v4 as uuid } from 'uuid'
import { HashLink as Link } from 'react-router-hash-link'
import {
  durationFor, isoStringFor, stringFor, timeFor, isSet, ifSet,
} from 'utils'

const DEFAULT_DURATION = Math.pow(60, 3)
const DEFAULT_VID_HEIGHT = 85

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

const connect = ({ stops }) => {
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
    root = { children: root }
  }
  return visit({ node: newNode(root), method: parent })
}

const clone = (stops) => connect({ stops })

const generate = ({ root, duration, raw }) => {
  const fix = ({ parent, children, visit }) => (
    children.map((child) => {
      child.raw = findById(raw, child.id)
      child.root = raw

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
          node.duration = duration ?? DEFAULT_DURATION
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

      return visit({ node: child, method: fix })
    })
  )

  return visit({ node: clone(root), method: fix })
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
  const heightPercent = (
    100 * duration / node.parent.duration
  )
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
      p={0} w="full" {...{ className }}
      sx={{
        '&.hovered::before': { opacity: 1 }
      }}
      onMouseEnter={() => mouseOver(node)}
      onMouseLeave={() => mouseOut(node)}
    >
      <Link
        style={{ display: 'block', width: '0.75em' }}
        to={`#${node.id}`}
      />
      <Flex
        direction={node.partition ? 'column' : 'row'}
      >
        {node.children.map((child, idx) => (
          <Spans
            {...{ duration, hovered, setHovered }}
            key={child.id} node={child}
            count={count + idx + 1}
          />
        ))}
      </Flex>
      <Link
        style={{ display: 'block', width: '0.25em' }}
        to={`#${node.id}`}
      />
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
    new Date(startsAt.getTime() + duration * 1000)
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

const onlyTime = ({ setter }) => (
  (str) => {
    str = (
      str.replace(/[^0-9\-−:.]/g, '')
      .replace(/^(.+)[-−](.*)$/g, '$1$2')
    )
    setter.call(this, str)
    return str
  }
)

const NodeSettings = ({
  open, closeNodeSettings, node, replaceNode,
}) => {
  const { partition, children, raw } = node
  const initialRef = useRef()
  const [title, setTitle] = useState(node.title)
  const [body, setBody] = useState(node.body)
  const [startOffset, baseStartOffset] = (
    useState(raw.startOffset ?? '')
  )
  const [duration, baseDuration] = (
    useState(raw.duration ?? '')
  )
  const defaultEnd = (
    timeFor(ifSet(startOffset) ?? node.startOffset)
    + timeFor(ifSet(duration) ?? node.duration)
  )
  const [endOffset, baseEndOffset] = (
    useState(
      (isSet(startOffset) && isSet(duration)) ? (
        stringFor(defaultEnd)
      ) : (
        ''
      )
    )
  )
  const setStartOffset = (str) => {
    str = onlyTime({ setter: baseStartOffset })(str)
    const start = (
      timeFor(ifSet(str) ?? node.startOffset)
    )
    if(isSet(endOffset)) {
      const end = timeFor(endOffset)
      setDuration(
        stringFor(end - start),
        { sync: false },
      )
    } else if(isSet(duration)) {
      const length = timeFor(duration)
      setEndOffset(
        stringFor(start + length),
        { sync: false },
      )
    }
  }
  const setDuration = (str, { sync } = {}) => {
    str = onlyTime({ setter: baseDuration })(str)
    if(sync !== false && (isSet(endOffset) || isSet(startOffset))) {
      const start = (
        timeFor(ifSet(startOffset) ?? node.startOffset)
      )
      setEndOffset(
        stringFor(start + timeFor(str)),
        { sync: false },
      )
    }
  }
  const setEndOffset = (str, { sync } = {}) => {
    str = onlyTime({ setter: baseEndOffset })(str)
    if(
      sync !== false
      && (isSet(duration) || isSet(startOffset))
    ) {
      const start = (
        timeFor(ifSet(startOffset) ?? node.startOffset)
      )
      const end = timeFor(str)
      setDuration(
        stringFor(end - start),
        { sync: false },
      )
    }
  }
  const replacement = useMemo(() => {
    const fields = {
      title, body, duration, startOffset,
      partition, children,
    }
    const node = newNode()
    Object.entries(fields).forEach(
      ([key, value]) => {
        if(isSet(value)) {
          node[key] = value
        }
      }
    )
    return node
  }, [
    body, children, duration,
    partition, startOffset, title,
  ])

  return (
    <Modal
      size="xl" initialFocusRef={initialRef}
      {...{ isOpen: open, onClose: closeNodeSettings }}
    >
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader
          textOverflow="ellipsis"
          overflow="hidden"
          whiteSpace="nowrap"
        >Node: <q>{title}</q></ModalHeader>
        <ModalCloseButton/>
        <ModalBody pb={6}>

          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab>Text</Tab>
              <Tab>Timing</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <FormControl mt={4}>
                  <FormLabel>Title</FormLabel>
                  <Input
                    ref={initialRef} value={title} autoFocus
                    onChange={({ target: { value }}) => {
                      setTitle(value)
                    }}
                  />
                </FormControl>

                <FormControl mt={4}>
                  <Tabs isFitted variant="enclosed">
                    <TabList mb="1em">
                      <Tab>Body</Tab>
                      <Tab>Preview</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        <Textarea
                          value={body} minH="5em"
                          placeholder="Markdown"
                          onChange={({ target: { value }}) => {
                            setBody(value)
                          }}
                        />
                      </TabPanel>
                      <TabPanel>
                        <Markdown>{body}</Markdown>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </FormControl>
              </TabPanel>
              <TabPanel>
                <FormControl>
                  <FormLabel>Start Offset</FormLabel>
                  <Flex>
                    <Input
                      ref={initialRef} value={startOffset}
                      placeholder={
                        'automatic or HH:mm:ss.msms or mm:ss or ssss'
                      }
                      onChange={({ target: { value }}) => (
                        setStartOffset(value)
                      )}
                    />
                    {
                      startOffset === '' && node.startOffset >= 0
                      && ((() => {
                        const time = stringFor(node.startOffset)
                        return (
                          <Button
                            variant="outline"
                            p={2} ml={2} fontWeight="bold"
                            onClick={() => {
                              setStartOffset(time)
                            }}
                            title={
                              `Autocomplete with ${time}`
                            }
                          >←</Button>
                        )
                      })())
                    }
                  </Flex>
                </FormControl>

                <Flex>
                  <FormControl mt={4}>
                    <FormLabel>End Offset</FormLabel>
                    <Flex>
                      <Input
                        placeholder="automatic"
                        value={endOffset}
                        onChange={({ target: { value }}) => {
                          setEndOffset(value)
                        }}
                      />
                      {
                        endOffset === '' && !!defaultEnd
                        && ((() => {
                          const time = stringFor(defaultEnd.toString())
                          return (
                            <Button
                              variant="outline"
                              p={2} ml={2} fontWeight="bold"
                              onClick={() => {
                                setEndOffset(time)
                              }}
                              title={
                                `Autocomplete with ${time}`
                              }
                            >←</Button>
                          )
                        })())
                      }
                    </Flex>
                  </FormControl>
                  <Text alignSelf="end" mb={2} mx={2}>or</Text>
                  <FormControl mt={4}>
                    <FormLabel>Duration</FormLabel>
                    <Flex>
                      <Input
                        placeholder="automatic"
                        value={duration}
                        onChange={({ target: { value }}) => (
                          setDuration(value)
                        )}
                      />
                      {
                        !isSet(duration) && isSet(node.duration)
                        && ((() => {
                          const time = stringFor(node.duration.toString())
                          return (
                            <Button
                              variant="outline"
                              p={2} ml={2} fontWeight="bold"
                              onClick={() => {
                                setDuration(time)
                              }}
                              title={
                                `Autocomplete with ${time}`
                              }
                            >←</Button>
                          )
                        })())
                      }
                    </Flex>
                  </FormControl>
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue" mr={3}
            onClick={() => {
              replaceNode({ node, replacement })
              closeNodeSettings()
            }}
          >Save</Button>
          <Button onClick={closeNodeSettings}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const Events = ({
  node = {}, insertChild, replaceNode, insertParent,
  duration, count = 1, hovered, setHovered, ...props
}) => {
  const {
    isOpen: open,
    onOpen: openNodeSettings,
    onClose: closeNodeSettings,
  } = useDisclosure()

  if (!node) return null

  const addChild = (parent) => {
    insertChild(
      { parent, insert: { title: 'new' } }
    )
  }
  const addPartition = (sibling) => {
    const { parent } = sibling
    if(!parent.partition) {
      insertParent({
        child: sibling,
        insert: { partition: true },
        siblings: [newNode({ title: 'part' })],
      })
    } else {
      insertChild({
        parent, insert: { title: 'new' }, anchor: sibling
      })
    }
  }
  const addParallel = (sibling) => {
    let { parent } = sibling
    while(parent.partition && parent.parent) {
      sibling = parent
      parent = parent.parent
    }
    insertChild({
      parent, insert: { title: 'para' }, anchor: sibling
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

  const edit = (node) => {
    openNodeSettings()
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

  const Option = ({ children, ...props }) => (
    <Button
      {...props}
      fontWeight="normal" variant="outline" mt={1.5}
      fontSize={15} p={1} _hover={{ bg: '#00000077' }}
    >{children}</Button>
  )

  return (
    <>
      <NodeSettings
        {...{
          closeNodeSettings, open,
          node, replaceNode,
        }}
      />
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
        {node.title && (
          <Flex>
            <Heading
              fontSize={32} color="white" pt={3}
            >
              {node.title}
            </Heading>
            <Spacer />
            <ButtonGroup>
            <Option
                title="Edit This Node"
                onClick={() => edit(node)}
              >✏️</Option>
              <Option
                title="Create A Child"
                onClick={() => addChild(node)}
              >█ → 🬠</Option>
              <Option
                title="Create A Partition Sibling"
                onClick={() => addPartition(node)}
              >█ → 🮒</Option>
              <Option
                title="Create A Parallel Sibling"
                onClick={() => addParallel(node)}
              >█ → 🮔</Option>
              <Option
                title="Remove Node"
                onClick={() => removeNode(node)}
              >➖</Option>
            </ButtonGroup>
          </Flex>
        )}
        {isSet(node.body) && (
          <Box
            sx={{
               a: { borderBottom: 'dashed' },
               'a:hover': { borderBottom: 'solid' },
            }}
          >
            <Divider color="white"/>
            <Markdown>{node.body}</Markdown>
          </Box>
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
    </>
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

const FileSettings = ({
  open, closeFileSettings, info, setInfo,
}) => {
  if(!isSet(info.startsAt)) {
    info.startsAt = new Date()
  }
  const [startsAt, setStartsAt] = useState(
    isoStringFor(info.startsAt, { tz: false })
  )

  return (
    <Modal
      size="xl"
      {...{ isOpen: open, onClose: closeFileSettings }}
    >
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader
          textOverflow="ellipsis"
          overflow="hidden"
          whiteSpace="nowrap"
        >File Settings</ModalHeader>
        <ModalCloseButton/>
        <ModalBody pb={6}>
          <FormControl mt={4}>
            <FormLabel>Start Time</FormLabel>
            <Input
              type="datetime-local"
              value={startsAt} autoFocus
              onChange={({ target: { value }}) => {
                setStartsAt(value)
              }}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue" mr={3}
            onClick={() => {
              setInfo((info) => (
                {
                  ...info,
                  startsAt: new Date(startsAt),
                }
              ))
              closeFileSettings()
            }}
          >Save</Button>
          <Button onClick={closeFileSettings}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ({
  stops: rootStops = [], source,
}) => {
  const [duration, setDuration] = (
    useState(DEFAULT_DURATION)
  )
  const vid = useRef()
  const [/*time*/, setTime] = useState(0)
  const [raw, setRaw] = useState(
    connect({ stops: rootStops })
  )
  const [stops, setStops] = useState()
  const [hovered, setHovered] = useState([])
  const [info, setInfo] = useState({
    startsAt: new Date()
  })
  const [vidHeight, setVidHeight] = (
    useState(DEFAULT_VID_HEIGHT)
  )
  const {
    isOpen: open,
    onOpen: openFileSettings,
    onClose: closeFileSettings,
  } = useDisclosure()
  const src = useMemo(() => {
    const regex = /^ipfs:(\/\/)?(.+)$/i
    const match = source.match(regex)
    if (match) {
      if(match[2].includes('Qmeiz7YmwtVYMRSUG3VdKTxU634JTPaB5j2xLj5RREqAkG')) {
        return 'http://bafybeihtoo2yau6rnzlfad3jh62u3wccm4bs7j7wh5wb76estw77codume.ipfs.localhost:8888/2021%E2%81%8410%E2%81%8406@09:56:54.MetaGame%E2%80%99s%20Builders%E2%80%99%20Align.x264.mp4'
      }

      return `//ipfs.io/ipfs/${match[2]}`
    }
    return source
  }, [source])

  useEffect(() => {
    setStops(
      generate({ root: raw, duration, raw })
    )
  }, [raw, duration])

  const insertChild = ({ parent, insert, anchor }) => {
    const self = { ...parent.raw }
    insert = newNode(insert)
    insert.parent = self
    const { children } = parent
    const pos = (
      anchor ? children.indexOf(anchor) : children.length
    )
    self.children = [
      ...self.children.slice(0, pos + 1),
      insert,
      ...self.children.slice(pos + 1),
    ]
    const insertion = ({ children, visit }) => (
      children.map((child) => {
        visit({ node: child, method: insertion })
        return child.id === self.id ? self : child
      })
    )
    setRaw((raw) => {
      return visit({ node: clone(raw), method: insertion })
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
    let outer = null
    setRaw((raw) => {
      const dup = outer = clone(raw)
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
        replacement.id = node.id
        replacement.parent = parent
        parent.children = [
          ...children.slice(0, index),
          replacement,
          ...children.slice(index + 1),
        ]
      }
      return dup
    })
    return outer
  }

  const seekTo = (time) => {
    vid.current.currentTime = time
  }

  const serialize = () => {
    const strip = (
      ({ parent, children, visit }) => {
        delete parent.id
        delete parent.parent
        if(!parent.partition) {
          delete parent.partition
        }

        return children.map((child) => (
          visit({ node: child, method: strip })
        ))
      }
    )
    const stripped = (
      visit({ node: clone(raw), method: strip })
    )
    const metadata = {
      file: info,
      stops: stripped,
    }
    console.info({ metadata })
    const blob = new Blob(
      [JSON.stringify(metadata, null, 2)],
      { type: "text/json" },
    )
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank').focus()
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
    const set = () => setDuration(video.duration)
    video.addEventListener('loadedmetadata', set)
    return () => {
      video.removeEventListener('loadedmetadata', set)
    }
  }, [])

  return (
    <>
      <FileSettings {...{
        open, closeFileSettings, info, setInfo,
      }}/>
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
                startsAt={info.startsAt}
                {...{
                  duration, hovered, setHovered,
                }}
                node={stops}
                h={`calc(100vh - ${vidHeight}px)`}
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
          maxH={vidHeight} maxW="100vw"
        >
          <Flex maxH="100%" maxW="100vw">
            <Video
              flexGrow={1} controls
              maxH="100%" maxW="calc(100vw - 5.5em)"
              ref={vid}
            >
              <source {...{ src, type: 'video/mp4' }} />
              {/* {VTT && <track default src={VTT}/>} */}
            </Video>
            <Button
              title="Download the current configuration"
              onClick={serialize}
            >⭳</Button>
            <Button
              title="Edit the file information"
              onClick={openFileSettings}
            >⚙</Button>
          </Flex>
        </GridItem>
      </Grid>
      <Button
        position="absolute"
        left="50%" bottom={vidHeight}
        transform="translate(-50%, 50%)"
        draggable={true} variant="outline"
        onDrag={({ clientY: y, target, type }) => {
          const { height } = (
            target.getBoundingClientRect()
          )
          if(y > 0) { // an event w/ y = 0 fires at the end
            // ToDo: keep the button on the screen
            setVidHeight(Math.max(
              window.innerHeight - y,
              height,
            ))
          }
        }}
      >⇅</Button>
    </>
  )
}