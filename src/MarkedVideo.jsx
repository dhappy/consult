// @ts-check

import {
  Box, Button, Flex, GridItem, Grid, Heading,
  Spinner, chakra, useDisclosure, Image, Wrap,
  useToast,
  useColorMode,
} from '@chakra-ui/react'
import React, {
  useEffect, useRef, useState, useMemo,
} from 'react'
import { HashLink } from 'react-router-hash-link'
import { useHistory } from 'react-router-dom'
import { useLocation } from 'react-router'
import JSON5 from 'json5'
import {
  stringFor, isEmpty,
  isSet, ifSet, toHTTP,
} from './lib/utils'
import { clone, connect, findById, interpolate, newNode, siblingsOf, visit } from './lib/stops'
import { Events, VideoSettings, DateTime, KeyboardShortcuts, Times } from './components'
import CeramicLogo from './images/ceramic.svg'


const DEFAULT_DURATION = Math.pow(60, 2)
const DEFAULT_VID_HEIGHT = 100

const Video = chakra('video')
const Link = chakra(HashLink)

export const MarkedVideo = (config) => {
  const [duration, setDuration] = (
    useState(DEFAULT_DURATION)
  )
  const video = useRef()
  const [time, setTime] = useState(0)
  const [raw, setRaw] = useState(
    connect({ stops: (
      config.isNew && isEmpty(config.stops, { undefIs: true })
      ? { new: true } : config.stops
    ) })
  )
  const [stops, setStops] = useState()
  const [hovered, setHovered] = useState([])
  const [eventsTime, setEventsTime] = useState([])
  const [info, setInfo] = useState({
    startsAt: config.startsAt,
    source: config.source,
  })
  const { startsAt, source } = info
  const { search: queryParams } = (
    useLocation()
  )
  const params = new URLSearchParams(queryParams)
  const [vidHeight, setVidHeight] = useState(
    ifSet(params.get('vidHeight'))
    ?? DEFAULT_VID_HEIGHT
  )
  const [activeId, setActiveId] = useState(null)
  const [active, setActive] = useState([])
  const { toggleColorMode }= useColorMode()
  const {
    isOpen: videoSettingsOpen,
    onOpen: openVideoSettings,
    onClose: closeVideoSettings,
  } = useDisclosure()
  const {
    isOpen: shortcutsOpen,
    onOpen: openShortcuts,
    onClose: closeShortcuts,
  } = useDisclosure()
  const history = useHistory()
  const toast = useToast()
  const { ipfs, IPFSButton } = config

  const src = useMemo(
    () => toHTTP(source), [source]
  )

  useEffect(() => {
    const stops = interpolate({
      root: raw, duration, raw, toast,
    })
    setStops(stops)
    if(activeId === null) {
      setActiveId(stops.id)
    }
  }, [raw, duration, startsAt])

  useEffect(() => {
    const findActive = ({ time, node }) => {
      if(
        node.startOffset <= time
        && node.startOffset + node.duration > time
      ) {
        const sub = node.children.map((child) => (
          findActive({ time, node: child })
        ))
        return [node.id, sub]
      }
      return []
    }
    const deepest = (list) => {
      if(!list || isEmpty(list)) {
        return null
      }
      for(const sub of list) {
        if(
          Array.isArray(sub)
          && sub?.some?.((e) => !!e && !isEmpty(e))
        ) {
          const value = deepest(sub)
          if(value) {
            return value
          }
        }
      }
      return list.find((e) => Boolean(e))
    }
    if(stops) {
      let search = findActive({
        time, node: stops,
      })
      if(search) {
        const seekable = deepest(search)
        const elem = document.getElementById(seekable)
        const bbox = elem.getBoundingClientRect()
        
        if(
          bbox.top < 0
          || bbox.bottom > window.innerHeight
        ) {
          elem.scrollIntoView()
        }
        const ids = (
          search.flat(Number.POSITIVE_INFINITY)
          .filter((elem) => !!elem)
        )
        setActive(ids)
      }
    }
  }, [time, stops, activeId])

  const togglePause = (pause = null) => {
    if(video.current) {
      pause = (
        typeof(pause) !== 'boolean' ? (
          !video.current?.paused
        ) : (
          pause
        )
      )
      if(pause) {
        video.current?.pause()
      } else {
        video.current?.play()
      }
    }
  }

  useEffect(() => {
    const keyed = (event) => {
      const { target, key, ctrlKey } = event

      if(
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
      ) {
        return
      }
      switch(key) {
        case 'p': case 'P': {
          togglePause()
          break
        }
        case 's': {
          seekTo(time - duration * 0.1)
          break
        }
        case 'b': case '4': {
          seekTo(time - 5)
          break
        }
        case 'B': {
          seekTo(time - 20)
          break
        }
        case 'j': {
          seekTo(time + duration * 0.1)
          break
        }
        case 'f': case '6': {
          seekTo(time + 5)
          break
        }
        case 'F': {
          seekTo(time + 20)
          break
        }
        case 'c': {
          if(isSet(activeId)) {
            insertChild({ parentOrId: activeId })
          } else {
            toast({
              title: 'No Active Node',
              description: 'To create a child node, it is necessary to mark the parent active using Control-Left Click.',
              status: 'error',
              duration: 15000,
              isClosable: true,
            })
          }
          break
        }
        case 't': {
          if(isSet(activeId)) {
            partition({
              precedingOrId: activeId,
              insert: { defaultStartsOffset: (
                isSet(raw.duration) ? time : duration
              ) },
            })
          } else {
            toast({
              title: 'No Active Node',
              description: 'To create a partition it is necessary to mark the preceding sibling active using Control-Left Click.',
              status: 'error',
              duration: 15000,
              isClosable: true,
            })
          }
          break
        }
        case 'T': {
          if(isSet(activeId)) {
            partition({ parentOrId: activeId })
          } else {
            toast({
              title: 'No Active Node',
              description: 'To create a partition it is necessary to mark the preceding sibling active using Control-Left Click.',
              status: 'error',
              duration: 15000,
              isClosable: true,
            })
          }
          break
        }
        case 'm': {
          toggleColorMode()
          break
        }
        case '2': {
          activate({ precedingOrParent: activeId })
          break
        }
        case '8': {
          activate({ postcedingOrParent: activeId })
          break
        }
        case 'e': {
          event.preventDefault()
          setStops((stops) => {
            const active = findById(stops, activeId)
            active.new = true
            return { ...stops }
          })
          break
        }
        case 'k': {
          openShortcuts()
          break
        }
        default:
        break
      }
    }
    window.addEventListener('keypress', keyed)
    return () => {
      window.removeEventListener('keypress', keyed)
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
    const vid = video.current
    if(vid) {
      const update = ({ target: { currentTime: time }}) => {
        setTime(time)
      }
      vid.addEventListener('timeupdate', update)
      return () => {
        vid.removeEventListener('timeupdate', update)
      }
    } else if(!isSet(raw.duration)) {
      const intervalId = window.setInterval(
        () => {
          const duration = (
            (Date.now() - startsAt.getTime()) / 1000
          )
          setDuration(duration)
        },
        1000,
      )
      return () => window.clearInterval(intervalId)
    }
  }, [setTime, startsAt])

  useEffect(() => {
    const vid = video.current
    if(vid) {
      const set = () => setDuration(vid.duration)
      vid.addEventListener('loadedmetadata', set)
      return () => {
        vid.removeEventListener('loadedmetadata', set)
      }
    }
  }, [])

  const insertChild = (
    ({ parentOrId, insert, anchor }) => {
      const id = parentOrId?.id ?? parentOrId

      if(!isSet(id)) {
        console.warn(`insertChild called with ${id} id`)
        return null
      }

      const parent = { ...findById(raw, id) }
      insert = newNode(insert)
      insert.parent = parent
      insert.new = true
      const { children } = parent
      const pos = (
        anchor
        ? children.indexOf(anchor)
        : children.length
      )
      parent.children = [
        ...children.slice(0, pos + 1),
        insert,
        ...children.slice(pos + 1),
      ]
      const insertion = ({
        node, visit,
      }) => {
        if(node.id === parent.id) {
          return parent
        }
        node.children = node.children.map(
          (child) => {
            child = visit({
              node: child, method: insertion,
            })
            return (
              child.id === parent.id
              ? parent : child
            )
          }
        )
        return node
      }
      setRaw((raw) => visit({
        node: clone(raw), method: insertion,
      }))
      return insert
    }
  )

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
      let newRoot = outer = clone(raw)
      const rawNode = findById(newRoot, node.id)

      if(!rawNode) {
        throw new Error(`Couldn't find node with id: ${node.id}`)
      }

      const { parent } = rawNode

      if(!parent) { // root to be replaced
        if(!replacement) {
          newRoot = outer = {}
        } else {
          replacement.children = rawNode.children
          newRoot = outer = replacement
        }
      } else {
        const { children } = parent
        const index = (
          children?.findIndex(
            (child) => child.id === node.id
          )
        )

        if(!isSet(index)) {
          console.error('Couldn’t find node.', { node, parent, children, index })
        } else {
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
        }
      }
      return newRoot
    })
    return outer
  }

  const partition = ({ precedingOrId, parentOrId, insert }) => {
    let preceding, parent

    if(isSet(precedingOrId)) {
      const id = precedingOrId?.id ?? precedingOrId
      preceding = { ...findById(raw, id) }
      ;({ parent } = preceding)

      if(!parent) {
        toast({
          title: 'Indivisible Root',
          description: 'Root must be a single node. Children will be a partition…',
          status: 'warning',
          duration: 12000,
          isClosable: true,
        })
        return partition({ parentOrId: precedingOrId, insert })
      }
    } else if(isSet(parentOrId)) {
      const id = parentOrId?.id ?? parentOrId
      parent = { ...findById(raw, id) }
    } else {
      console.warn(`partition called with no id (precedingOrId or parentOrId)`)
      return null
    }

    const { children: siblings } = parent
    parent.partition = true // this could be problematic

    insert = newNode({
      ...insert,
      parent,
      new: true,
    })

    console.info({ insert })

    let pos = siblings.findIndex((child) => child.id === preceding?.id)
    pos = pos >= 0 ? pos : siblings.length
    const inserted = {
      ...parent,
      children: [
        ...siblings.slice(0, pos + 1),
        insert,
        ...siblings.slice(pos + 1),
      ]
    }
    const insertion = ({ node, visit }) => {
      if(node.id === inserted.id) {
        return inserted
      }
      node.children = (
        node.children.map((child) => (
          visit({ node: child, method: insertion })
        ))
      )
      return node
    }
    setRaw((raw) => {
      return visit({
        node: clone(raw), method: insertion
      })
    })
  }

  const indexInParent = (nodeOrID) => {
    const node = (
      typeof(nodeOrID) === 'object'
      ? nodeOrID : findById(stops, nodeOrID)
    )
    return siblingsOf(node)?.indexOf(node)
  }
  
  const activate = ({
    precedingOrParent: preceded,
    postcedingOrParent: postceded,
  }) => {
    if(preceded) {
      let node = findById(stops, preceded)
      if(!isEmpty(node?.children, { undefIs: true })) {
        setActiveId(node.children[0].id)
      } else {
        const index = indexInParent(node)
        const max = node?.parent?.children?.length - 1
        if(node.parent) {
          if(index === max) {
            activate({
              precedingOrParent: node.parent
            })
          } else if(index < max) {
            setActiveId(node.parent.children[index + 1].id)
          }
        }
      }
    }

    if(postceeded) {
      let node = findById(stops, postceeded)
      const index = indexInParent(node)
      if(index === 0 && node.parent) {
        setActiveId(node.parent.id)
      } else if(index > 0) {
        setActiveId(
          node.parent.children[index - 1].id
        )
      }
    }
  }

  const seekTo = (time) => {
    console.info('Seeking To', time)
    if(video.current) {
      video.current.currentTime = time
    }
    setEventsTime(time)
  }

  const serialize = ({ root, simplify = true }) => {
    const strip = (
      ({ node, visit }) => {
        const { children } = node

        delete node.parent // circular reference error if not removed
        if(node.raw?.parent) {
          delete node.raw.parent
        }

        if(simplify) {
          delete node.id
          if(!node.partition) {
            delete node.partition
          }
          if(children.length === 0) {
            delete node.children
          }
          delete node.raw
        }
        if(children.length > 0) {
          node.children = children.map(
            (child) => (
              visit({ node: child, method: strip })
            )
          )
        }

        return node
      }
    )
    root = (
      visit({ node: clone(root), method: strip })
    )
    const metadata = {
      video: info,
      stops: root,
    }

    try {
      return new Blob(
        [JSON5.stringify(metadata, null, 2)],
        { type: "text/json" },
      )
    } catch(error) {
      console.error({ error })
    }
  }

  const display = () => {
    const json5 = serialize({ root: raw })
    const url = window.URL.createObjectURL(json5)
    window.open(url, '_blank').focus()
  }

  const debug = () => {
    const json5 = serialize({
      root: stops, simplify: false,
    })
    const url = window.URL.createObjectURL(json5)
    window.open(url, '_blank').focus()
  }

  const upload = async () => {
    const json5 = serialize({ root: raw })
    const name = raw.title.replace(/\//g, '⁄')
    const path = `${name}.json5`
    const result = (
      await ipfs.add(
        { 
          path,
          content: json5,
        },
        {
          pin: true,
          wrapWithDirectory: true,
          cidVersion: 0,
        },
      )
    )
    const cid = result.cid.toString()
    const url = `ipfs://${cid}/${path}`
    history.push(`/publish/${url}`)
  }

  return (
    <>
      <VideoSettings
        open={videoSettingsOpen}
        close={closeVideoSettings}
        {...{ info, setInfo }}
      />
      <KeyboardShortcuts
        open={shortcutsOpen}
        close={closeShortcuts}
      />
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
            <GridItem id="spans">
              <Times
                {...{
                  startsAt, duration, time, active,
                  seekTo, hovered, setHovered,
                  togglePause,
                }}
                node={stops}
                h={`calc(100vh - ${vidHeight}px)`}
              />
            </GridItem>
            <GridItem id="events" overflowY="scroll">
              <Events
                {...{
                  insertChild, insertParent,
                  duration, replaceNode,
                  hovered, setHovered,
                  seekTo, active, togglePause,
                  activeId, setActiveId,
                }}
                time={eventsTime}
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
          <Flex
            maxH="100%" maxW="100vw"
            overflow="hidden"
          >
            <DateTime {...{
              startsAt, time, video, togglePause,
            }}/>
            {!src ? (
              <Flex flexGrow={1} justify="space-evenly">
                <Heading>
                  Recording In Progress:{' '}
                  {stringFor(duration)}
                </Heading>
              </Flex>
            ) : (
              <Video
                flexGrow={1} controls
                maxH="100%" maxW="calc(100vw - 9.5em)"
                ref={video}
              >
                <source {...{ src, type: 'video/mp4' }} />
                {/* {VTT && <track default src={VTT}/>} */}
              </Video>
            )}
            <Wrap
              alignSelf="center" justify="center"
              flexGrow={0} spacing="0.1em"
              shouldWrapChildren={true}
            >
              <Button
                title="Upload to Ceramic"
                onClick={upload}
                h="auto" minW={0} padding={1}
                variant="outline" colorScheme="blue"
              >
                <Image
                  h={25} w={25}
                  src={CeramicLogo}
                />
              </Button>
              <Button
                title="Edit the video information"
                onClick={openVideoSettings} fontSize={28}
                h="auto" minW={0} padding="0.25em 0.2em 0.1em 0.2em"
                lineHeight={1} variant="outline" colorScheme="blue"
              >⚙</Button>
              <Button
                title="Download the current configuration"
                onClick={display}
                h="auto" minW={0} padding={1}
                variant="outline" colorScheme="blue"
              >⭳</Button>
              <Button
                title="Download the current interpolated configuration"
                onClick={debug}
                h="auto" minW={0} padding={1}
                variant="outline" colorScheme="red"
              >⭳</Button>
              <IPFSButton
                h={6} minW={6} p={1}
                variant="outline" colorScheme="blue"
              />
              <Link
                title="Homepage"
                to="/" p={0.5}
                border="1px solid" fontSize={18} borderRadius={8}
              >🏠</Link>
              <Button
                title="View keyboard shortcuts"
                onClick={openShortcuts}
                h="auto" minW={0} padding={1} fontSize={18}
                variant="outline" colorScheme="blue"
              >⌨</Button>
            </Wrap>
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

export default MarkedVideo