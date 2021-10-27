import {
  Box, Button, ButtonGroup, Flex, GridItem, Grid, Heading,
  Stack, Spacer, Spinner, chakra, useDisclosure, Input,
  ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalCloseButton, ModalBody, FormControl, FormLabel,
  Modal, Text, Textarea, Divider, Image, Tooltip, Wrap,
  Tabs, TabList, TabPanels, Tab, TabPanel, Checkbox,
  UnorderedList, ListItem, IconButton, useToast,
  useColorModeValue,
} from '@chakra-ui/react'
import React, {
  useEffect, useRef, useState, useMemo,
} from 'react'
import Markdown from 'react-markdown'
import demark from 'remove-markdown'
import { v4 as uuid } from 'uuid'
import { HashLink as Link } from 'react-router-hash-link'
import { useHistory } from 'react-router-dom'
import { useLocation } from 'react-router'
import JSON5 from 'json5'
import useDownshift from 'use-downshift'
import { TiBackspace } from 'react-icons/ti'
import {
  isoStringFor, stringFor, timeFor, isEmpty,
  isSet, ifSet, capitalize, load, toHTTP,
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
import roundtable from './images/roundtable.svg'
import PlayButton from './images/play.svg'
import PauseButton from './images/pause.svg'

const icons = {
  plan, decision, issue, presenter, previously,
  discussion, logistics, blocked, roundtable,
  unknown,
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

const visit = ({ node, method, extra }) => {
  return method.apply(
    node, [{ node, extra, visit }]
  )
}

const siblingsOf = (node) => {
  const {
    parent: { children: siblings } = (
      { children: null }
    )
  } = node
  return !node.parent ? [node] : siblings
}

const connect = ({ stops }) => {
  const parent = ({
    node, visit,
  }) => {
    const { children = [] } = node

    node.children = children.map((child) => {
      child = visit({
        node: newNode(child), method: parent
      })
      child.parent = node
      return child
    })
    return node
  }

  if(Array.isArray(stops)) {
    stops = { children: stops }
  }
  return visit({
    node: newNode(stops), method: parent,
  })
}

const clone = (stops) => connect({ stops })

const append = (array, ...entries) => (
  (array ?? []).concat(entries.flat())
)

const generate = ({ root, duration, raw, toast }) => {
  const fix = ({
    node,
    extra: { roles: incomingRoles = {} } = {},
    visit,
  }) => {
    node.raw = findById(raw, node.id)

    const { children = [] } = node

    children.forEach((child) => {
      ['duration', 'startOffset'].forEach((attr) => {
        if (typeof child[attr] === 'string') {
          child[attr] = timeFor(child[attr])
        }
      })
    })

    const siblings = siblingsOf(node)
    const index = siblings.indexOf(node)
    const { parent } = node

    if(
      !isSet(node.startOffset)
      || isNaN(node.startOffset)
    ) {
      if(parent?.partition) {
        if(index === 0) {
          node.startOffset = parent.startOffset
        } else if(
          index >= 1
          && index <= siblings.length - 1
        ) {
          node.startOffset = (
            siblings[index - 1].startOffset
            + siblings[index - 1].duration
          )
        } else {
          console.warn(
            'Bad Index',
            { index, node, siblings },
          )
        }
      } else if(parent) {
        node.startOffset = parent.startOffset
      } else {
        node.startOffset = 0
      }
    }

    if(
      !isSet(node.duration)
      || isNaN(node.duration)
    ) {
      if(parent?.partition) {
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
              parent.startOffset + parent.duration
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
          } = parent
          node.duration = (
            (pStart + pDur) - node.startOffset
          )
        } else {
          console.warn(
            'Bad Index',
            { index, node, siblings },
          )
        }
      } else if(parent) {
        node.duration = parent.duration
      } else {
        node.duration = duration
      }
    }
  
    if(!isSet(node.startOffset)) {
      toast({
        title: 'Incalcuable Interpolation',
        description: `No Starting Time: ${node.id}`,
        status: 'error',
        duration: 12000,
        isClosable: true,
      })
    }
    if(!isSet(node.duration)) {
      toast({
        title: 'Incalcuable Interpolation',
        description: `No Event Duration: ${node.id}`,
        status: 'error',
        duration: 12000,
        isClosable: true,
      })
    }

    const roles = { ...incomingRoles }

    Object.entries(node.roles ?? {})
    .forEach(([role, exec]) => {
      Object.entries(exec)
      .forEach(([action, users]) => {
        switch(action) {
          case 'enter':
            roles[role] = (
              append(roles[role], ...users)
            )
            if(exec.persist === true) {
              incomingRoles[role] = (
                append(incomingRoles[role], ...users)
              )
            } else {
              users.forEach((userOrObj) => {
                if(userOrObj.persist) {
                  incomingRoles[role] = append(
                    incomingRoles[role], userOrObj
                  )
                }
              })
            }
            incomingRoles[role] = (
              (incomingRoles[role] ?? []).filter(
                (u) => u.persist !== false
              )
            )
          break
          case 'exit':
            users.forEach((user) => {
              incomingRoles[role]?.splice(
                incomingRoles[role].indexOf(user),
                1,
              )
            })
          break
          case 'persist': break
          default:
            toast({
              title: 'Role Actions Error',
              description: `Unknown Role Action: "${action}"`,
              status: 'error',
              duration: 12000,
              isClosable: true,
            })
          break
        }
      })
    })

    node.roles = { ...roles }

    node.children = children.map((child) => (
      visit({
        node: child, method: fix, extra: { roles }
      })
    ))

    return node
  }

  return visit({ node: clone(root), method: fix })
}

