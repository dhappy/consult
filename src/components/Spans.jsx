// @ts-check

import { isEmpty, capitalize, colorFor } from '../lib/utils'
import React, { useRef } from 'react'
import { chakra, Flex, Tooltip } from '@chakra-ui/react'
import demark from 'remove-markdown'
import { HashLink } from 'react-router-hash-link'

const Link = chakra(HashLink)

export const Spans = ({
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
    seekTo(goto + 0.1)
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
          display="block" flexGrow={2} minW="0.75em"
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
          display="block" flexGrow={1} minW="0.25em"
          to={`#${node.id}`}
        />
      </Flex>
    </Tooltip>
  )
}

export default Spans