import {
  Box, Button, ButtonGroup, Flex, GridItem, Grid, Heading,
  Stack, Spacer, Spinner, chakra, useDisclosure, Input,
  ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalCloseButton, ModalBody, FormControl, FormLabel,
  Modal, Text, Textarea, Divider, Image, Tooltip,
  Tabs, TabList, TabPanels, Tab, TabPanel,
} from '@chakra-ui/react'
import {
  useEffect, useRef, useState, useMemo,
} from 'react'
import Markdown from 'react-markdown'
import demark from 'remove-markdown'
import { v4 as uuid } from 'uuid'
import { HashLink as Link } from 'react-router-hash-link'
import JSON5 from 'json5'
import {
  isoStringFor, stringFor, timeFor, isSet, ifSet,
} from './utils'
import CeramicLogo from './images/ceramic.svg'
import plan from './images/planning.svg'
import decision from './images/gavel.svg'
import issue from './images/ticket.svg'
import presenter from './images/speaker.svg'
import unknown from './images/question mark.svg'
import previously from './images/left arrow.svg'
import discussion from './images/discuss.svg'
import logistics from './images/certification.svg'
import blocked from './images/brick wall.svg'

const icons = {
  plan, decision, issue, presenter, previously,
  discussion, logistics, blocked, unknown,
}

const DEFAULT_DURATION = Math.pow(60, 2)
const DEFAULT_VID_HEIGHT = 100

const Video = chakra('video')

