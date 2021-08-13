import {
  Spinner, Stack, Table, Tag, Tbody, Td, Th, Thead, Tr,
} from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { propsFor, stringFor } from 'utils'
import PauseIcon from 'pause.png'
import PlayIcon from 'play.png'

export const Row = ({
  chapter, active = false, head, paused = true, seekTo,
  index, video, ...props
}) => {
  const {
    name: title, tags = [], end, start: currentTime
  } = chapter
  const [highlight, setHighlight] = useState(null)
  const cell = useRef(null)

  const clicked = (elem) => {
    if(active && !video.paused) {
      video.pause()
    } else if(active && video.paused) {
      video.play()
    } else if(!active) {
      video.currentTime = elem.start + 0.01 // it misses
      if(video.paused) {
        video.play()
      }
    }
  }
  const seekListener = (evt) => {
    if(cell.current) {
      const bBox = evt.target.getBoundingClientRect()
      seekTo(
        chapter.start + (
          (chapter.end - chapter.start)
          * ((evt.clientX - bBox.left) / bBox.width)
        )
      )
      if(video.paused) {
        video.play()
      }
    }
  }
  const seekHover = (evt) => {
    const bBox = evt.target.getBoundingClientRect()
    setHighlight(
      100 * Math.max(0, (evt.clientX - bBox.left) / bBox.width)
    )
  }

  let gradient = null
  if(active) {
    const percent = (
      100 * ((head - currentTime) / (end - currentTime))
    )
    gradient = (
      `linear-gradient(
        to right, red, red ${percent}%,
        transparent ${percent + 1}%
      )`
    )
  }
  if(highlight) {
    gradient = (
      `linear-gradient(
        to right, #ff9b37BB, #ff9b37BB ${highlight}%,
        transparent ${highlight + 1}%
      )
      ${gradient ? `, ${gradient}` : ''}`
    )
  }

  const cursor = !active || video?.paused ? PlayIcon : PauseIcon

  return (
    <Tr
      align="center"
      {...propsFor(chapter)}
      {...props}
      sx={{ cursor: `url(${cursor}), auto`}}
    >
      <Td onClick={() => clicked(chapter)}>{index}</Td>
      <Td
        ref={cell}
        bg={gradient}
        onClick={seekListener}
        onMouseMove={seekHover}
        onMouseOut={() => setHighlight(null)}
        cursor="col-resize"
      >
        {`${
          stringFor(currentTime)
        }${
          end ? `+${stringFor(end - currentTime)}` : '‒'
        }`}
      </Td>
      <Td onClick={() => clicked(chapter)}>{title}</Td>
      <Td onClick={() => clicked(chapter)}><Stack>
        {tags.map((t, i) => (
          <Tag
            key={i}
            style={{ textAlign: 'center' }}
            border="2px solid #00000066"
            {...propsFor(chapter)}
            display="block"
            pt={0.5}
          >{t}</Tag>
        ))}
      </Stack></Td>
      <Td onClick={() => clicked(chapter)}>
        {(currentTime < head && head < end && !paused) ? (
          <Spinner/>
        ) : (
          paused ? '▶️' : '⏸️'
        )}
      </Td>
    </Tr>
  )
}

export default ({
  chapters = [], allTags = [], activeTags, time, activeChapter,
  video, seekTo,
}) => {
  console.info({ chapters })

  return (
    <Table
      maxH="100vh" overflow="scroll"
      sx={{ th: { textAlign: 'center' }}}
    >
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
        {chapters.map((chapter, idx) => {
          if(
            allTags.length > 0
            && !chapter.tags?.some(t => activeTags[t])
          ) {
            return null
          }
          return (
            <Row
              key={idx}
              index={idx}
              head={time}
              active={activeChapter === chapter}
              {...{ video, chapter, seekTo }}
              paused={!video || video.paused}
            />
          )
        })}
      </Tbody>
    </Table>
  )
}