const Spans = ({
  node, count = 1, active, seekTo,
  hovered, setHovered, togglePause,
}) => {
  if (!node) return null

  const ref = useRef(null)

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
      let removed = null
      do {
        removed = (
          dup.splice(ids.indexOf(node.id), 1)
        )
      } while(removed.length > 0)
      return dup
    })
  }
  const click = ({ node, event }) => {
    let goto = node.startOffset
    if(!event.ctrlKey) {
      const rect = ref.current.getBoundingClientRect()
      const y = event.clientY - rect.top
      goto += (
        node.duration * y / ref.current.scrollHeight
      )
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
    seekTo(goto)
  }
  const doubleClick = () => {
    togglePause()
  }

  const {
    id, children = [], startOffset,
    duration, partition, raw, ...rest
  } = node

  if(isEmpty(rest)) {
    return (
      children.map((child, idx) => (
        <Spans
          {...{
            duration, active, togglePause,
            hovered, setHovered, seekTo,
          }}
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
  let name = demark(node.title)
  if(node.type) {
    name = `${capitalize(node.type)}: ${name}`
  }

  return (
    <Tooltip label={name}>
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
        p={0} w="full" {...{ className, ref }}
        sx={{
          '&.hovered::before': { opacity: 1 }
        }}
        onMouseEnter={() => mouseOver(node)}
        onMouseLeave={() => mouseOut(node)}
        borderLeft="4px solid"
        borderRight="2px solid"
        borderColor={active.includes(node.id) ? (
          '#00FF00'
        ) : (
          'transparent'
        )}
        onClick={(event) => click({ node, event })}
        onDoubleClick={() => doubleClick(node)}
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
              {...{
                duration, active, togglePause,
                hovered, setHovered, seekTo,
              }}
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
    pointerEvents="none"
    px="0.1rem" {...props}
  >
    {children}
  </Box>
))

const Times = ({
  node, startsAt, duration, time, seekTo,
  hovered, setHovered, active, togglePause,
  ...props
}) => {
  const ref = useRef(null)
  const endsAt = useMemo(() => (
    new Date(startsAt.getTime() + duration * 1000)
  ), [startsAt, duration])

  const clicked = (evt) => {
    const rect = ref.current.getBoundingClientRect()
    const y = evt.clientY - rect.top
    const goto = duration * y / ref.current.scrollHeight
    seekTo(goto)
  }

  if (!(endsAt instanceof Date) || !node) {
    return null
  } else {
    const ends = isoStringFor(
      endsAt, { date: false, tz: false },
    )
    const headPosition = (
      ref.current?.scrollHeight * time / duration 
    )

    return (
      <Flex position="relative" {...props}>
        <Flex
          direction="column" key="times"
          onClick={clicked}
          onDoubleClick={togglePause}
          {...{ ref }}
        >
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
          <Box
            position="absolute"
            height={`${headPosition}px`} w="full"
            borderBottom="3px dashed #99999977"
          />
          <Spacer />
          <TimeBox borderBottom="2px dashed">
            {ends}
          </TimeBox>
        </Flex>
        <Flex>
          <Spans
            {...{
              node, active, togglePause,
              hovered, setHovered, seekTo,
            }}
          />
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

const RoleItems = ({
  event, role, holders = [], persist = false,
  remove, changed,
}) => (
  <React.Fragment>
    <GridItem
      rowSpan={holders.length}
    >{role}</GridItem>
    {(holders).map((userOrObj, idx) => {
      const username = userOrObj.name ?? userOrObj
      return (
        <React.Fragment key={idx}>
          <GridItem>{username}</GridItem>
          {event !== 'exit' && (
            <GridItem>
              <Checkbox
                w={3} h={3} p={0}
                value={username}
                isChecked={
                  userOrObj.persist ?? persist
                }
                onChange={({ target: {
                  checked: persist, value: targetUser,
                } }) => {
                  changed({
                    persist, targetUser, role,
                  })
                }}
              />
            </GridItem>
          )}
          <GridItem>
            <Button
              h="auto" value={username}
              onClick={({
                target: { value: user }
              }) => {
                remove({ user, role, event })
              }}
            >−</Button>
          </GridItem>
        </React.Fragment>
      )
    })}
  </React.Fragment>
)

const RoleInputs = ({
  entry, idx, event, setCreate,
}) => (
  <React.Fragment>
    <GridItem>
      <Input
        value={entry.role} autoFocus
        textAlign="center"
        onChange={({ target: { value } }) => {
          setCreate((old) => [
            ...old.slice(0, idx),
            { ...entry, role: value },
            ...old.slice(idx + 1),
          ])
        }}
      />
    </GridItem>
    <GridItem>
      <Input
        value={entry.name}
        textAlign="center"
        onChange={({ target: { value } }) => {
          setCreate((old) => [
            ...old.slice(0, idx),
            { ...entry, name: value },
            ...old.slice(idx + 1),
          ])
        }}
      />
    </GridItem>
    {event !== 'exit' && (
      <GridItem>
        <Checkbox
          isChecked={entry.persist}
          onChange={({ target: { checked } }) => {
            setCreate((old) => [
              ...old.slice(0, idx),
              { ...entry, persist: checked },
              ...old.slice(idx + 1),
            ])
          }}
        />
      </GridItem>
    )}
    <GridItem>
      <Button
        h="auto"
        onClick={() => {
          setCreate((old) => [
            ...old.slice(0, idx),
            ...old.slice(idx + 1),
          ])
        }}
      >−</Button>
    </GridItem>
  </React.Fragment>
)

const Roles = ({
  title, event, editable = true,
  roles, setRoles, create, setCreate,
}) => {
  const changed = ({ persist, targetUser, role }) => {
    setRoles((roles) => {
      const entry = roles[role]
      const processed = (
        [...(entry[event] ?? [])].map((userOrObj) => {
          const name = (
            userOrObj.name ?? userOrObj
          )
          if(name === targetUser) {
            if(persist || entry.persist) {
              return { name, persist }
            }
            return name
          }
          if(
            entry.persist
            && userOrObj.persist !== false
          ) {
            return { name, persist: true }
          }
          return userOrObj
        })
      )
      return {
        ...roles,
        [role]: {
          ...entry,
          [event]: processed,
        },
      }
    })
  }

  const remove = ({ user, role, event }) => {
    setRoles((roles) => {
      const processed = (
        [...(roles[role][event] ?? [])]
        .filter((u) => (
          u.name !== user && u !== user
        ))
      )
      return {
        ...roles,
        [role]: {
          ...roles[role],
          [event]: processed,
        },
      }
    })
  }

  const add = () => {
    setCreate((old) => [
      ...old,
      {
        role: '', event,
        name: '', persist: false,
      }
    ])
  }

  if(isEmpty(roles ?? {})) {
    roles = { holder: [] }
  }

  const roleList = useMemo(() => {
    const evented = {}
    Object.entries(roles).forEach(
      ([role, events]) => {
        if(events[event] && !isEmpty(events[event])) {
          evented[role] = events[event]
        }
      }
    )
    return evented
  }, [roles, event])

  const creates = useMemo(() => (
    create.filter((entry) => (
      entry.event === event
    ))
  ), [create, event])
  
  const templateColumns = (
    !editable ? '1fr 1fr' : (
      event === 'exit'
      ? '2fr 1fr 1fr' : '2fr 2fr 1fr 1fr'
    )
  )

  return (
    <>
      <Flex>
        {editable && (
          <Button
            h="auto" minW="auto" mr={2}
            onClick={add}
          >+</Button>
        )}
        {title && (
          <Heading
            fontSize={24}
            _after={{ content: '":"' }}
          >{title}</Heading>
        )}
      </Flex>
      <Grid
        {...{ templateColumns }}
        sx={{ '& > *': {
          border: '1px solid',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        } }}
      >
        <GridItem fontWeight="bold">Role</GridItem>
        <GridItem fontWeight="bold">User</GridItem>
        {editable && (
          <>
            {event !== 'exit' && (
              <GridItem
                fontWeight="bold" fontStyle="italic"
                title="Role will appear in following siblings as well as, like all nodes, children."
              >Persist</GridItem>
            )}
            <GridItem
              fontWeight="bold" fontStyle="italic"
            >Remove</GridItem>
          </>
        )}
        {isEmpty(roleList) && isEmpty(creates) ? (
          <GridItem
            colSpan={editable ? (
              event === 'exit' ? 3 : 4
            ) : (
              2
            )}
          >
            <em>No Entries</em>
          </GridItem>
        ) : (
          Object.entries(roleList).map(
            ([role, holders], idx) => (
              <RoleItems
                key={idx}
                {...{
                  event, role, holders,
                  remove, changed, editable,
                }}
              />
            )
          )
        )}
        {creates.map((entry, idx) => (
          <RoleInputs
            key={idx}
            {...{ entry, idx, event, setCreate }}
          />
        ))}
      </Grid>
    </>
  )
}

const TypeSelect = ({
  type, setType, scrollId,
}) => {
  const types = useMemo(
    () => Object.keys(icons),
    [icons],
  )
  const borderColor = useColorModeValue(
    'gray.800', 'rgba(255, 255, 255, 0.16)'
  )
  const bgColor = useColorModeValue(
    'white', 'gray.700'
  )
  const {
    inputValue,
    isOpen,
    getRootProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getToggleButtonProps,
    highlightedIndex,
    selectedItem,
  } = useDownshift({
    onChange: () => {
      if(scrollId) {
        const elem = (
          document.getElementById(scrollId)
        )
        elem?.scrollIntoView()
      }
    },
    onInputValueChange: (input) => {
      setType(input)
    },
    selectedItem: type,
  })

  const found = []
  const missed = []
  types.forEach((item) => {
    if(
      !isSet(inputValue)
      || (
        item.toLowerCase()
        .includes(inputValue.toLowerCase())
      )
    ) {
      found.push(item)
    } else {
      missed.push(item)
    }
  })
  const splitIndex = found.length - 1
  const sorted = found.sort().concat(missed.sort())

  return (
    <Box
      w="full"
      {...getRootProps()}
    >
      <Flex>
        <Box h={8} minW={8} mr={2}>
          {icons[type] && (
            <Image
              src={icons[type]}
              w="full" h="full" mt={1}
            />
          )}
        </Box>
        <Input {...getInputProps()}/>
        <Tooltip hasArrow label="Clear the Field">
          <IconButton
            zIndex={6} variant="outline"
            tabindex={-1}
            icon={<TiBackspace/>}
            onClick={() => setType('')}
          />
        </Tooltip>
        <Tooltip hasArrow label="Type Options">
          <Button
            zIndex={6} rtabindex={-1}
            {...getToggleButtonProps()}
          >
            ▼
          </Button>
        </Tooltip>
      </Flex>

      {isOpen && (
        <UnorderedList
          {...getMenuProps()}
          position="absolute"
          sx={{
            //listStyle: 'none',
            '.split': {
              borderBottom: `5px double ${borderColor}`,
            },
          }}
          w="full" zIndex={5} m={0}
          bg={bgColor}
          border={`1px solid ${borderColor}`}
        >
          {sorted.map((item, idx) => (
            <ListItem
              {...getItemProps({
                key: idx,
                item,
                selected: selectedItem === item,
              })}
              bg={
                highlightedIndex === idx
                ? '#FF55FF66' : 'auto'
              }
              pl={3} lineHeight={2}
              display="flex" justify="center"
              className={
                idx === splitIndex ? 'split' : ''
              }
            >
              <Image
                src={icons[item]}
                w={8} h={8} mr={2}
              />
              <Text flexGrow={1}>{item}</Text>
            </ListItem>
          ))}
        </UnorderedList>
      )}
    </Box>
  )
}

const NodeSettings = ({
  open, closeNodeSettings, node,
  replaceNode, ...props
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
  const [roles, setRoles] = (
    useState(node.raw.roles ?? {})
  )
  const [create, setCreate] = useState([])
  const [type, setType] = (
    useState(node.raw.type ?? '')
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

  const onClose = () => {
    delete node.new
    delete node.raw.new    
    closeNodeSettings()
  }

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
  const setDuration = (str, { sync = true } = {}) => {
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
  const setEndOffset = (str, { sync = true } = {}) => {
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
      roles, type,
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
    node.id, roles, create, type,
  ])
  const save = (evt) => {
    evt.preventDefault()
    create.forEach(({ role, event, name, persist }) => {
      replacement.roles ??= {}
      replacement.roles[role] ??= {}
      replacement.roles[role][event] ??= []
      replacement.roles[role][event].push(
        persist ? { name, persist } : name
      )
    })
    Object.entries(replacement.roles).forEach(
      ([role, exec]) => {
        const numEntries = (
          Object.entries(exec).map(
            ([event, users]) => (
              users?.length ?? 0
            )
          )
          .reduce((acc, l) => acc + l, 0)
        )
        if(numEntries === 0) {
          delete replacement.roles[role]
        }
      }
    )
    if(Object.keys(replacement.roles ?? {}).length === 0) {
      delete replacement.roles
    }
    setCreate([])
    replaceNode({ node, replacement })
    onClose()
  }

  if(node.new) {
    open = true
  }

  return (
    <Modal
      size="xl" initialFocusRef={initialRef}
      lockFocusAcrossFrames={true}
      {...{ ...props, onClose }}
      isOpen={open}
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
              <Tab>Roles</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
              <FormControl mt={4}>
                <FormLabel>Title</FormLabel>
                  <Input
                    autoFocus
                    ref={initialRef} value={title ?? ''}
                    onChange={({ target: { value }}) => {
                      setTitle(value)
                    }}
                  />
                </FormControl>
                <FormControl
                  id={`typeselect-${node.id}`}
                  mt={4}
                >
                  <FormLabel>Type</FormLabel>
                  <TypeSelect
                    {...{ type, setType }}
                    scrollId={
                      `typeselect-${node.id}-label`
                    }
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
              <TabPanel>
                <FormControl mt={4}>
                  <Roles
                    title="Entrances"
                    {...{
                      node, event: 'enter',
                      roles, setRoles,
                      create, setCreate,
                    }}
                  />
                </FormControl>
                <FormControl mt={4}>
                  <Roles
                    title="Exits"
                    {...{
                      node, event: 'exit',
                      roles, setRoles,
                      create, setCreate,
                    }}
                  />
                </FormControl>
                <FormControl mt={4}>
                  <Roles
                    title="Inherited"
                    editable={false}
                    {...{
                      node, roles, setRoles,
                      create, setCreate,
                    }}
                  />
                </FormControl>
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
  index = 0, active, togglePause, time, activeId,
  setActiveId, ...props
}) => {
  const [menuVisible, setMenuVisible] = (
    useState(false)
  )
  const [bodyVisible, setBodyVisible] = (
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

  const addChild = (parentOrId) => {
    insertChild({ parentOrId })
  }
  const addPartition = (sibling) => {
    const { parent } = sibling
    if(!parent?.partition) {
      insertParent({
        child: sibling,
        insert: { partition: true },
        siblings: [newNode({ title: 'part' })],
      })
    } else {
      insertChild({
        parent,
        insert: { title: 'new' },
        anchor: sibling,
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
      parentOrId, insert: { title: 'para' }, anchor: sibling
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
  const doubleClick = ({ node, event }) => {
    event.stopPropagation()
    togglePause()
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
            seekTo, index, active, time,
            togglePause, activeId,
            setActiveId,
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

  const prefix = (
    node.type
    ?? node.title?.replace(/:.*/g, '').toLowerCase()
  )
  let icon = icons[prefix]
  if(!icon) {
    icon = icons.unknown
  }

  const xColor = (
    active.includes(node.id)
    ? ('#00FF00') : ('transparent')
  )
  const yColor = (
    activeId === node.id
    ? ('#FF0000') : ('transparent')
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
        px={3} w="full" minH="3em"
        pt="2px ! important" // eyeballed
        sx={{
          '& > div > div:first-of-type': {
            marginTop: '-4px',
          },
          '& > div > div:last-of-type': {
            marginBottom: '-4px',
          },
          '& > div > div:first-of-type:last-of-type': {
            paddingTop: '4px',
          },
          '&.hovered::before': { opacity: 1 },
        }}
        onMouseEnter={() => mouseOver(node)}
        onMouseLeave={() => mouseOut(node)}
        onDoubleClick={(event) => {
          doubleClick({ node, event })
        }}
        onClick={(evt) => {
          evt.stopPropagation()
          seekTo(node.startOffset)
          if(evt.ctrlKey) {
            setActiveId((activeId) => (
              node.id === activeId
              ? null : node.id
            ))
          }
        }}
        borderRight={`2px solid ${xColor}`}
        borderLeft={`5px solid ${xColor}`}
        borderTop={`4px dashed ${yColor}`}
        borderBottom={`4px dashed ${yColor}`}
        {...props} {...{ className }}
      >
        <Flex>
          {icon && (
            <Tooltip label={prefix}>
              <Image
                borderRadius="50%" bg="#FFFFFF55"
                minW={10} maxW={10} minH={10} maxH={10}
                p={0.5} mr={1}
                src={icon} alt={prefix}
                border="1px solid black"
              />
            </Tooltip>
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
                title="Remove Node"
                onClick={() => removeNode(node)}
              >➖</Option>
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
                title="Edit This Node"
                onClick={() => edit(node)}
              >✏️</Option>
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
        {isSet(node.body) && (
          <Box
            padding="0.2em"
            marginTop="-0.2em ! important"
            marginBottom={`
              ${bodyVisible ? 0 : 'calc(-0.4em - 12px)'}
              ! important
            `}
            h={bodyVisible ? 'auto' : '12px'}
            boxSizing="content-box"
            zIndex={3}
            title="Further Information" cursor="pointer"
            onClick={() => setBodyVisible(
              (visible) => !visible
            )}
          >
            <Box
              sx={{
                a: { borderBottom: 'dashed' },
                'a:hover': { borderBottom: 'solid' },
              }}
              _hover={{
                borderStyle: 'solid',
              }}
              border={bodyVisible ? 'none' : '6px dotted'}
              overflow="hidden"
              height={bodyVisible ? 'auto' : 0}
              width={bodyVisible ? 'auto' : '50%'}
              padding="0 ! important"
              marginTop={`${bodyVisible ? '0.25em' : 0} ! important`}
              marginBottom={`${bodyVisible ? 0 : '-12px'} ! important`}
            >
              <Divider color="white"/>
              <Markdown linkTarget="_blank">
                {node.body}
              </Markdown>
            </Box>
          </Box>
        )}
        <WrapPartition {...{ node }}>
          {node.children?.map((child, index) => (
            <Events
              {...{
                duration, insertChild,
                insertParent, replaceNode,
                hovered, setHovered,
                seekTo, index, active, time,
                togglePause, activeId,
                setActiveId,
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
  const [url, setURL] = useState(
    process.env.IPFS_API_URL
    ?? 'https://ipfs.infura.io:5001'
  )

  const save = (evt) => {
    evt.preventDefault()
    setInfo((info) => ({
      ...info,
      startsAt: new Date(startsAt),
      source,
    }))
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
              value={source ?? ''}
              onChange={({ target: { value }}) => {
                setSource(value)
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

const DateTime = ({
  startsAt, time, video, togglePause,
}) => {
  const current = (
    new Date(startsAt.getTime() + time * 1000)
  )
  const opts = { date: false, tz: false }
  const playing = (
    isSet(video.current?.paused) ? (
      !video.current.paused
    ) : (
      false
    )
  )
  return (
    <Flex
      direction="column" lineHeight={1}
      align="center" justify="center"
      position="relative"
      onClick={togglePause}
    >
      <Image
        position="absolute"
        top={0} left={0}
        w="100%" h="calc(100%)"
        p={2} zIndex={3} opacity={0.65}
        src={
          playing ? PauseButton : PlayButton
        }
      />
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
  const video = useRef()
  const [time, setTime] = useState(0)
  const [raw, setRaw] = useState(
    connect({ stops: config.stops })
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
  const {
    isOpen: open,
    onOpen: openVideoSettings,
    onClose: closeVideoSettings,
  } = useDisclosure()
  const history = useHistory()
  const toast = useToast()
  const { ipfs, IPFSButton } = config

  const src = useMemo(
    () => toHTTP(source), [source]
  )

  useEffect(() => {
    const stops = generate({
      root: raw, duration, raw, toast,
    })
    setStops(stops)
    if(activeId === null) {
      setActiveId(stops.id)
    }
  }, [raw, duration])

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
      return null
    }
    const deepest = (list) => {
      for(const sub of list) {
        if(Array.isArray(sub) && sub?.some?.((e) => !!e)) {
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
      const seekable = deepest(search)
      const elem = document.getElementById(seekable)
      elem.scrollIntoView()
      const ids = (
        search.flat(Number.POSITIVE_INFINITY)
        .filter((elem) => !!elem)
      )
      setActive(ids)
    }
  }, [time, stops, activeId])

  const togglePause = (pause = null) => {
    pause = (
      typeof(pause) !== 'boolean' ? (
        !video.current.paused
      ) : (
        pause
      )
    )
    if(pause) {
      video.current.pause()
    } else {
      video.current.play()
    }
  }

  useEffect(() => {
    const keyed = ({ target, key }) => {
      if(
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
      ) {
        return
      }
      switch(key) {
        case 'p': case 'P':
          togglePause()
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
        case 'c':
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
        case 't':
          if(isSet(activeId)) {
            partition({ preceedingOrId: activeId })
          } else {
            toast({
              title: 'No Active Node',
              description: 'To create a partition it is necessary to mark the preceeding sibling active using Control-Left Click.',
              status: 'error',
              duration: 15000,
              isClosable: true,
            })
          }
        break
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
    const update = ({ target: { currentTime: time }}) => {
      setTime(time)
    }
    vid.addEventListener('timeupdate', update)
    return () => {
      vid.removeEventListener('timeupdate', update)
    }
  }, [setTime])

  useEffect(() => {
    const vid = video.current
    const set = () => setDuration(vid.duration)
    vid.addEventListener('loadedmetadata', set)
    return () => {
      vid.removeEventListener('loadedmetadata', set)
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

  const partition = ({ preceedingOrId, insert }) => {
    const id = preceedingOrId?.id ?? preceedingOrId

    if(!isSet(id)) {
      console.warn(`partition called with ${id} id`)
      return null
    }

    const preceeding = { ...findById(raw, id) }
    const { parent } = preceeding.parent
    preceeding.partition = true // this could be problematic
    insert = newNode(insert)
    insert.parent = parent
    insert.new = true
    const { children } = findById(stops, id)
    const pos = children.indexOf(preceeding)
    parent.children = [
      ...children.slice(0, pos + 1),
      insert,
      ...children.slice(pos + 1),
    ]
    const insertion = ({ children, visit }) => (
      children.map((child) => {
        visit({ node: child, method: insertion })
        return (
          child.id === parent.id ? parent : child
        )
      })
    )
    setRaw((raw) => {
      return visit({
        node: clone(raw), method: insertion
      })
    })
  }

  const seekTo = (time) => {
    console.info('Seeking To', time)
    video.current.currentTime = time
    setEventsTime(time)
  }

  const serialize = ({ root, simplify = true }) => {
    const strip = (
      ({ node, visit }) => {
        const { children } = node

        delete node.parent // circular reference error if not removed
        delete node.raw.parent

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
      <VideoSettings {...{
        open, closeVideoSettings,
        info, setInfo,
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
                  startsAt, duration, time, active,
                  seekTo, hovered, setHovered,
                  togglePause,
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
              <Flex>
                <Heading flexGrow={1}>
                  Recording In Progress
                </Heading>
                <Button>Restart</Button>
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
                onClick={openVideoSettings}
                h="auto" minW={0} padding={1}
                variant="outline" colorScheme="blue"
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
                maxH={25} maxW={25}
                variant="outline" colorScheme="blue"
              />
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