const colors = [
  'orange', 'red', 'green', 'purple', 'yellow',
  'silver', 'blue', 'cyan', 'brown',
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
  let children = node?.children ?? []
  children = method.apply(
    node, [{ children, parent: node, visit }]
  )
  if(isSet(node.children)) {
    node.children = children
  }
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
  const fix = ({ parent, children, visit }) => {
    parent.raw = findById(raw, parent.id)

    children.forEach((child) => {
      ['duration', 'startOffset'].forEach((attr) => {
        if (typeof child[attr] === 'string') {
          child[attr] = timeFor(child[attr])
        }
      })
    })

    const siblings = siblingsOf(parent)
    const index = siblings.indexOf(parent)
    const gparent = parent.parent
    if(
      !isSet(parent.startOffset)
      || isNaN(parent.startOffset)
    ) {
      if(gparent?.partition) {
        if(index === 0) {
          parent.startOffset = gparent.startOffset
        } else if(index <= siblings.length - 1) {
          parent.startOffset = (
            siblings[index - 1].startOffset
            + siblings[index - 1].duration
          )
        } else {
          console.warn(
            'Bad Index',
            { index, parent, siblings },
          )
        }
      } else if(gparent) {
        parent.startOffset = gparent.startOffset
      } else {
        parent.startOffset = 0
      }
    }

    if(
      !isSet(parent.duration)
      || isNaN(parent.duration)
    ) {
      if(gparent?.partition) {
        if(index >= 0 && index < siblings.length - 1) {
          const start = index
          let end = start + 1
          while(
            end < siblings.length
            && !isSet(siblings[end].startOffset)
          ) {
            end++
          }
          const total = (
            (end === siblings.length ? (
              gparent.startOffset + gparent.duration
            ) : (
              siblings[end].startOffset
            ))
            - siblings[start].startOffset
          )
          for(let i = start; i < end; i++) {
            siblings[i].duration = (
              total / (end - start)
            )
          }
        } else if(index === siblings.length - 1) {
          const {
            startOffset: pStart, duration: pDur
          } = gparent
          parent.duration = (
            (pStart + pDur) - parent.startOffset
          )
        } else {
          console.warn(
            'Bad Index',
            { index, parent, siblings },
          )
        }
      } else if(gparent) {
        parent.duration = gparent.duration
      } else {
        parent.duration = duration
      }
    }
  
    if (!isSet(parent.startOffset)) {
      console.warn(`No Starting Time`, { parent })
    }
    if (!isSet(parent.duration)) {
      console.warn(`No Event Duration`, { parent })
    }

    return children.map((child) => (
      visit({ node: child, method: fix })
    ))
  }

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
    duration, partition, raw, ...rest
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
    100 * duration / (node.parent?.duration ?? duration)
  )
  let className = 'span'
  if(hovered.includes(node.id)) {
    className += ' hovered'
  }

  return (
    <Tooltip label={demark(node.title)}>
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
          style={{
            display: 'block',
            flexGrow: 2,
            minWidth: "0.75em",
          }}
          to={`#${node.id}`}
        />
        <Flex
          flexGrow={0}
          minW={node.children.length === 0 ? 0 : '1em'}
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
          style={{
            display: 'block',
            flexGrow: 1,
            minWidth: "0.25em",
          }}
          to={`#${node.id}`}
        />
      </Flex>
    </Tooltip>
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
  node, startsAt, duration, time,
  hovered, setHovered, ...props
}) => {
  const endsAt = useMemo(() => (
    new Date(startsAt.getTime() + duration * 1000)
  ), [startsAt, duration])

  if (!(endsAt instanceof Date) || isNaN(endsAt) || !node) {
    return null
  } else {
    const ends = isoStringFor(
      endsAt,
      { date: false, tz: false },
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
      partition, children, id: node.id,
    }
    const gen = newNode()
    Object.entries(fields).forEach(
      ([key, value]) => {
        if(isSet(value)) {
          gen[key] = value
        }
      }
    )
    return gen
  }, [
    body, children, duration,
    partition, startOffset, title,
    node.id,
  ])
  const save = (evt) => {
    evt.preventDefault()
    replaceNode({ node, replacement })
    closeNodeSettings()
  }

  return (
    <Modal
      size="xl" initialFocusRef={initialRef}
      {...{ isOpen: open, onClose: closeNodeSettings }}
    >
      <ModalOverlay/>
      <ModalContent as="form" onSubmit={save}>
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
                    onKeyPress={(evt) => {
                      evt.stopPropagation()
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
                <FormControl mt={4}>
                  <FormLabel>ID</FormLabel>
                  <Input
                    value={node.id} disabled
                  />
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
            colorScheme="red"
            onClick={closeNodeSettings}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            colorScheme="blue" ml={3}
          >Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const Option = ({ children, onClick, ...props }) => {
  const clicked = (evt) => {
    evt.stopPropagation()
    onClick(evt)
  }
  return (
    <Button
      {...props}
      fontWeight="normal" variant="outline" mt={1.25}
      fontSize={15} p={1} _hover={{ bg: '#00000077' }}
      onClick={onClick ? clicked : null}
    >{children}</Button>
  )
}

const WrapPartition = ({ children, node }) => {
  if(node.partition) {
    const id = `${node.id}-wrap`
    return (
      <Box
        {...{ id }}
        px={2}
        position="relative"
        _before={{
          content: '""', zIndex: -1,
          position: 'absolute', opacity: 0.5,
          top: 0, left: 0, bottom: 0, right: 0,
          bg: colorFor(id),
        }}
      >
        {children}
      </Box>
    )
  }
  return children
}

const Events = ({
  node = {}, insertChild, replaceNode, insertParent,
  duration, count = 1, hovered, setHovered, seekTo,
  index = 0, ...props
}) => {
  const [menuVisible, setMenuVisible] = (
    useState(false)
  )
  const {
    isOpen: open,
    onOpen: openNodeSettings,
    onClose: closeNodeSettings,
  } = useDisclosure()

  if (!node) return null

  const toggleMenu = (value = null) => {
    if(value !== null) {
      setMenuVisible(value)
    } else {
      setMenuVisible((val) => !val)
    }
  }

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
    duration: dur, partition, raw, ...rest
  } = node

  if (Object.keys(rest).length === 0) {
    return (
      children.map((child, index) => {
        return (
        <Events
          {...{
            duration, insertChild,
            insertParent, replaceNode,
            hovered, setHovered,
            seekTo, index,
          }}
          key={index}
          node={child}
          count={count + index}
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

  const prefix = node.title?.replace(/:.*/g, '').toLowerCase()
  let icon = icons[prefix]
  if(!icon) {
    icon = icons.unknown
  }

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
        mt={index === 0 ? 0 : 1.5} px={3} w="full"
        sx={{
          '&.hovered::before': { opacity: 1 }
        }}
        onMouseEnter={() => mouseOver(node)}
        onMouseLeave={() => mouseOut(node)}
        onClick={(evt) => {
          evt.stopPropagation()
          seekTo(node.startOffset)
        }}
        {...props} {...{ className }}
      >
        {node.title && (
          <Flex>
            {icon && (
              <Image
                borderRadius="50%" bg="#FFFFFF55"
                minW={10} maxW={10} minH={10} maxH={10}
                p={0.5} mr={1}
                src={icon} alt={prefix}
                border="1px solid black"
              />
            )}
            <Heading
              fontSize={32} color="white" pt={1.5}
              textOverflow="ellipsis"
              overflow="hidden"
              whiteSpace="nowrap"
              title={demark(node.title)}
              sx={{
                a: { borderBottom: '2px dashed' },
                'a:hover': { borderBottom: '2px solid' },
              }}
            >
              <Markdown linkTarget="_blank">
                {node.title}
              </Markdown>
            </Heading>
            <Spacer />
            {menuVisible && (
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
            )}
            <Button
              ml={3}
              onClick={(evt) => {
                evt.stopPropagation()
                toggleMenu()
              }}
              title={menuVisible ? (
                'Hide Node Options'
              ) : (
                'Show Node Options'
              )}
            >
              {menuVisible ? <Text fontWeight="bold">┆</Text> : '☰'}
            </Button>
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
            <Markdown linkTarget="_blank">
              {node.body}
            </Markdown>
          </Box>
        )}
        <WrapPartition {...{ node }}>
          {node.children?.map((child, index) => (
            <Events
              {...{
                duration, insertChild,
                insertParent, replaceNode,
                hovered, setHovered,
                seekTo, index,
              }}
              key={index}
              node={child}
              count={count + index + 1}
            />
          ))}
        </WrapPartition>
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

const VideoSettings = ({
  open, closeVideoSettings, info, setInfo,
}) => {
  if(!isSet(info.startsAt)) {
    info.startsAt = new Date()
  }
  const [startsAt, setStartsAt] = useState(
    isoStringFor(info.startsAt, { tz: false })
  )
  const [source, setSource] = (
    useState(info.source)
  )
  const [port, setPort] = useState(info.port)

  const save = (evt) => {
    evt.preventDefault()
    setInfo((info) => ({
      ...info,
      startsAt: new Date(startsAt),
      source,
      port,
    }))
    localStorage.setItem(
      'consult.localhost.ipfs.gateway.port',
      port,
    )
    closeVideoSettings()
  }

  return (
    <Modal
      size="xl"
      {...{ isOpen: open, onClose: closeVideoSettings }}
    >
      <ModalOverlay/>
      <ModalContent as="form" onSubmit={save}>
        <ModalHeader
          textOverflow="ellipsis"
          overflow="hidden"
          whiteSpace="nowrap"
        >Video Settings</ModalHeader>
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
          <FormControl mt={4}>
            <FormLabel>Video Source</FormLabel>
            <Input
              value={source}
              onChange={({ target: { value }}) => {
                setSource(value)
              }}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Local IPFS Port</FormLabel>
            <Input
              value={port}
              onChange={({ target: { value }}) => {
                setPort(value)
              }}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="red"
            onClick={closeVideoSettings}
          >Cancel</Button>
          <Button
            type="submit"
            colorScheme="blue" ml={3}
          >Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const DateTime = ({ startsAt, time }) => {
  const current = (
    new Date(startsAt.getTime() + time * 1000)
  )
  const opts = { date: false, tz: false }
  return (
    <Flex
      direction="column" lineHeight={1}
      align="center" justify="center"
    >
      <Box>{isoStringFor(current, opts)}</Box>
      <Box>
        +{stringFor(time, { milliseconds: false })}
      </Box>
    </Flex>
  )
}

export default (config) => {
  const [duration, setDuration] = (
    useState(DEFAULT_DURATION)
  )
  const vid = useRef()
  const [time, setTime] = useState(0)
  const [raw, setRaw] = useState(
    connect({ stops: config.stops })
  )
  const [stops, setStops] = useState()
  const [hovered, setHovered] = useState([])
  const [info, setInfo] = useState({
    startsAt: config.startsAt,
    source: config.source,
    port: (
      localStorage.getItem(
        'consult.localhost.ipfs.gateway.port'
      )
      ?? '8080'
    ),
  })
  const { startsAt, source, port } = info
  const [vidHeight, setVidHeight] = (
    useState(DEFAULT_VID_HEIGHT)
  )
  const {
    isOpen: open,
    onOpen: openVideoSettings,
    onClose: closeVideoSettings,
  } = useDisclosure()
  const src = useMemo(() => {
    const regex = /^ipfs:(\/\/)?(([^/]+)\/?(.*))$/i
    const match = source.match(regex)
    if(match) {
      if(
        match[3].startsWith('bafybei')
        && isSet(port)
      ) {
        return (
          `http://${match[3]}.ipfs.localhost:${port}`
          + `/${match[4]}`
        )
      }
      return `//ipfs.io/ipfs/${match[2]}`
    }
    return source
  }, [source, port])

  useEffect(() => {
    const stops = generate({ root: raw, duration, raw })
    setStops(stops)
  }, [raw, duration])

  useEffect(() => {
    const togglePause = (evt) => {
      switch(evt.key) {
        case 'p': case 'P':
          if(vid.current.paused) {
            vid.current.play()
          } else {
            vid.current.pause()
          }
        break
        case 'b':
          seekTo(time - 5)
        break
        case 'B':
          seekTo(time - 20)
        break
        case 'f':
          seekTo(time + 5)
        break
        case 'F':
          seekTo(time + 20)
        break
        default:
        break
      }
    }
    window.addEventListener('keypress', togglePause)
    return () => {
      window.removeEventListener('keypress', togglePause)
    }
  })

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

  const insertChild = ({ parent, insert, anchor }) => {
    const self = { ...findById(raw, parent.id) }
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
    console.info('Seeking To', time)
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
        if(children.length === 0) {
          delete parent.children
        }
        delete parent.raw

        return children.map((child) => (
          visit({ node: child, method: strip })
        ))
      }
    )
    const stripped = (
      visit({ node: clone(raw), method: strip })
    )
    const metadata = {
      video: info,
      stops: stripped,
    }
    try {
      const blob = new Blob(
        [JSON5.stringify(metadata, null, 2)],
        { type: "text/json" },
      )
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank').focus()
    } catch(error) {
      console.error({ error })
    }
  }

  const upload = () => {
  }

  return (
    <>
      <VideoSettings {...{
        open, closeVideoSettings, info, setInfo,
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
                {...{
                  startsAt, duration, time,
                  hovered, setHovered,
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
                  seekTo,
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
            <DateTime {...{ startsAt, time }}/>
            <Video
              flexGrow={1} controls
              maxH="100%" maxW="calc(100vw - 10em)"
              ref={vid}
            >
              <source {...{ src, type: 'video/mp4' }} />
              {/* {VTT && <track default src={VTT}/>} */}
            </Video>
            <Flex align="center">
              <Stack>
                <Button
                  title="Edit the video information"
                  onClick={openVideoSettings}
                  h="auto"
                >⚙</Button>
                <Button
                  title="Download the current configuration"
                  onClick={serialize}
                  h="auto"
                >⭳</Button>
              </Stack>
              <Button
                title="Upload to Ceramic"
                onClick={upload}
              >
                <Image
                  minH={25} minW={25}
                  src={CeramicLogo}
                />
              </Button>
            </Flex>
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
            if(y <= window.innerHeight - DEFAULT_VID_HEIGHT) {
              setVidHeight(window.innerHeight - y)
            }
          }
        }}
      >⇅</Button>
    </>
  )
}