// @ts-check

import { useDisclosure, Stack, Flex, Tooltip, Heading, Spacer, ButtonGroup, Button, Box, Divider, Image } from '@chakra-ui/react'
import { useState } from 'react'
import demark from 'remove-markdown'
import Markdown from 'react-markdown'
import { newNode } from '../lib/stops'
import { colorFor, isSet } from '../lib/utils'
import NodeSettings from './NodeSettings'
import { icons } from './TypeSelect'

export const WrapPartition = ({ children, node }) => {
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

export const Events = ({
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
    setActiveId(node.id)
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
          key={child.id}
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
        px={3} w="full"
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
            userSelect="none"
          >
            <Markdown linkTarget="_blank">
              {node.title}
            </Markdown>
          </Heading>
          <Spacer />
          {menuVisible && (
            <ButtonGroup color="white">
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
              borderColor="white"
            >
              <Divider color="white"/>
              <Box color="white">
                <Markdown linkTarget="_blank">
                  {node.body}
                </Markdown>
              </Box>
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
              key={child.id}
              node={child}
              count={count + index + 1}
            />
          ))}
        </WrapPartition>
      </Stack>
    </>
  )
}

export default Events