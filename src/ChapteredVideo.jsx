import {
  CheckboxGroup, Checkbox, Flex, GridItem, Grid, Tag,
  Wrap, Heading, chakra,
} from '@chakra-ui/react'
import ChapterList from 'ChapterList'
import { useEffect, useRef, useState } from 'react'
import Tags from 'Tags'
import { propsFor, timeFor } from 'utils'

const defaultTags = ['pitch', 'pertinent']

const Video = chakra('video')

export default ({ stops = {}, title, src }) => {
  const vid = useRef()
  const info = useRef()
  const [activeTags, setActiveTags] = useState(
    Object.fromEntries(
      defaultTags.map(t => [t, true])
    )
  )
  const [time, setTime] = useState(0)
  const [chapters, setChapters] = (
    useState(Object.values(stops))
  )

  const seekTo = (time) => {
    vid.current.currentTime = time
  }
  const clicked = (elem) => {
    const currentClicked = info.current === elem
    if(currentClicked && !vid.current.paused) {
      vid.current.pause()
    } else if(currentClicked && vid.current.paused) {
      vid.current.play()
    } else if(!currentClicked) {
      vid.current.currentTime = elem.start + 0.01 // it misses
      if(vid.current.paused) {
        vid.current.play()
      }
    }
  }

  useEffect(() => {
    let prev
    setChapters(
      Object.entries(stops).map(([time, chapter]) => {
        chapter.start = timeFor(time)
        if(prev) {
          prev.end = chapter.start
        }
        return prev = chapter
      })
    )
  }, [stops])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chapterIdx = params.get('chapter')
    if(chapterIdx) {
      seekTo(
        chapters[parseInt(chapterIdx)].start
      )
    }
  }, [chapters])

  useEffect(() => {
    const video = vid.current
    const update = (evt) => {
      const time = evt.target.currentTime
      setTime(time)
      let now = chapters.find(
        (info) => info.start < time && time <= info.end
      )
      if(now && !now.tags?.some(t => activeTags[t])) {
        const nxt = chapters.find(
          (info) => (
            info.tags?.some(t => activeTags[t])
            && info.start >= time
          )
        )
        if(nxt) {
          clicked(nxt)
          now = nxt
        }
      }
      info.current = now
    }
    video.addEventListener('timeupdate', update)
    return () => {
      video.removeEventListener('timeupdate', update)
    }
  }, [activeTags, chapters])

  const allTags = [...new Set(
    chapters
    .map(info => info.tags ?? [])
    .flat()
  )]

  return (
    <Grid
      as="form"
      templateRows="0fr 1fr 0fr"
      templateColumns={['1fr', '1fr 0fr']}
      maxH="95vh"
    >
      <GridItem rowSpan={1} colSpan={2}>
        <Heading textAlign="center" p={5}>
          {info.current?.name ?? title}
        </Heading>
      </GridItem>
      <GridItem rowSpan={1} colSpan={2}>
        <Video
          controls
          ref={vid}
          w="100%" minW={64} maxH="95vh"
        >
          <source {...{ src, type: 'video/mp4' }}/>
          {/* {VTT && <track default src={VTT}/>} */}
        </Video>
      </GridItem>
      <GridItem rowSpan={1} colSpan={1}>
        <Tags {...{ allTags, activeTags, setActiveTags }}/>
      </GridItem>
      <GridItem rowSpan={2} colSpan={1}>
        <ChapterList
          {...{ chapters, time, seekTo }}
          activeChapter={info.current}
          video={vid.current}
        />
      </GridItem>
    </Grid>
  )
}