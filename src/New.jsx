import { useState } from 'react'
import {
  FormControl, FormLabel, Button, Input, Stack,
  ButtonGroup, Progress,
} from '@chakra-ui/react'
import { useHistory } from 'react-router'
import JSON5 from 'json5'
import { isSet, isoStringFor } from './utils'


export default ({
  IPFSButton, ipfs, ConnectButton,
}) => {
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState(null)
  const [total, setTotal] = useState(null)
  const [progress, setProgress] = useState(null)
  const history = useHistory()

  const submit = async (evt) => {
    evt.preventDefault()
    const { target: form } = evt
    const [file] = form.video.files
    setTotal(file.size)
    let path = file.name
    let result = (
      await ipfs.add(
        {
          path,
          content: file,
        },
        {
          pin: true,
          wrapWithDirectory: true,
          cidVersion: 0,
          progress: (progress) => {
            setProgress(progress)
          },
        },
      )
    )
    let cid = result.cid.toString()
    let url = `ipfs://${cid}/${path}`

    const json5 = JSON5.stringify(
      {
        video: {
          startsAt: startsAt.toISOString(),
          source: url,
        },
        stops: {
          title,
          partition: true,
        },
      },
      null,
      2,
    )

    setTotal(json5.length)
    path = `${title}.json5`
    result = (
      await ipfs.add(
        {
          path,
          content: json5,
        },
        {
          pin: true,
          wrapWithDirectory: true,
          cidVersion: 0,
          progress: (progress) => {
            setProgress(progress)
          },
        },
      )
    )
    cid = result.cid.toString()
    url = `ipfs://${cid}/${path}`

    history.push(`/${url}`)
  }

  const fileChange = ({ target: { files } }) => {
    if(files.length > 0) {
      const [file] = files
      const regex = /^([\d⁄:@]+)\.(.+)\.mp4$/i
      const match = file.name.match(regex)
      if(!match) {
        console.warn(`"${file.name}" didn't match "${regex.toString()}"`)
      } else {
        let time = (
          match[1].replace(/⁄/g, '-')
          .replace(/@/g, 'T')
        )
        if(!isSet(startsAt)) {
          setStartsAt(new Date(time))
        }
        if(!isSet(title)) {
          setTitle(match[2])
        }
      }
    }
  }

  return (
    <Stack
      as="form" maxW="30em" m="auto"
      onSubmit={submit}
      sx={{ 'label:after': { content: '":"' } }}
    >
      <ConnectButton/>
      <FormControl mt={4}>
        <FormLabel>Video</FormLabel>
        <Input
          id="video" type="file"
          onChange={fileChange}
        />
      </FormControl>
      <FormControl mt={4}>
        <FormLabel>Title</FormLabel>
        <Input
          value={title}
          onChange={({ target: { value } }) => {
            setTitle(value)
          }}
        />
      </FormControl>
      <FormControl mt={4}>
        <FormLabel>Start Time</FormLabel>
        <Input
          type="datetime-local"
          value={
            isoStringFor(
              startsAt,
              { standard: true, tz: false },
            )
            ?? ''
          }
          onChange={({ target: { value } }) => {
            setStartsAt(new Date(value))
          }}
        />
      </FormControl>
      <FormControl mt={1}>
        <ButtonGroup w="full">
          <Button
            type="submit" flexGrow={1}
            disabled={
              !isSet(title)
              || !isSet(startsAt)
              || !isSet(video)
            }
          >
            Upload
          </Button>
          <IPFSButton ml={4}/>
        </ButtonGroup>
      </FormControl>
      {isSet(total) && isSet(progress) && (
        <Progress value={100 * progress / total}/>
      )}
    </Stack>
  )
}